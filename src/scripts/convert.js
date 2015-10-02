
var fs = require('fs');

var Shell = require('./shell');
var config = require('./config');
var helpers = require('./helpers');

var eventArray, 
    previousCallbackTime, 
    previousEventArray,
    colorList,
    eventColors;

var systemScriptOptions   = config.settings.windows ? config.settings.wevtutilSystemOptions   : config.settings.pmsetOptions,
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


    var _oldEventsAdded = function(){

        _removeDoubles();

        previousCallbackTime = new Date();
        previousEventArray = eventArray.slice(0);

        _startParsing(callback);
    };


    /**
     * @function _securityScriptCallback
     * @private
     */
    var _securityScriptCallback = function (eventList) {

        eventArray = eventArray.concat(eventList);

        _sortEventArray();
        _parseSSID();
        _checkProcessdHappensOnlyAfterSyslog();
        _addOldEvents(_oldEventsAdded);
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
 * @function _parseSSID
 * @private
 */
var _parseSSID = function(){
    
    var el = eventArray.length;
    var ssid = 'none';

    colorList = [
        '#009688', // Teal
        '#FF5722', // Deep Orange
        '#2196F3', // Blue
        '#F44336', // Red
        '#673AB7', // Deep purple
        '#E91E63', // Pink
        '#607D8B', // Blue Grey
        '#9C27B0', // Purple
        '#795548'  // Brown
    ];
    eventColors = {'none': colorList.shift()};
    firstOnEvent = eventArray.length;


    for (var i = 0; currentEvent = eventArray[i]; i++){

        currentEvent.ssid = ssid;

        if(currentEvent.event === 'on' && firstOnEvent > i){
               
            firstOnEvent = i;
        }

        if(currentEvent.event === 'off'){

            if(firstOnEvent < eventArray.length){

                for(var j = firstOnEvent; j < i; j++){

                    eventArray[j].ssid = ssid;
                }

                firstOnEvent = eventArray.length;
            }
        }

        if(currentEvent.event === 'set'){
            
            ssid = currentEvent.data;

            if(firstOnEvent < eventArray.length){

                for(var j = firstOnEvent; j < i; j++){

                    eventArray[j].ssid = ssid;
                }
            }

            if(!(ssid in eventColors)){

                eventColors[ssid] = colorList.shift();
            }
        }
    }

    config.settings.currentSSID = ssid;

    while (el--) {
        
        if(eventArray[el].event === 'set'){

            eventArray.splice(el,1);
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

            var title = (startEvent.ssid === 'none' || startEvent.ssid === 'undefined') ? '' : ' ' + startEvent.ssid;

            var event = {
                'title' : helpers.milliSecondsToTimeString(endEvent.date - startEvent.date) + (config.settings.filter ? title : ''),
                'start': startEvent.date.toJSON(),
                'end': endEvent.date.toJSON()
            };

            if(config.settings.filter){

                event.color = eventColors[startEvent.ssid];
            }

            collection.push(event);
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

                if((config.settings.filter && previousEvent.ssid === currentEvent.ssid) ||
                    !config.settings.filter){
                    
                    if ((currentEvent.date - previousEvent.date) < config.settings.mergeTime){

                        eventArray.splice(i-1, 2);
                        i--;
                    }
                }
            }
        }
    }
};


/**
 * @function _addOldEvents
 * @private
 */
var _addOldEvents = function(callback){

    /**
     * @function _readOldEventsFile
     * @private
     */
    var _readOldEventsFile = function(error, data){

        if(oldEventArray = JSON.parse(data || null)){
            
            /** 
             * merge old and new events
             */
            eventArray = oldEventArray.concat(eventArray);


            _convertStringToDate();
            _sortEventArray();


            /** 
             * remove all unwanted entries.
             */
            for(var i = 0, l = eventArray.length; i < l; i++){

                _checkNextEntry(eventArray, i, i + 1);
            }


            /**
             * Remove the undefined entries
             */
            eventArray = eventArray.filter( function( el ){ return (typeof el !== "undefined"); } );
        }

        fs.writeFile(config.settings.oldEventsFile, JSON.stringify(eventArray));

        callback();
    };
    
    fs.readFile(config.settings.oldEventsFile, 'utf8', _readOldEventsFile);    
};


/**
 * Check and delete the same items
 */
var _checkNextEntry = function(arr, i, j){

    if(arr[i] && arr[j] && (arr[i].date.getTime() === arr[j].date.getTime())){

        arr[i] = _mergeOptions(arr[i], arr[j]);
        delete arr[j];

        _checkNextEntry(arr, i, j + 1);
    } 
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
};


/**
 * @function _mergeOptions
 * @private
 */
var _mergeOptions = function(obj1, obj2){

    var obj3 = {};

    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }

    return obj3;
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
var getTotals = function(view, minTime, maxTime, ssid){

    return _getSpecificTotals(view.start.toDate(), view.end.toDate(), minTime, maxTime, ssid);
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
var _getSpecificTotals = function(startDate, endDate, minTime, maxTime, ssid){

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

            if(config.settings.filter && ssid && startEvent.ssid !== ssid){

                continue
            }

            totals[startEvent.date.getDay()] = (totals[startEvent.date.getDay()] || 0 ) + ((endEvent.log === 'added' ? new Date() : endEvent.date) - startEvent.date);
        }
    }

    return totals;
};

/**
 * @function getSSIDs
 * @public
 */
var getSSIDs = function(){

    return eventColors ? Object.keys(eventColors) : [];
}
    
exports.getLog = getLog;
exports.setOptions = setOptions;
exports.getTotals = getTotals;
exports.getTodaysTotal = getTodaysTotal;
exports.getSSIDs = getSSIDs;
