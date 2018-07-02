var fastn = require('./fastn');
var renderProcess = require('./process');
var renderProcessSettings = require('./processSettings');
var renderProcessLogs = require('./processLogs');
var renderEditProcessForm = require('./editProcessForm');

function getMapInstance(map, item, defaultValue){
    if(!map.has(item)){
        map.set(item, { ...defaultValue });
    }

    return map.get(item);
}

module.exports = function(app){
    var processListMap = new WeakMap();
    var processSettingsMap = new WeakMap();
    var processLogMap = new WeakMap();
    var processListBinding = fastn.binding('processes|*.*', 'selectedProcess', function(processes, selectedProcess){
        if(!processes){
            return;
        }

        return processes && processes.reduce(function(results, item, index){
            var listItem = getMapInstance(processListMap, item, {
                type: 'process',
                process: item
            });

            results.push(listItem);

            if(item.showSettings){
                var settingsItem = getMapInstance(processSettingsMap, item, {
                    type: 'settings',
                    process: item
                });
                results.push(settingsItem);
            }

            if(item.showLogs){
                var logItem = getMapInstance(processLogMap, item, {
                    type: 'logs',
                    process: item
                });
                results.push(logItem);
            }

            return results;
        }, []);
    })

    var ui = fastn('div',
        fastn('h1', 'Consortium'),
        fastn('button', {}, 'Kill all processes')
        .on('click', (event, scope) => {
            app.killAllProcesses(() => {

            });
        }),
        fastn('list:table', {
            class: 'processes',
            items: processListBinding,
            template: (model) => {
                var item = model.get('item'),
                    type = item.type;

                if(type === 'process') {
                    return renderProcess(app).binding('item');
                } else if(type === 'settings') {
                    return renderProcessSettings(app).binding('item');
                } else if(type === 'logs') {
                    return renderProcessLogs(app).binding('item');
                }
            }
        },
            fastn('h2', 'Processes'),
            fastn('tr',
                fastn('td', 'Name'),
                fastn('td', 'Branch'),
                fastn('td', 'CWD'),
                fastn('td', 'Run Command'),
                fastn('td', 'Build Command'),
                fastn('td', 'State'),
                fastn('td', 'Actions')
            )
        ),
        renderEditProcessForm(app, 'Add new process', 'Add', (scope, callback) => callback({}), (process, callback) => {
            app.createProcess(process, callback);
        })
    );

    ui.attach(app.state);
    ui.render();

    window.addEventListener('load', function(){
        document.body.appendChild(ui.element);
    });

    setInterval(function(){
        var pre = document.querySelector('pre');

        if(!pre){
            return;
        }

        if(!pre.lastScrollPosition){
            pre.scrollTop = pre.scrollHeight - pre.clientHeight;
            pre.lastScrollPosition = pre.scrollTop;
        }

        if(pre.scrollHeight - pre.clientHeight - pre.scrollTop < 20 && pre.lastScrollPosition === pre.scrollTop){
            pre.scrollTop = pre.scrollHeight - pre.clientHeight;
            pre.lastScrollPosition = pre.scrollTop;
        }
    }, 20);
}