var Shell = require('./shell');
var config = require('./config');
var helpers = require('./helpers');


var Pmset = (function(){

    var eventArray, 
        previousCallbackTime, 
        previousEventArray;

    var systemScriptOptions = config.settings.windows ? config.settings.wevtutilSystemOptions : config.settings.pmsetOptions,
        securityScriptOptions = config.settings.windows ? config.settings.wevtutilSecurityOptions : config.settings.syslogOptions;


    /**
     * @function getLog
     * @public
     */
    var getLog = function(callback){

        var timePassed = Date.now() - previousCallbackTime;

        if(timePassed > config.settings.cacheTime || isNaN(timePassed)){

            eventArray = [];

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
         * @function _securityScriptCallback
         * @private
         */
        var _securityScriptCallback = function (eventList) {

            eventArray = eventArray.concat(eventList);

            _sortEventArray();
            _checkProcessdHappensOnlyAfterSyslog();
            _removeDoubles();

            previousCallbackTime = new Date();
            previousEventArray = eventArray.slice(0);

            _startParsing(callback);
        };


        /**
         * @function _script
         * @private
         */
        var _systemScriptCallback = function (eventList) {

            eventArray = eventArray.concat(eventList);

            Shell.getEvents(securityScriptOptions, _securityScriptCallback);
        };

        Shell.getEvents(systemScriptOptions, _systemScriptCallback);
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
     * @function _checkProcessdHappensOnlyAfterSyslog
     * @private
     */
    var _checkProcessdHappensOnlyAfterSyslog = function(){
        
        var i = eventArray.length;

        while (i--) {
            
            if ((previousEvent = eventArray[i - 1]) && (currentEvent = eventArray[i])){
                
                if (currentEvent.log === 'processd' && previousEvent.log !== 'syslog'){
                    
                    eventArray.splice(i,1);
                }
            }
        }        
    };


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
    };

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

            if((startEvent = eventArray[i]) && (endEvent = eventArray[i + 1]) &&
                startEvent.event === 'on' && endEvent.event === 'off'){

                collection.push({
                    "title" : helpers.milliSecondsToTimeString(endEvent.date - startEvent.date),
                    "start": startEvent.date.toJSON(),
                    "end": endEvent.date.toJSON()
                });
            }
        }

        return collection;
    };


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
                    
                    if ((currentEvent.date - previousEvent.date) < config.settings.mergeTime){

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

    };
    

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
    };

    /**
     * set options
     */
    var setOptions = function(key, value){

        config.settings[key] = value;
    };


    /**
     * @function getTotals
     * @public
     */
    var getTotals = function(view, minTime, maxTime){

        return _getSpecificTotals(view.start.toDate(), view.end.toDate(), minTime, maxTime);
    };


    /**
     * @function getTodaysTotal
     * @public
     */
    var getTodaysTotal = function(minTime, maxTime){

        var today = new Date();

        return (_getSpecificTotals(today.setHours(0,0,0,0), today.setHours(23,59,59,999), minTime, maxTime))[today.getDay()] || 0;
    };


    /**
     * @function _getSpecificTotals
     * @private
     */
    var _getSpecificTotals = function(startDate, endDate, minTime, maxTime){

        var totals = [];

        for (var i = 0, l = eventArray.length; i < l; i++){

            if((startEvent = eventArray[i]) && (endEvent = eventArray[i + 1]) &&
                startEvent.event === 'on' && endEvent.event === 'off' && 
                startEvent.date >= startDate && startEvent.date <= endDate &&
                startEvent.date.getDay() === endEvent.date.getDay()){

                if(minTime && maxTime){

                    var startHour = 
                        (startEvent.date.getHours() * 60 * 60 * 1000) + 
                        (startEvent.date.getMinutes() * 60 * 1000) + 
                        (startEvent.date.getSeconds() * 1000);

                    var endHour = 
                        (endEvent.date.getHours() * 60 * 60 * 1000) + 
                        (endEvent.date.getMinutes() * 60 * 1000) + 
                        (endEvent.date.getSeconds() * 1000);

                    if(startHour > maxTime || endHour < minTime){
                        
                        continue;
                    }                    
                }

                totals[startEvent.date.getDay()] = (totals[startEvent.date.getDay()] || 0 ) + ((endEvent.log === 'added' ? new Date() : endEvent.date) - startEvent.date);
            }
        }

        return totals;
    };


    return {
        getLog: getLog,
        setOptions: setOptions,
        getTotals: getTotals,
        getTodaysTotal: getTodaysTotal        
    }
})();

module.exports = Pmset;