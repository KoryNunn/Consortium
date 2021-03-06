var fastn = require('./fastn');
var renderEditProcessForm = require('./editProcessForm');

module.exports = function renderProcessSettings(app){
    var processSettings = fastn('div',
        fastn('menu', { class: 'processMenu' },
            fastn('button', { class: 'delete'}, 'Delete process')
            .on('click', (event, scope) => {
                app.removeProcess(scope.get('_id'), () => {

                })
            })
        ),
        renderEditProcessForm(app, 'Edit process', 'Update', (scope, callback) => {
            callback({ ...scope });
        }, (process, callback) => {
            app.updateProcess(process._id, process, callback);
        })
    );

    return processSettings;
};