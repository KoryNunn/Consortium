// require('wtfnode').init();
var tape = require('tape');
var righto = require('righto');
righto._debug = true;
righto._autotraceOnError = true;
var jsonRequest = require('make-json-request');
var getApplication = require('./getTestApplication');

tape('add process', function(t){
    t.plan(3);
    var application = getApplication();

    var processAdded = application.testProcess;

    processAdded(function(error, result){
        t.notOk(error, 'Successfully created process');
        t.ok(result._id, 'Process has an ID');
        t.equal(result.name, application.testData.process.name, 'Process has the right name');
        application.close();
    });
});

tape('remove process', function(t){
    t.plan(1);
    var application = getApplication();

    var processDeleted = application.testProcessDeleted;

    processDeleted(function(error){
        t.notOk(error, 'Successfully removed process');
        application.close();
    });
});
