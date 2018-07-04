var fastn = require('./fastn');

module.exports = function renderProcess(app){
    return fastn('section',
        {
            class: fastn.binding('process.pid', pid => [
                'process',
                pid ? 'running': 'stopped'
            ])
        },
        fastn('h1', { class: 'name' },
            fastn.binding('process.name')
        ),
        fastn('div', { class: 'info' },
            fastn('div', { class: 'status' }, fastn.binding('process.pid', pid => pid ? 'Running': 'Stopped')),
            fastn('div', { class: 'branch' }, fastn.binding('process.branch'))
        ),
        fastn('div', { class: 'actions' },
            fastn('button', fastn.binding('process.showSettings', show => show ? 'Hide' : 'Show'), ' settings')
            .on('click', (event, scope) => {
                app.showHideSettingsForProcess(scope.get('process._id'), !scope.get('process.showSettings'))
            }),
            fastn('button', fastn.binding('process.showLogs', show => show ? 'Hide' : 'Show'), ' logs')
            .on('click', (event, scope) => {
                app.showHideLogsForProcess(scope.get('process._id'), !scope.get('process.showLogs'))
            }),
            fastn('button', { display: fastn.binding('process.pid') }, 'Stop')
            .on('click', (event, scope) => {
                app.stopProcess(scope.get('process._id'), () => {

                })
            }),
            fastn('button', fastn.binding('process.pid', running => running ? 'Restart' : 'Start'))
            .on('click', (event, scope) => {
                app.restartProcess(scope.get('process._id'), () => {

                })
            })
        )
    );
};