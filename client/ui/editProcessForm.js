var fastn = require('./fastn');

module.exports = function editProcess(app, title, submitLabel, getNewState, produceProcess){
    var form,
        editComponent = fastn('div',
            form = fastn('form', {
                disabled: fastn.binding('loading')
            },
            fastn('h2', title),
            fastn('div',
                fastn('label', 'Name'),
                fastn('input', {
                    placeholder: 'name',
                    value: fastn.binding('process.name'),
                    onchange: 'value:value'
                })
            ),
            fastn('div',
                fastn('label', 'CWD'),
                fastn('input', {
                    placeholder: 'cwd',
                    value: fastn.binding('process.cwd'),
                    onchange: 'value:value'
                })
            ),
            fastn('div',
                fastn('label', 'Run Command'),
                fastn('input', {
                    placeholder: 'runCommand',
                    value: fastn.binding('process.runCommand'),
                    onchange: 'value:value'
                })
            ),
            fastn('div',
                fastn('label', 'Build command'),
                fastn('input', {
                    placeholder: 'buildCommand',
                    value: fastn.binding('process.buildCommand'),
                    onchange: 'value:value'
                })
            ),
            fastn('div',
                fastn('label', 'Environment'),
                fastn('input', {
                    placeholder: 'environment',
                    value: fastn.binding('process.environment'),
                    onchange: 'value:value'
                })
            ),
            fastn('div',
                fastn('label', 'Is git project'),
                fastn('input', {
                    type: 'checkbox',
                    placeholder: 'environment',
                    checked: fastn.binding('process.isGit'),
                    onchange: 'checked:checked'
                })
            ),
            fastn('button', submitLabel)
        )
        .on('submit', function(event, scope){
            scope.set('loading', true);
            event.preventDefault();
            produceProcess(scope.get('process'), () => attachNewState(scope.get('.')));
        })
    )
    .on('attach', function(scope){
        attachNewState(scope.get('.'));
    });

    function attachNewState(scope){
        getNewState(scope, (state) => {
            form.attach({ process: state });
        });
    }

    return editComponent;
}