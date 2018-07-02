var righto = require('righto');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var util = require('util');
var processSchema = require('../schemas/process');

var processLogs = {};

function addProcess(tokens, data, callback){
    var validProcess = righto(processSchema, data);
    var saved = validProcess.get((processesData) => this.application.db.processes.save(processesData));

    saved(callback);
}

function updateProcess(tokens, data, callback){
    var validProcess = righto(processSchema, data);
    var updated = validProcess.get((processesData) => this.application.db.processes.update({ _id: tokens.id }, processesData));

    updated(callback);
}

function removeProcess(tokens, callback){
    var removed = righto.sync(() => this.application.db.processes.remove({ _id: tokens.id }));

    removed(callback);
}

function getProcesses(tokens, callback){
    var processes = righto.sync(() => this.application.db.processes.find());

    processes(callback);
}

function killProcess(pid, callback){
    exec(`kill -9 -${pid}`, callback);
}

function addProcessLog(processName, data, type){
    processLogs[processName] = processLogs[processName] || [];
    processLogs[processName].push([Date.now(), String(data)]);
    processLogs[processName] = processLogs[processName].slice(-100);
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
    });

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
            try{
                spawnedProcess = spawn(commandParts[0], commandParts.slice(1), {
                    stdio: 'pipe',
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
    });

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

    checked(function(error){
        if(error){
            console.log(error);
        }
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
    });

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

    return {
        addProcess,
        updateProcess,
        removeProcess,
        getProcesses,
        restartProcess,
        stopProcess,
        rebuildProcess,
        getProcessLogs,
        killAllProcesses
    };
}