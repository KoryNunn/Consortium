module.exports = function(data, callback){
    var result;

    try{
        result = {
            name: data.name,
            cwd: data.cwd,
            runCommand: data.runCommand,
            upMatch: data.upMatch,
            buildCommand: data.buildCommand,
            env: data.environment,
            isGit: data.isGit,
            isNodePackage: data.isNodePackage
        };
    } catch(error) {
        return callback(error);
    }

    callback(null, result);
}