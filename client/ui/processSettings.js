var fastn = require('./fastn');
var renderEditProcessForm = require('./editProcessForm');

module.exports = function renderProcessSettings(app){
    var processSettings = fastn('div',
        fastn('list:menu', {
            class: 'moduleScripts',
            items: fastn.binding('process.scripts|*'),
            template: (model, processScope) => {
                return fastn('button', fastn.binding('key'))
                    .on('click', (event, scriptScope) => {
                        app.runNodePackageScript(
                            processScope.get('process._id'),
                            scriptScope.get('key'),
                            () => {}
                        )
                    });
            }
        }),
        fastn('menu', { class: 'processMenu' },
            fastn('button', { class: 'delete'}, 'Delete process')
            .on('click', (event, scope) => {
                app.removeProcess(scope.get('process._id'), () => {

                })
            })
        ),
        renderEditProcessForm(app, 'Edit process', 'Update', (scope, callback) => {
            callback({ ...scope.process });
        }, (process, callback) => {
            app.updateProcess(process._id, process, callback);
        })
    );

    return processSettings;
};