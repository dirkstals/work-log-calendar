var spawn = require('child_process').spawn;
var fs = require('fs');
var syslog = require('./syslog.js');

var Pmset = (function(){

    var eventArray, pmset, previousCallbackTime, previousCollection, pmsetData;

    var options = {
        mergeTime : 1 * 60 * 60 * 1000, // 1 hour
        cacheTime : 1 * 60 * 60 * 1000 // 1 hour
    };


    /**
     * @function getLog
     * @public
     */
    var getLog = function(callback){

        var timePassed = Date.now() - previousCallbackTime;

        if(timePassed > options.cacheTime || isNaN(timePassed)){

            eventArray = [];
            pmsetData = [];

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
         * @function _pmsetCloseHandler
         * @private
         */
        var _pmsetCloseHandler = function (code) {

            if (code !== 0) {
                console.log('pmset process exited with code ' + code);
                return;
            }

            var str = pmsetData.join(''),
                pattern = /^(\d+\-\d+\-\d+\s*\d+\:\d+\:\d+\s*[\+|\-]\d+)\s.*(Display is turned|powerd process is|Lid|Clamshell)\s(\s*\w+)/gim;

            while ((match = pattern.exec(str))) {
                
                var eventType = ({'on':'on','off':'off','Sleep':'off','Open':'on','started':'on'})[match[3]];
                var logType = ({'on':'display','off':'display','Sleep':'Clamshell sleep','Open':'Lid Open','started':'processd'})[match[3]];
                
                eventArray.push({
                    "date" : new Date(match[1]),
                    "event": eventType,
                    "log" : logType
                });
            }

            previousCallbackTime = new Date();
            
            syslog.getLog(function(data){

                _mergeSyslogAndPmset(data);

                _sortEventArray();
                _checkProcessdHappensOnlyAfterSyslog();
                _removeDoubles();

                previousEventArray = eventArray.slice(0);

                _startParsing(callback);
            })
        };

        /**
         * execute the script pmset
         * set event handlers for pmset script
         */
        pmset = spawn('pmset', ['-g', 'log']);
        pmset.stdout.setEncoding('utf8');
        pmset.stdout.on('data', _pmsetOutHandler);
        pmset.stderr.on('data', _pmsetErrorHandler);
        pmset.on('close', _pmsetCloseHandler);
    };


    /**
     * @function _mergeSyslogAndPmset
     * @private
     */
    var _mergeSyslogAndPmset = function(data){

        var j = data.length;

        while (j--) {
            
            var syslogDate = new Date(data[j].date),
                syslogMonth = syslogDate.getMonth(),
                syslogDay = syslogDate.getDate(),
                included = false;

            var i = eventArray.length;

            while (i--){
            
                var pmsetDate = new Date(eventArray[i].date),
                    pmsetMonth = pmsetDate.getMonth(),
                    pmsetDay = pmsetDate.getDate();

                if(pmsetMonth === syslogMonth && pmsetDay === syslogDay){

                    syslogDate.setFullYear(pmsetDate.getFullYear());
                    data[j].date = syslogDate;
                    included = true;
                    break;
                }

                included = false;
            }

            if(!included){

                data.splice(j,1);
            }
        }

        eventArray = data.concat(eventArray);
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
     * @function _formatDoubleDigit
     * @private
     */
    var _formatDoubleDigit = function(digit){

        return ('0' + digit).slice(-2);
    };


    /**
     * @function _pmsetOutHandler
     * @private
     */
    var _pmsetOutHandler = function (data) {
        pmsetData.push(data);
    };


    /**
     * @function _pmsetCloseHandler
     * @private
     */
    var _pmsetErrorHandler = function (data) {

        console.log('pmset stderr: ' + data);
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

        options[key] = value;
    };

    /**
     *
     */
    var getTotals = function(view, minTime, maxTime){

        var totals = [];

        if(minTime && maxTime){
            minTime = minTime.split(':');
            maxTime = maxTime.split(':');
        }
        
        /**
         * merge start- and endevents together day by day
         */
        for (var i = 0, l = eventArray.length; i < l; i++){

            if((startEvent = eventArray[i]) && 
                (endEvent = eventArray[i + 1]) &&
                startEvent.event === 'on' &&
                endEvent.event === 'off' && 
                startEvent.date >= view.start.toDate() &&
                startEvent.date <= view.end.toDate() &&
                startEvent.date.getDay() === endEvent.date.getDay()){


                if(minTime && maxTime){

                    var minHour = new Date(0, 0, 0, minTime[0], minTime[1], minTime[2]),
                        maxHour = new Date(0, 0, 0, maxTime[0], maxTime[1], maxTime[2]),
                        startHour = new Date(0, 0, 0, startEvent.date.getHours(), startEvent.date.getMinutes(), startEvent.date.getSeconds()),
                        endHour = new Date(0, 0, 0, endEvent.date.getHours(), endEvent.date.getMinutes(), endEvent.date.getSeconds());
                    
                    if(startHour > maxHour || endHour < minHour){
                        
                        continue;
                    }                    
                }

                totals[startEvent.date.getDay()] = (totals[startEvent.date.getDay()] || 0 ) + (endEvent.date - startEvent.date);
            }
        }

        for (var i = 0, l = totals.length; i < l; i++){

            if(totals[i]){

                var hours = Math.floor(totals[i] / (1 * 60 * 60 * 1000) % 24),
                    minutes = Math.floor(totals[i] / ( 1 * 60 * 1000) % 60);

                totals[i] = _formatDoubleDigit(hours) + ":" + _formatDoubleDigit(minutes);
            }
        }

        return totals;
    };

    return {
        getLog : getLog,
        setOptions : setOptions,
        getTotals: getTotals
    }
})();

module.exports = Pmset;