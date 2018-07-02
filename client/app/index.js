var cpjax = require('cpjax');
var righto = require('righto');
var Enti = require('enti');

module.exports = function(){

    var appState = {
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

    function getProcesses(update){
        var processes = righto(cpjax, {
            dataType: 'json',
            method: 'GET',
            url: '/processes'
        });

        processes(function(error, result){
            update ?
                Enti.update(appState, 'processes', result) :
                Enti.set(appState, 'processes', result);
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
        var created = righto(cpjax, {
            dataType: 'json',
            method: 'POST',
            url: `/processes`,
            data: process
        });

        var processListUpdated = created.get(getProcesses);

        var result = righto.mate(created, righto.after(processListUpdated));

        result(callback);
    }

    function updateProcess(processId, process, callback){
        var updated = righto(cpjax, {
            dataType: 'json',
            method: 'PUT',
            url: `/processes/${processId}`,
            data: process
        });

        var processListUpdated = updated.get(getProcesses);

        var result = righto.mate(updated, righto.after(processListUpdated));

        result(callback);
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
                });
            });
        });
    }

    getProcesses();
    setInterval(() => {
        getProcesses(true);
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
        getProcessLogs,
        setSelectedProcess,
        showHideLogsForProcess,
        showHideSettingsForProcess
    };
};