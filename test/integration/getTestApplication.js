var fs = require('fs');
var rimraf = require('rimraf');
var path = require('path');
var righto = require('righto');
var jsonRequest = require('make-json-request');
var createApplication = require('../../server');
var nextPort = 8090;
var nextApplicationId = 0;

function getApplication(){
    var applicationId = nextApplicationId++;
    var dbPath = path.join(__dirname , `../../data/_test_${applicationId}`);

    try {
        fs.mkdirSync(dbPath);
    } catch (error){
        // meh;
    }

    var application = createApplication({
        dbPath: dbPath,
        port: nextPort + applicationId
    });

    function checkClose(){
        setTimeout(function(){
            application.server.getConnections(function(connections){
                if(!connections){
                    application.server.close();
                    rimraf.sync(dbPath);
                } else {
                    checkClose();
                }
            });
        }, 50);
    }

    checkClose();

    application.testData = {
        process: {
            name: 'testProcess'
        }
    };

    application.testProcess = righto(jsonRequest, {
        url: application.path + '/processes',
        method: 'POST',
        json: application.testData.process
    });
    application.testProcessDeleted = righto(jsonRequest, application.testProcess.get((process) => ({
        url: application.path + '/processes/' + process._id,
        method: 'DELETE'
    })));

    return application;
};

module.exports = getApplication;