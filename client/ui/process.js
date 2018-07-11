var fastn = require('./fastn');
var grabetha = require('grabetha');
var renderProcessDetails = require('./processDetails');
var renderPackageScripts = require('./packageScripts');

function addGrabHanders(app, processComponent){
    var grabbableStuff = grabetha.grabbable(processComponent.element);

    grabbableStuff
    .on('grab', function(grab){
       this.ghost = this.createGhost();
       this.processId = processComponent.scope().get('_id');

       grab.interaction.originalEvent.preventDefault();

        grab.on('move', function(){

        });
    })
    .on('drop', function(position){
        this.ghost.destroy();
        this.ghost = null
    });

    var dropArea = grabetha.droppable(processComponent.element);

    dropArea.on('hover', function(event){

    })
    .on('drop', function(event){
        // the same stuff as above is accessable here.
        var targetProcessId = processComponent.scope().get('_id');
        var movedProcessId = event.grabbable.processId;

        if(targetProcessId === movedProcessId){
            return;
        }

        app.reorderProcesses(targetProcessId, movedProcessId, () => {});
    });
}

module.exports = function renderProcess(app){

    var statusBinding = fastn.binding('pid', 'status', 'upMatch', (pid, status, upMatch) =>
        upMatch ? status : pid ? 'running': 'stopped'
    );

    return fastn('section',
        {
            class: fastn.binding(statusBinding, (status) => [
                'process',
                status
            ])
        },
        fastn('h1', { class: 'name' },
            fastn.binding('name')
        ),
        fastn('div', { class: 'info' },
            fastn('div', { class: 'status' }, statusBinding),
            fastn('div', { class: 'branch' }, fastn.binding('branch'))
        ),
        fastn('div', { class: 'actions' },
            fastn('button', {
                    class: fastn.binding('showSettings', show => ['icon', show && 'toggleOn']),
                    title: fastn.binding('showSettings', show => (show ? 'Hide' : 'Show') + ' settings')
                },
                fastn('icon', { name: 'settings' })
            )
            .on('click', (event, scope) => {
                app.showHideSettingsForProcess(scope.get('_id'), !scope.get('showSettings'))
            }),
            fastn('button', {
                    class: fastn.binding('showLogs', show => ['icon', show && 'toggleOn']),
                    title: fastn.binding('showLogs', show => (show ? 'Hide' : 'Show') + ' logs'),
                },
                fastn('icon', { name: 'terminal' })
            )
            .on('click', (event, scope) => {
                app.showHideLogsForProcess(scope.get('_id'), !scope.get('showLogs'))
            }),
            fastn('button', {
                    display: fastn.binding('pid'),
                    class: 'icon',
                    title: 'Stop'
                },
                fastn('icon', { name: 'stop' })
            )
            .on('click', (event, scope) => {
                app.stopProcess(scope.get('_id'), () => {

                })
            }),
            fastn('button', {
                    title: fastn.binding('pid', running => running ? 'Restart' : 'Start'),
                    class: 'icon'
                },
                fastn('icon', { name: fastn.binding('pid', running => running ? 'restart' : 'start') })
            )
            .on('click', (event, scope) => {
                app.restartProcess(scope.get('_id'), () => {

                })
            })
        ),
        renderPackageScripts(app),
        renderProcessDetails(app)
    )
    .on('render', function(){
        addGrabHanders(app, this);
    });
};