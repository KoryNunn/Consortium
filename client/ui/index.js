var fastn = require('./fastn');
var renderProcessList = require('./processList');
var renderEditProcessForm = require('./editProcessForm');

module.exports = function(app){
    var ui = fastn('div',
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