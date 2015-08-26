var spawn = require('child_process').spawn;

var Wevtutil = (function(){

    var eventArray, 
        wevtutil,
        wevtutilAsAdmin,
        wevtutilData,
        previousCallbackTime, 
        previousCollection,
        eventIDArray = [],
        activeEvents = [],
        eventStates = [512, 528, 4608, 4801, 4803, 4624, 12, 6005, 6013, 7001], // on states, the rest is off
        events = {
            // Security
            //'512': 'Windows NT is starting up',
            //'513': 'Windows is shutting down', 
            //'528': 'Successful Logon', 
            //'538': 'User Logoff', 
            //'551': 'User initiated logoff', 
            '1100': 'The event logging service has shut down', 
            '4608': 'Windows is starting up',
            '4609': 'Windows is shutting down',
            '4800': 'The workstation was locked',
            '4801': 'The workstation was unlocked',
            '4802': 'screensaver on',
            '4803': 'screensaver off',
            '4624': 'An account was successfully logged on',
            //'4634': 'An account was logged off',
            '4647': 'User initiated logoff',
            // System
            '12': 'The operating system started at system time',
            '13': 'The operating system is shutting down at system time [Date][Timestamp]',
            '109': 'The kernel power manager has initiated a shutdown transition',
            '1074': 'The process %process% has initiated the power off/restart of computer %computer% on behalf of user %user% for the following reason: Other (Unplanned)',
            //'6005': 'The Event log service was started.',
            //'6006': 'The Event log service was stopped.',
            '6013': 'The system uptime is <number> seconds.',
            '7001': 'User Logon Notification for Customer Experience Improvement Program ',
            '7002': 'User Logoff Notification for Customer Experience Improvement Program'
        };


    var options = {
        mergeTime: 1 * 60 * 60 * 1000, // 1 hour
        cacheTime: 1 * 60 * 60 * 1000  // 1 hour
    };


    /**
     * @function getLog
     * @public
     */
    var getLog = function(callback){

        var timePassed = Date.now() - previousCallbackTime;

        if(timePassed > options.cacheTime || isNaN(timePassed)){

            eventArray = [];
            wevtutilData = [];

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


        eventIDArray = [];


        /**
         * @function _wevtutilCloseHandler
         * @private
         */
        var _wevtutilCloseHandler = function (code) {

            if (code !== 0) {
                console.log('wevtutil process exited with code ' + code);
                return;
            }

            /**
             * @function _wevtutilAsAdminCloseHandler
             * @private
             */
            var _wevtutilAsAdminCloseHandler = function(code){

                var str = wevtutilData.join(''),
                    pattern = /(\d{4}\-\d{2}\-\d{2}T\d{2}\:\d{2}\:\d{2}.\d{3})\s+.*:\s+(\d+)/gim;

                while ((match = pattern.exec(str))) {

                    eventArray.push({
                        "date" : new Date(match[1].replace('T',' ')),
                        "event": eventStates.indexOf(parseInt(match[2])) >= 0 ? 'on' : 'off',
                        "log" : '[' + match[2] + '] ' + events[match[2]]
                    });
                };

                previousCallbackTime = new Date();

                _sortEventArray();
                _removeDoubles();

                previousEventArray = eventArray.slice(0);

                _startParsing(callback);
            };


            wevtutilAsAdmin = spawn('wevtutil', ['qe', 'Security', '/q:*[System[' + eventIDArray.join(' or ') + ']]', '/f:text']);
            wevtutilAsAdmin.stdout.setEncoding('utf8');
            wevtutilAsAdmin.stdout.on('data', _wevtutilOutHandler);
            wevtutilAsAdmin.stderr.on('data', _wevtutilErrorHandler);
            wevtutilAsAdmin.on('error', _wevtutilErrorHandler);
            wevtutilAsAdmin.on('close', _wevtutilAsAdminCloseHandler); 
        };

        /**
         * prepare eventIDArray
         */
        Object.keys(events).forEach(function(key) {

            if(activeEvents.length === 0 || activeEvents.indexOf(key) >= 0){

                eventIDArray.push('(EventID=' + key + ')');                    
            }
        });

        /**
         * execute the script wevtutil
         * set event handlers for wevtutil script
         */
        wevtutil = spawn('wevtutil', ['qe', 'System', '/q:*[System[' + eventIDArray.join(' or ') + ']]', '/f:text']);
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

        wevtutilData.push(data);
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
     * @function setOptions
     * @public
     */
    var setOptions = function(key, value){

        options[key] = value;
    };


    /**
     * @function setActiveEvents
     * @public
     */
    var setActiveEvents = function(value){

        activeEvents = value;
    };


    /**
     * @function getActiveEvents
     * @public
     */
    var getActiveEvents = function(){

        return activeEvents;
    };


    /**
     * @function getEvents
     * @public
     */
    var getEvents = function(){

        return events;
    };


    return {
        getLog: getLog,
        setOptions: setOptions,
        setActiveEvents: setActiveEvents,
        getActiveEvents: getActiveEvents,
        getEvents: getEvents
    }
})();

module.exports = Wevtutil;