var fastn = require('./fastn');
var renderProcessDetails = require('./processDetails');
var renderPackageScripts = require('./packageScripts');

module.exports = function renderProcess(app){
    return fastn('section',
        {
            class: fastn.binding('pid', pid => [
                'process',
                pid ? 'running': 'stopped'
            ])
        },
        fastn('h1', { class: 'name' },
            fastn.binding('name')
        ),
        fastn('div', { class: 'info' },
            fastn('div', { class: 'status' }, fastn.binding('pid', pid => pid ? 'Running': 'Stopped')),
            fastn('div', { class: 'branch' }, fastn.binding('branch'))
        ),
        fastn('div', { class: 'actions' },
            fastn('button', fastn.binding('showSettings', show => show ? 'Hide' : 'Show'), ' settings')
            .on('click', (event, scope) => {
                app.showHideSettingsForProcess(scope.get('_id'), !scope.get('showSettings'))
            }),
            fastn('button', fastn.binding('showLogs', show => show ? 'Hide' : 'Show'), ' logs')
            .on('click', (event, scope) => {
                app.showHideLogsForProcess(scope.get('_id'), !scope.get('showLogs'))
            }),
            fastn('button', { display: fastn.binding('pid') }, 'Stop')
            .on('click', (event, scope) => {
                app.stopProcess(scope.get('_id'), () => {

                })
            }),
            fastn('button', fastn.binding('pid', running => running ? 'Restart' : 'Start'))
            .on('click', (event, scope) => {
                app.restartProcess(scope.get('_id'), () => {

                })
            })
        ),
        renderPackageScripts(app),
        renderProcessDetails(app)
    );
};