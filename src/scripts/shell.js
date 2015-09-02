var spawn = require('child_process').spawn;

var Shell = (function(){

    var eventList, shell, dataList;


    /**
     * @function getEvents
     * @public
     */
    var getEvents = function(options, callback){
        
        eventList = [];
        dataList = [];
            

        /**
         * @function _shellCloseHandler
         * @private
         */
        var _shellCloseHandler = function (code) {

            var str = dataList.join('');

            dataList.length = 0;    

            while (match = options.pattern.exec(str)) {

                eventList.push({
                    'date' : new Date(match[1] ? match[1] : new Date().getFullYear(), new Date(Date.parse("2000 " + match[2])).getMonth(), match[3], match[4], match[5], match[6]),
                    'event': options.events[match[7]].type,
                    'log'  : options.events[match[7]].description
                });
            }        

            str = '';

            callback(eventList);
        };

        /**
         * execute the script
         * set event handlers for the script
         */
        shell = spawn(options.command, options.parameters);
        shell.stdout.setEncoding('utf8');
        shell.stdout.on('data', _shellOutHandler);
        shell.stderr.on('data', _shellErrorHandler);
        shell.on('close', _shellCloseHandler);
    };



    /**
     * @function _shellErrorHandler
     * @private
     */
    var _shellErrorHandler = function (data) {

        console.log('stderr: ' + data);
    };


    /**
     * @function _shellOutHandler
     * @private
     */
    var _shellOutHandler = function (data) {

        dataList.push(data);
    };

    return {
        getEvents : getEvents
    }
})();

module.exports = Shell;