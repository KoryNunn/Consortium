var clearAllTimeouts = require('./timeoutProxy');
var http = require('http');
var EventEmitter = require('events');
var path = require('path');
var config = require('config');
var createControllers = require('./controllers');
var createRouter = require('./router');
var createDb = require('./db');

module.exports = function(configOverrides = {}){
    var application = new EventEmitter();
    Object.assign(application, {
        dbPath: path.join(__dirname , `../data`),
        port: config.get('port'),
        ...configOverrides
    });

    var db = application.db = createDb(application);
    var controllers = createControllers(application);
    var router = createRouter(application, controllers);
    var server = application.server = http.createServer(router.createHandler());

    server.listen(application.port);

    application.path = 'http://localhost:' + application.port;

    application.close = function(){
        application.closed = true;
        application.emit('close');
        clearAllTimeouts();
        server.close();
    };

    return application;
};

if(process.argv[2] === 'run'){
    module.exports();
}