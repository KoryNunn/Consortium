var fastn = require('./fastn');
var scrollIntoView = require('scroll-into-view');

module.exports = function renderProcessLogs(app){
    return fastn('div:pre',
        {
            class: 'logs'
        },
        fastn('list:code', {
            items: fastn.binding('process.logs|*'),
            template: () => fastn('div', fastn.binding('item'))
        })
    )
    .on('render', function(){
        var pre = this.element;
        pre.follow = true;
        requestAnimationFrame(function(){
            scrollIntoView(pre, {
                time: 400,
                align: {
                    top: 0.95
                }
            });
        });
    })
    .on('mousewheel', function(event){
        var pre = this.element;

        pre.follow = event.deltaY > 0 && pre.scrollHeight - pre.clientHeight === pre.scrollTop;
    });
};