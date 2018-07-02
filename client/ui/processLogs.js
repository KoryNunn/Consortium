var fastn = require('./fastn');

module.exports = function renderProcessLogs(app){
    return fastn('tr',
        fastn('td', { colspan: 6 },
            fastn('div:pre',
                {
                    class: 'logs'
                },
                fastn('list:code', {
                    items: fastn.binding('process.logs|*'),
                    template: () => fastn('div', fastn.binding('item'))
                })
            )
        )
    );
};