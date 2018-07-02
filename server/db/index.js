var db = require('diskdb');

module.exports = function(application){
    var connection = db.connect(application.dbPath);
    db.loadCollections(['processes']);

    return connection;
}