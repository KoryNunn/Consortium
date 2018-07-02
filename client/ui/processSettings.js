var fastn = require('./fastn');
var renderEditProcessForm = require('./editProcessForm');

module.exports = function renderProcessSettings(app){
    var processSettings = fastn('tr',
        fastn('td', { colspan: 6 },
            fastn('button', { class: 'delete'}, 'Delete process')
            .on('click', (event, scope) => {
                app.removeProcess(scope.get('process._id'), () => {

                })
            }),
            renderEditProcessForm(app, 'Edit process', 'Update', (scope, callback) => {
                callback({ ...scope.process });
            }, (process, callback) => {
                app.updateProcess(process._id, process, callback);
            })
        )
    );

    return processSettings;
};