var spawn = require('child_process').spawn;

var Syslog = (function(){

    var eventArray, syslog, syslogData;

    /**
     * @function getLog
     * @public
     */
    var getLog = function(callback){
        
        eventArray = [];
        syslogData = [];
            

        /**
         * @function _syslogCloseHandler
         * @private
         */
        var _syslogCloseHandler = function (code) {

            if (code !== 0) {
                console.log('grep process exited with code ' + code);
                return;
            }

            var str = syslogData.join('').toString(),
                pattern = /^(\w{3}\s+\d+\s+\d+\:\d+\:\d+)\s.*SHUTDOWN_TIME.*/gm;

            while ((match = pattern.exec(str))) {

                eventArray.push({
                    'date' : match[1],
                    'event': 'off',
                    'log'  : 'syslog'
                });
            }

            callback(eventArray);
        };

        /**
         * execute the script syslog
         * set event handlers for syslog script
         */
        syslog = spawn('syslog');
        syslog.stdout.setEncoding('utf8');
        syslog.stdout.on('data', _syslogOutHandler);
        syslog.stderr.on('data', _syslogErrorHandler);
        syslog.on('close', _syslogCloseHandler);
    };



    /**
     * @function _syslogErrorHandler
     * @private
     */
    var _syslogErrorHandler = function (data) {

        console.log('syslog stderr: ' + data);
    };


    /**
     * @function _syslogOutHandler
     * @private
     */
    var _syslogOutHandler = function (data) {

        syslogData.push(data);
    };

    return {
        getLog : getLog
    }
})();

module.exports = Syslog;