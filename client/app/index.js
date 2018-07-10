var cpjax = require('cpjax');
var righto = require('righto');
var Enti = require('enti');
var processSchema = require('../../schemas/process');

module.exports = function(){

    var appState = {
        processes: [],
        processStates: {}
    };

    function killAllProcesses(callback){
        var allKilled = righto(cpjax, {
            dataType: 'json',
            method: 'PUT',
            url: '/processes/killall'
        });

        allKilled(callback);
    }

    function refreshProcesses(){
        var processes = righto(cpjax, {
            dataType: 'json',
            method: 'GET',
            url: '/processes'
        });

        processes(function(error, result){
            Enti.update(appState, 'processes', result);
        });
    }

    function parseHeaders(headersString){
        return headersString.trim().split(/\n/).reduce(function(results, line){
            var parts = line.match(/(.*?)\: (.*)/);
            results[parts[1]] = parts[2];
            return results;
        }, {});
    }

    function pollProcesses(lastResponseTime){
        var url = '/processes';

        if(lastResponseTime){
            url += `?poll=${lastResponseTime}`;
        }

        var processes = righto(cpjax, {
            dataType: 'json',
            method: 'GET',
            url
        });

        processes(function(error, result, event){
            if(error){
                return setTimeout(() => pollProcesses(true), 1000);
            }

            if(Array.isArray(result)){
                Enti.update(appState, 'processes', result);
            }

            var headers = parseHeaders(event.target.getAllResponseHeaders());

            pollProcesses(Number(headers.timestamp) || Date.now() - 100);
        });
    }

    function removeProcess(processId, callback){
        var removed = righto(cpjax, {
            dataType: 'json',
            method: 'DELETE',
            url: `/processes/${processId}`
        });

        var complete = removed.get(() => {
            var index = appState.processes.findIndex((process) => process._id === processId);
            Enti.remove(appState, 'processes', index);
        });

        complete(callback);
    }

    function createProcess(process, callback){
        var validProcess = righto(processSchema, process);
        var created = righto(cpjax, righto.resolve({
            dataType: 'json',
            method: 'POST',
            url: `/processes`,
            data: validProcess
        }));

        created(callback);
    }

    function updateProcess(processId, process, callback){
        var validProcess = righto(processSchema, process);
        var updated = righto(cpjax, righto.resolve({
            dataType: 'json',
            method: 'PUT',
            url: `/processes/${processId}`,
            data: validProcess
        }));

        updated(callback);
    }

    function restartProcess(processId, callback){
        var restarted = righto(cpjax, {
            dataType: 'json',
            method: 'PUT',
            url: `/processes/${processId}/restart`
        });

        restarted(callback);
    }

    function rebuildProcess(processId, callback){
        var restarted = righto(cpjax, {
            dataType: 'json',
            method: 'PUT',
            url: `/processes/${processId}/rebuild`
        });

        restarted(callback);
    }

    function stopProcess(processId, callback){
        var stopped = righto(cpjax, {
            dataType: 'json',
            method: 'PUT',
            url: `/processes/${processId}/stop`
        });

        stopped(callback);
    }

    function runNodePackageScript(processId, scriptName, callback){
        var scriptRan = righto(cpjax, {
            dataType: 'json',
            method: 'PUT',
            url: `/processes/${processId}/scripts/${scriptName}`
        });

        scriptRan(callback);
    }

    function getProcessLogs(processId, from, callback){
        var logs = righto(cpjax, {
            dataType: 'json',
            method: 'GET',
            url: from ? `/processes/${processId}/logs/${from}` : `/processes/${processId}/logs`
        });

        logs(callback);
    }

    function setSelectedProcess(processId){
        Enti.set(appState, 'selectedProcess', processId);
    }

    function showHideLogsForProcess(processId, show){
        var process = appState.processes.find((process) => process._id === processId);

        if(!process){
            return;
        }

        Enti.set(process, 'showLogs', show);
    }

    function showHideSettingsForProcess(processId, show){
        var process = appState.processes.find((process) => process._id === processId);

        if(!process){
            return;
        }

        Enti.set(process, 'showSettings', show);
    }

    function reorderProcesses(targetProcessId, movedProcessId, callback){
        var moved = righto(cpjax, righto.resolve({
            dataType: 'json',
            method: 'PUT',
            url: `/processes/${movedProcessId}/move/${targetProcessId}`
        }));

        moved(callback);
    }

    function updateProcessLogs(){
        appState.processes && appState.processes.forEach(function(process){
            if(!process.showLogs){
                return;
            }
            getProcessLogs(process._id, process.lastLog, function(error, logs){
                if(error){
                    return;
                }

                if(!process.logs){
                    Enti.set(process, 'logs', []);
                }

                logs.forEach(function(log){
                    Enti.set(process, 'lastLog', Math.max(Enti.get(process, 'lastLog') || Date.now() - 10e6, log[0]));
                    Enti.push(process, 'logs', log[1]);
                    while(process.logs.length > 10000){
                        Enti.delete(process, 'logs.0');
                    }
                });
            });
        });
    }

    pollProcesses();

    setInterval(() => {
        updateProcessLogs();
    }, 500);

    return {
        state: appState,
        killAllProcesses,
        removeProcess,
        createProcess,
        updateProcess,
        restartProcess,
        rebuildProcess,
        stopProcess,
        runNodePackageScript,
        getProcessLogs,
        setSelectedProcess,
        showHideLogsForProcess,
        showHideSettingsForProcess,
        reorderProcesses
    };
};