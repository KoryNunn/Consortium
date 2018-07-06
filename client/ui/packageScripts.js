var fastn = require('./fastn');
var renderProcessDetails = require('./processDetails');

module.exports = function renderProcess(app){
    return fastn('list:menu', {
        display: fastn.binding('scripts'),
        class: 'moduleScripts',
        items: fastn.binding('scripts|*'),
        template: (model, processScope) => {
            return fastn('button', fastn.binding('key'))
                .on('click', (event, scriptScope) => {
                    app.runNodePackageScript(
                        processScope.get('_id'),
                        scriptScope.get('key'),
                        () => {}
                    )
                });
        }
    },
        fastn('h2', 'Packge scripts'),
        fastn('button', 'Install')
        .on('click', (event, scope) => app.runNodePackageScript(scope.get('_id'), 'install', () => {}))
    );
};