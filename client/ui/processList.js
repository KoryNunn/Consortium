var fastn = require('./fastn');
var renderProcess = require('./process');
var renderProcessDetails = require('./processDetails');

function getMapInstance(map, item, defaultValue){
    if(!map.has(item)){
        map.set(item, { ...defaultValue });
    }

    return map.get(item);
}

module.exports = function renderProcessList(app){
    var processListMap = new WeakMap();
    var processDetailsMap = new WeakMap();
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

            if(item.showSettings || item.showLogs){
                var detailsItem = getMapInstance(processDetailsMap, item, {
                    type: 'details',
                    process: item
                });
                results.push(detailsItem);
            }

            return results;
        }, []);
    })

    return fastn('list', {
        class: 'processes',
        items: processListBinding,
        template: (model) => {
            var item = model.get('item'),
                type = item.type;

            if(type === 'process') {
                return renderProcess(app).binding('item');
            } else if(type === 'details') {
                return renderProcessDetails(app).binding('item');
            }
        }
    });
};