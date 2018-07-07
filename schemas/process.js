module.exports = function(data, callback){
    var result;

    try{
        result = {
            name: data.name,
            cwd: data.cwd,
            runCommand: data.runCommand,
            buildCommand: data.buildCommand,
            env: data.environment,
            isGit: data.isGit,
            isNodePackage: data.isNodePackage,
            order: data.order
        };
    } catch(error) {
        return callback(error);
    }

    callback(null, result);
}