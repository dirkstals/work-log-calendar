var spawn = require('child_process').spawn,
    fs = require('fs');

var Syslog = (function(){

    var eventArray, syslog;

    /**
     * @function getLog
     * @public
     */
    var getLog = function(callback){
        
        eventArray = [];
            

        /**
         * @function _syslogCloseHandler
         * @private
         */
        var _syslogCloseHandler = function (code) {

            if (code !== 0) {
                console.log('grep process exited with code ' + code);
                return;
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


        /*
        fs.readFile('./syslog.txt', function read(err, data) {
            if (err) {
                throw err;
            }

            _syslogOutHandler(data);
            _syslogCloseHandler(0);
        });
        */
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

        var str = data.toString(),
            // pattern = /^(\w{3}\s\d+\s\d+:\d+:\d+)\s.+\sshutdown\[(.+)/gm;
            pattern = /^(\w{3}\s+\d+\s+\d+\:\d+\:\d+)\s.*SHUTDOWN_TIME.*/gm;

        while ((match = pattern.exec(str))) {

            eventArray.push({
                "date" : match[1],
                "event": 'off'
            });
        }
    };

    return {
        getLog : getLog
    }
})();

module.exports = Syslog;