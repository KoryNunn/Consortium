var fs = require('fs');
var path = require('path');
var righto = require('righto');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var util = require('util');
var processSchema = require('../../schemas/process');

var processLogs = {};

function addProcess(tokens, data, callback){
    var scope = this;
    var validProcess = righto(processSchema, data);
    var saved = validProcess.get((processesData) => scope.application.db.processes.save(processesData))
        .get(completeProcessChangeHandlers(scope.application));

    saved(callback);
}

function updateProcess(tokens, data, callback){
    var scope = this;
    var validProcess = righto(processSchema, data);
    var updated = validProcess.get((processesData) => scope.application.db.processes.update({ _id: tokens.id }, processesData))
        .get(completeProcessChangeHandlers(scope.application));

    updated(callback);
}

function removeProcess(tokens, callback){
    var scope = this;
    var removed = righto.sync(() => scope.application.db.processes.remove({ _id: tokens.id }))
        .get(completeProcessChangeHandlers(scope.application));

    removed(callback);
}

function completeProcessChangeHandlers(application){
    return function(arg){
        if(!application.pendingProcessChangeHandlers){
            return;
        }

        while(application.pendingProcessChangeHandlers.length) {
            var handler = application.pendingProcessChangeHandlers.shift();
            handler(null, application);
        }

        clearTimeout(application.pendingProcessChangeTimeout);

        return arg;
    };
}

function addProcessChangeHandler(scope, handler, callback){
    var application = scope.application;

    if(!application.pendingProcessChangeHandlers){
        application.pendingProcessChangeHandlers = [];
        application.pendingProcessChangeTimeout = setTimeout(function(){
            while(application.pendingProcessChangeHandlers.length) {
                var handler = application.pendingProcessChangeHandlers.shift();
                handler({
                    code: 202,
                    message: 'No change, poll again.'
                });
            }
        }, 1000 * 60);
    }

    application.pendingProcessChangeHandlers.push(function(error, application){
        if(error){
            return callback(error);
        }

        handler(callback);
    });
}

function getProcesses(tokens, callback){
    var scope = this;

    if(tokens.queryStringItems.poll){
        addProcessChangeHandler(scope, function(callback){
            getProcesses.call(scope, { queryStringItems: {} }, callback);
        }, callback);
        return;
    }

    var processes = righto.sync(() => scope.application.db.processes.find());

    var addGitInfo = processes.get(processes => righto.all(processes.map(process => {
        if(process.isGit){
            process = {
                ...process,
                branch: righto(getGitBranch, scope.application, process._id)
            };
        }

        if(process.isNodePackage){
            process = {
                ...process,
                scripts: righto(getPackageScripts, scope.application, process._id)
            };
        }

        return righto.resolve(process);
    })));

    addGitInfo(callback);
}

function killProcess(pid, callback){
    exec(`kill -9 -${pid}`, callback);
}

function addProcessLog(processName, data, type){
    processLogs[processName] = processLogs[processName] || [];
    processLogs[processName].push([Date.now(), String(data)]);
    processLogs[processName] = processLogs[processName].slice(-100);
}

function getGitBranch(application, processId, callback){
    var process = righto.sync(() => application.db.processes.find({ _id: processId })).get(0);
    var cwd = process.get('cwd');
    var gitHEADFilePath = cwd.get(cwd => path.join(cwd, './.git/HEAD'));
    var HEADFile = righto(fs.readFile, gitHEADFilePath, 'utf8');
    var branch = HEADFile.get(file => file.match(/ref\: refs\/heads\/(.*)/)[1]);

    branch(callback);
}

function getPackageScripts(application, processId, callback){
    var process = righto.sync(() => application.db.processes.find({ _id: processId })).get(0);
    var cwd = process.get('cwd');
    var packageJsonPath = cwd.get(cwd => path.join(cwd, './package.json'));
    var packageJson = righto(fs.readFile, packageJsonPath, 'utf8').get(JSON.parse);
    var scripts = packageJson.get('scripts');

    scripts(callback);
}

function runProcessScript(process, script, callback){
    var spawnedProcess;
    try{
        spawnedProcess = exec(script, {
            cwd: process.cwd,
            detached: true
        }, function(error){
            callback(error);
        });

        spawnedProcess.stdout.on('data', function(data){
            console.log(process.name + ':', String(data));
            addProcessLog(process.name, data, 'data');
        });

        spawnedProcess.stderr.on('data', function(data){
            console.warn(process.name + ':', String(data));
            addProcessLog(process.name, data, 'error');
        });
    } catch (error){
        callback(error);
    }
}

function runNodePackageScript(tokens, callback){
    var scope = this;
    var { id: processId, scriptName } = tokens;
    var process = righto.sync(() => scope.application.db.processes.find({ _id: processId })).get(0);
    var cwd = process.get('cwd');
    var packageJsonPath = cwd.get(cwd => path.join(cwd, './package.json'));
    var packageJson = righto(fs.readFile, packageJsonPath, 'utf8').get(JSON.parse);
    var scripts = packageJson.get('scripts');
    var script = scripts.get(scriptName).get(() => 'npm run ' + scriptName);
    var scriptRun = righto(runProcessScript, process, script);

    scriptRun(callback);
}

