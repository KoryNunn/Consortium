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
    )
    .on('render', function(){
        addGrabHanders(app, this);
    });
};