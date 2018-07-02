var fastn = require('./fastn');

module.exports = function renderProcess(app){
    return fastn('tr',
        {
            class: fastn.binding('process.pid', pid => pid ? 'running': 'stopped')
        },
        fastn('td',
            fastn.binding('process.name')
        ),
        fastn('td', fastn.binding('process.cwd')),
        fastn('td', fastn.binding('process.runCommand')),
        fastn('td', fastn.binding('process.buildCommand')),
        fastn('td', fastn.binding('process.pid', pid => pid ? 'Running': 'Stopped')),
        fastn('td',
            fastn('button', fastn.binding('process.showSettings', show => show ? 'Hide' : 'Show'), ' settings')
            .on('click', (event, scope) => {
                app.showHideSettingsForProcess(scope.get('process._id'), !scope.get('process.showSettings'))
            }),
            fastn('button', fastn.binding('process.showLogs', show => show ? 'Hide' : 'Show'), ' logs')
            .on('click', (event, scope) => {
                app.showHideLogsForProcess(scope.get('process._id'), !scope.get('process.showLogs'))
            }),
            fastn('button', 'Rebuild')
            .on('click', (event, scope) => {
                app.rebuildProcess(scope.get('process._id'), () => {

                })
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