var spawn = require('child_process').spawn,
    parseString = require('xml2js').parseString;

var Wevtutil = (function(){

    var eventArray, 
        wevtutil,
        previousCallbackTime, 
        previousCollection,
        eventIDArray = [],
        events = {

            Security : {
                
                '512' : 'on',  // Windows NT is starting up
                '513' : 'off', // Windows is shutting down
                
                '528' : 'on',  // Successful Logon
                '538' : 'off', // User Logoff
                '551' : 'off', // User initiated logoff

                '1100': 'off', // The event logging service has shut down

                '4608': 'on',  // Windows is starting up
                '4609': 'off', // Windows is shutting down
                
                '4800': 'off', // The workstation was locked
                '4801': 'on',  // The workstation was unlocked
                
                '4802': 'off', // screensaver on
                '4803': 'on',  // screensaver off
                
                '4624': 'on',  // An account was successfully logged on
                '4634': 'off', // An account was logged off
                '4647': 'off'  // User initiated logoff

            },
            System : {

                '12'  : 'on',  // The operating system started at system time
                '13'  : 'off', // The operating system is shutting down at system time [Date][Timestamp]
                
                '109' : 'off', // The kernel power manager has initiated a shutdown transition

                '1074': 'off', // The process %process% has initiated the power off/restart of computer %computer% on behalf of user %user% for the following reason: Other (Unplanned)

                '6005': 'on',  // The Event log service was started.
                '6006': 'off', // The Event log service was stopped.

                '6013': 'on',  // The system uptime is <number> seconds.

                '7001': 'on',  // User Logon Notification for Customer Experience Improvement Program 
                '7002': 'off'  // User Logoff Notification for Customer Experience Improvement Program                 

            }
        };


    var options = {
        mergeTime: 1 * 60 * 60 * 1000, // 1 hour
        cacheTime: 1 * 60 * 60 * 1000, // 1 hour
        eventEnvironment: 'System',
        previousEnvironment: 'System'
    };

    /**
     * prepare eventIDArray
     */
    Object.keys(events[options.eventEnvironment]).forEach(function(key) {

        eventIDArray.push('(EventID=' + key + ')');
    });

    /**
     * @function getLog
     * @public
     */
    var getLog = function(callback){

        var timePassed = Date.now() - previousCallbackTime;

        if(timePassed > options.cacheTime || isNaN(timePassed) || options.previousEnvironment !== options.eventEnvironment){

            eventArray = [];
            options.previousEnvironment = options.eventEnvironment;

            _executeScript(callback);
        }else{

            eventArray = previousEventArray.slice(0);

            _startParsing(callback);
        }

    };

    /**
     * @function _executeScript
     * @private
     */
    var _executeScript = function(callback){

        /**
         * @function _wevtutilCloseHandler
         * @private
         */
        var _wevtutilCloseHandler = function (code) {

            if (code !== 0) {
                console.log('wevtutil process exited with code ' + code);
                return;
            }

            console.log(eventArray.slice(0));

            _sortEventArray();
            _removeDoubles();

            previousEventArray = eventArray.slice(0);

            _startParsing(callback);
        };

        /**
         * execute the script wevtutil
         * set event handlers for wevtutil script
         */
        wevtutil = spawn('wevtutil', ['qe', options.eventEnvironment, '/q:*[System[' + eventIDArray.join(' or ') + ']]']);
        wevtutil.stdout.setEncoding('utf8');
        wevtutil.stdout.on('data', _wevtutilOutHandler);
        wevtutil.stderr.on('data', _wevtutilErrorHandler);
        wevtutil.on('error', _wevtutilErrorHandler);
        wevtutil.on('close', _wevtutilCloseHandler);
    }



    /**
     * @function _wevtutilErrorHandler
     * @private
     */
    var _wevtutilErrorHandler = function (data) {

        console.log('wevtutil stderr: ' + data);
    };


    /**
     * @function _wevtutilOutHandler
     * @private
     */
    var _wevtutilOutHandler = function (data) {

        parseString(data, function (err, result) {

            var d = new Date(result.Event.System[0].TimeCreated[0]['$'].SystemTime);

            if(d.getFullYear() == '2015'){

                var eventID;

                if(isNaN(result.Event.System[0].EventID)){
                    
                    eventID = result.Event.System[0].EventID[0]['_'];
                }else{

                    eventID = result.Event.System[0].EventID;
                }

                eventArray.push({
                    'date': d,
                    'event': events[options.eventEnvironment][eventID],
                    'log': 'wevtutil ' + eventID
                });
            }
        });
    };


    /**
     * @function _startParsing
     * @private
     */
    var _startParsing = function(callback){

        _addOldEvents();
        _convertStringToDate();
        _mergeEvents();
        _addCurrentTime();

        callback(_prepareCollection());
    };


    /**
     * @function _formatDoubleDigit
     * @private
     */
    var _formatDoubleDigit = function(digit){

        return ('0' + digit).slice(-2);
    }

    /**
     * @function _addCurrentTime
     * @private
     */
    var _addCurrentTime = function(){

        /**
         * add the current time as last array.
         */
        eventArray.push({
            "date" : new Date(),
            "event": 'off',
            "log": 'added'
        });
    }

    /**
     * @function _prepareCollection
     * @private
     */
    var _prepareCollection = function(){

        var collection = [];

        /**
         * merge start- and endevents together
         */
        for (var i = 0, l = eventArray.length; i < l; i++){

            if((startEvent = eventArray[i]) && 
                (endEvent = eventArray[i + 1]) &&
                startEvent.event === 'on' &&
                endEvent.event === 'off'){

                var hours = Math.floor((endEvent.date - startEvent.date) / (1 * 60 * 60 * 1000) % 24),
                    minutes = Math.floor((endEvent.date - startEvent.date) / ( 1 * 60 * 1000) % 60);
                
                collection.push({
                    "title" : _formatDoubleDigit(hours) + ":" + _formatDoubleDigit(minutes),
                    "start": startEvent.date.toJSON(),
                    "end": endEvent.date.toJSON()
                });
            }
        }

        return collection;
    }


    /**
     * @function _convertStringToDate
     * @private
     */
    var _convertStringToDate = function(){

        for(var i = 0, l = eventArray.length; i < l; i++){

            eventArray[i].date = new Date(eventArray[i].date);
        }
    };


    /**
     * @function _removeDoubles
     * @private
     */
    var _removeDoubles = function(){

        var i = eventArray.length;

        while (i--) {

            if ((previousEvent = eventArray[i - 1]) && (currentEvent = eventArray[i])){
                
                if (previousEvent.event === 'off' && currentEvent.event === 'off'){

                    eventArray.splice(i-1, 1);
                }else if (previousEvent.event === 'on' && currentEvent.event === 'on'){

                    eventArray.splice(i, 1);
                }
            }
        }
    };


    /**
     * @function _mergeEvents
     * @private
     */
    var _mergeEvents = function(){

        /**
         * remove events when time between is too small.
         */
        var i = eventArray.length;

        while (i--) {
            
            if ((previousEvent = eventArray[i - 1]) && (currentEvent = eventArray[i])){
                
                if (previousEvent.event === 'off' && currentEvent.event === 'on'){
                    
                    if ((currentEvent.date - previousEvent.date) < options.mergeTime){

                        eventArray.splice(i-1, 2);
                        i--;
                    }
                }
            }
        }
    };

    /**
     * @function _addOldEvents
     * @private
     */
    var _addOldEvents = function(){

        if((oldEventArray = JSON.parse(window.localStorage.getItem('events') || 'null'))){

            for(var i = 0, l = oldEventArray.length; i < l; i++){
                
                if(new Date(oldEventArray[i].date).getTime() === eventArray[0].date.getTime()){
                    
                    eventArray = oldEventArray.slice(0, i).concat(eventArray);
                    break;
                }
            }
        }

        // refill localstorage
        window.localStorage.setItem('events', JSON.stringify(eventArray));

    }
    

    /**
     * @function _sortEventArray
     * @private
     */
     var _sortEventArray = function(){

        /**
         * sort events on date
         */
        eventArray.sort(function(a,b){
          
            return new Date(a.date) - new Date(b.date);
        });
     }

    /**
     * set options
     */
    var setOptions = function(key, value){

        options[key] = value;
    };


    return {
        getLog : getLog,
        setOptions : setOptions
    }
})();

module.exports = Wevtutil;