var fastn = require('./fastn');
var renderProcessSettings = require('./processSettings');
var renderProcessLogs = require('./processLogs');

module.exports = function renderProcessDetails(app){
    var processDetails = fastn('div', { class: 'details' },
        fastn('templater', {
            data: fastn.binding('showSettings'),
            attachTemplates: false,
            template: (model) => model.get('item') ? renderProcessSettings(app) : null
        }),
        fastn('templater', {
            data: fastn.binding('showLogs'),
            attachTemplates: false,
            template: (model) => model.get('item') ? renderProcessLogs(app) : null
        })
    );

    return processDetails;
};