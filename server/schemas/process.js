module.exports = function(data, callback){
    var result;

    try{
        result = {
            name: data.name,
            cwd: data.cwd,
            runCommand: data.runCommand,
            buildCommand: data.buildCommand,
            env: data.environment
        };
    } catch(error) {
        return callback(error);
    }

    callback(null, result);
}