var realSetTimeout = setTimeout;
var realClearTimeout = clearTimeout;
var timeouts = new Set();
global.setTimeout = function(){
    var timeout = realSetTimeout.apply(this, arguments);
    timeouts.add(timeout);
    return timeout;
}
global.clearTimeout = function(timeout){
    var result = realClearTimeout.apply(this, arguments);
    timeouts.delete(timeout);
    return result;
}

function clearAllTimeouts(){
    timeouts.forEach(function(timeout){
        timeouts.delete(timeout);
        realClearTimeout(timeout);
    });
}

module.exports = clearAllTimeouts;