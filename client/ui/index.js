var fastn = require('./fastn');
var renderProcessList = require('./processList');
var renderEditProcessForm = require('./editProcessForm');

module.exports = function(app){
    var ui = fastn('div',
        fastn('h1', 'Consortium'),
        // fastn('button', {}, 'Kill all processes')
        // .on('click', (event, scope) => {
        //     app.killAllProcesses(() => {

        //     });
        // }),
        renderProcessList(app),
        renderEditProcessForm(app, 'Add new process', 'Add', (scope, callback) => callback({}), (process, callback) => {
            app.createProcess(process, callback);
        })
    );

    ui.attach(app.state);
    ui.render();

    window.addEventListener('load', function(){
        document.body.appendChild(ui.element);
    });

    setInterval(function(){
        var pre = document.querySelector('pre');

        if(!pre){
            return;
        }

        if(pre.follow){
            pre.scrollTop = pre.scrollHeight - pre.clientHeight;
        }
    }, 50);
}