function restartProcess(tokens, callback){
    var scope = this;
    var processId = tokens.id;
    var processes = righto.sync(() => scope.application.db.processes.find({ _id: processId }));
    var process = processes.get(0);

    var restarted = process.get((process) => {
        function run(){
            var spawnedProcess;
            try{
                spawnedProcess = spawn('sh', ['-c', process.runCommand], {
                    cwd: process.cwd,
                    detached: true
                }, function(){
                    scope.application.db.processes.update({ _id: processId }, {
                        pid: null
                    });
                });
            } catch (error){
                return righto.fail(error);
            }


            spawnedProcess.stdout.on('data', function(data){
                console.log(process.name + ':', String(data));
                addProcessLog(process.name, data, 'data');
            });

            spawnedProcess.stderr.on('data', function(data){
                console.warn(process.name + ':', String(data));
                addProcessLog(process.name, data, 'error');
            });

            scope.application.db.processes.update({ _id: processId }, {
                pid: spawnedProcess.pid
            });
        }
        if(process.pid){
            killProcess(process.pid, () => {
                scope.application.db.processes.update({ _id: processId }, {
                    pid: null
                });

                run();
            });
        } else {
            run();
        }
    })
    .get(completeProcessChangeHandlers(scope.application));

    restarted(callback);
}



function rebuildProcess(tokens, callback){
    var scope = this;
    var processId = tokens.id;
    var processes = righto.sync(() => scope.application.db.processes.find({ _id: processId }));
    var process = processes.get(0);

    var restarted = process.get((process) => {
        function run(){
            var spawnedProcess;
            var commandParts = process.buildCommand.split(' ');
            var outputStream = fs.createWriteStream(path.join(__dirname, '../../data', process.name));

            try{
                spawnedProcess = spawn(commandParts[0], commandParts.slice(1), {
                    stdio: ['ignore', outputStream, outputStream],
                    cwd: process.cwd,
                    detached: true
                }, function(){
                    scope.application.db.processes.update({ _id: processId }, {
                        pid: null
                    });
                });
            } catch  (error){
                return righto.fail(error);
            }

            spawnedProcess.stdout.on('data', function(data){
                console.log(process.name + ':', String(data));
            });

            spawnedProcess.stderr.on('data', function(data){
                console.warn(process.name + ':', String(data));
            });

            scope.application.db.processes.update({ _id: processId }, {
                pid: spawnedProcess.pid
            });
        }

        if(process.pid){
            killProcess(process.pid, () => {
                scope.application.db.processes.update({ _id: processId }, {
                    pid: null
                });

                run();
            });
        } else {
            run();
        }
    })
    .get(completeProcessChangeHandlers(scope.application));

    restarted(callback);
}

function checkProcesses(application, callback){
    var processes = righto.sync(() => application.db.processes.find({}));

    var checked = processes.get(processes => righto.all(processes.map(function(process) {
        var pid = process.pid;
        var runningPid = pid ? righto.handle(righto(exec, `kill -0 ${pid}`, {
            stdio: 'pipe',
            cwd: process.cwd
        }).get(() => pid), function(error, done){
            done();
        }) : righto.from(null);

        return runningPid.get(function(currentPid){
            if(currentPid !== pid) {
                return application.db.processes.update({ _id: process._id }, {
                    pid: currentPid
                });
            }
        });
    })));

    var notified = checked.get(results => {
        if(results.some((item) => item)){
            completeProcessChangeHandlers(application)();
        }
    });

    var complete = righto.mate(checked, righto.after(notified));

    complete(function(error){
        if(error){
            console.log(error);
        }

        callback();
    });
}

function stopProcess(tokens, callback){
    var scope = this;
    var processId = tokens.id;
    var processes = righto.sync(() => scope.application.db.processes.find({ _id: processId }));
    var process = processes.get(0);

    var killed = process.get((process) => {
        if(process.pid){
            var killed = righto(killProcess, process.pid);
            var updated = killed.get(() => scope.application.db.processes.update({ _id: processId }, {
                pid: null
            }));

            return updated;
        }
    })
    .get(completeProcessChangeHandlers(scope.application));

    killed(callback);
}

function getProcessLogs(tokens, callback){
    var scope = this;
    var processId = tokens.id;
    var fromTimestamp = Number(tokens.from) || 100;
    var processes = righto.sync(() => scope.application.db.processes.find({ _id: processId }));
    var process = processes.get(0);

    var logs = process.get((process) => {
        if(!process){
            return;
        }

        var logs = processLogs[process.name] || [];
        var results = [];
        var lastIndex = logs.length-1;
        var lastLog = null;

        while(lastIndex >= 0 && (!lastLog || lastLog[0] > fromTimestamp)){
            lastLog = logs[lastIndex--];

            if(lastLog[0] > fromTimestamp){
                results.push(lastLog);
            }
        }

        return results;
    });

    logs(callback);
}

function killAllProcesses(tokens, callback){
    var scope = this;
    var processes = righto.sync(() => scope.application.db.processes.find({}));

    var killed = processes.get(processes => righto.all(processes.map(function(process) {
        var pid = process.pid;

        if(!pid){
            return;c
        }

        var killed = righto(killProcess, pid);
        var updated = righto.sync(() => scope.application.db.processes.update({ _id: process._id }, {
            pid: null
        }), righto.after(killed));
        var logged = updated.get(() => console.log('Killed', process.name + ':', pid));

        return logged;
    })));

    killed(callback);
}

module.exports = function(application){

    function recheckProcesses(){
        if(!application.closed){
            checkProcesses(application, function(){
                setTimeout(recheckProcesses, 500);
            });
        }
    }

    recheckProcesses();

    return {
        addProcess,
        updateProcess,
        removeProcess,
        getProcesses,
        restartProcess,
        stopProcess,
        rebuildProcess,
        getProcessLogs,
        killAllProcesses,
        runNodePackageScript
    };
}