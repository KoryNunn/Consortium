var fastn = require('./fastn');

module.exports = function editProcess(app, title, submitLabel, getNewState, produceProcess){
    var form,
        editComponent = fastn('div',
            form = fastn('form', {
                disabled: fastn.binding('loading')
            },
            fastn('h2', title),
            fastn('field',
                fastn('label', 'Name'),
                fastn('input', {
                    placeholder: 'Name',
                    value: fastn.binding('process.name'),
                    onchange: 'value:value'
                })
            ),
            fastn('field',
                fastn('label', 'Current working directory'),
                fastn('input', {
                    placeholder: 'CWD',
                    value: fastn.binding('process.cwd'),
                    onchange: 'value:value'
                })
            ),
            fastn('field',
                fastn('label', 'Run Command'),
                fastn('input', {
                    placeholder: 'Run Command',
                    value: fastn.binding('process.runCommand'),
                    onchange: 'value:value'
                })
            ),
            fastn('field',
                fastn('label', 'Build command'),
                fastn('input', {
                    placeholder: 'Build command',
                    value: fastn.binding('process.buildCommand'),
                    onchange: 'value:value'
                })
            ),
            fastn('field',
                fastn('label', 'Environment'),
                fastn('input', {
                    placeholder: 'Environment',
                    value: fastn.binding('process.environment'),
                    onchange: 'value:value'
                })
            ),
            fastn('field',
                fastn('input', {
                    id: 'isGit',
                    type: 'checkbox',
                    placeholder: 'Is git project',
                    checked: fastn.binding('process.isGit'),
                    onchange: 'checked:checked'
                }),
                fastn('label', { for: 'isGit' }, 'Is git project')
            ),
            fastn('field',
                fastn('input', {
                    id: 'isNodePackage',
                    type: 'checkbox',
                    placeholder: 'Is node package',
                    checked: fastn.binding('process.isNodePackage'),
                    onchange: 'checked:checked'
                }),
                fastn('label', { for: 'isNodePackage' }, 'Is node package')
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