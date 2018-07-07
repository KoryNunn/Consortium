var fastn = require('./fastn');
var grabetha = require('grabetha');
var renderProcess = require('./process');

function addDropHandlers(processListComponent){
    var dropArea = grabetha.droppable(processListComponent.element);

    dropArea.on('hover', function(event){
        // the droppable element it is over
        event.taget;

        // the grabbale instance that is over it.
        event.grabbable;

        // the location of the grab
        event.position;
    })
    .on('drop', function(event){
        // the same stuff as above is accessable here.
        console.log(event);
    });
}

module.exports = function renderProcessList(app){
    return fastn('list', {
        class: 'processes',
        items: fastn.binding('processes|*', items => items.slice().sort((a, b) => a.order - b.order)),
        template: (model) => {
            return renderProcess(app).binding('item')
        }
    })
    .on('render', function(){
        addDropHandlers(this);
    });
};