var db = require('diskdb');
var fs = require('fs');

module.exports = function(application){
    try {
        fs.mkdirSync(application.dbPath);
    } catch (error) {}
    var connection = db.connect(application.dbPath);
    db.loadCollections(['processes']);

    return connection;
}