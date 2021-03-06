var QueryString = require('querystring');
var SeaLion = require('sea-lion');
var Dion = require('dion');
var requestData = require('request-data');

function handle(application, controller){
    return function(request, response, tokens){
        var args = Array.prototype.slice.call(arguments, 2);
        var querystring = request.url.match(/^.*?\?(.*)/);
        tokens.queryStringItems = querystring ? QueryString.parse(querystring[1]) : {};
        controller.apply({ request, response, application }, args.concat(function(error, result){
            if(error){
                response.writeHead(error.code > 100 ? error.code : 500);
                response.end(error.code ? error.message : 'An unknown error occured');
                return;
            }

            response.writeHead(200, {
                'Content-Type': 'application/json',
                'Timestamp': Date.now()
            });
            response.end(JSON.stringify(result));
        }));
    }
}

module.exports = function(application, controllers){
    var router = new SeaLion();
    var fileServer = new Dion(router);

    router.add({
        '/': fileServer.serveFile('./client/static/index.html', 'text/html'),
        '/processes': {
            GET: handle(application, controllers.getProcesses),
            POST: requestData(handle(application, controllers.addProcess))
        },
        '/processes/killall': {
            PUT: handle(application, controllers.killAllProcesses)
        },
        '/processes/`id`': {
            DELETE: handle(application, controllers.removeProcess),
            PUT: requestData(handle(application, controllers.updateProcess))
        },
        '/processes/`id`/stop': {
            PUT: handle(application, controllers.stopProcess)
        },
        '/processes/`id`/restart': {
            PUT: handle(application, controllers.restartProcess)
        },
        '/processes/`id`/rebuild': {
            PUT: handle(application, controllers.rebuildProcess)
        },
        '/processes/`id`/logs/`from` /processes/`id`/logs': {
            GET: handle(application, controllers.getProcessLogs)
        },
        '/processes/`id`/scripts/`scriptName`': {
            PUT: handle(application, controllers.runNodePackageScript)
        },
        '/processes/`id`/move/`targetProcessId`': {
            PUT: handle(application, controllers.moveProcess)
        },
        '/`path...`': fileServer.serveDirectory('./client/static', {
            '.html': 'text/html',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.jpg': 'image/jpg',
            '.svg': 'image/svg'
        }),
    });

    return router;
};