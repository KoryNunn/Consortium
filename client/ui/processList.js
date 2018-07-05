var fastn = require('./fastn');
var renderProcess = require('./process');

module.exports = function renderProcessList(app){
    return fastn('list', {
        class: 'processes',
        items: fastn.binding('processes|*'),
        template: (model) => {
            return renderProcess(app).binding('item')
        }
    });
};