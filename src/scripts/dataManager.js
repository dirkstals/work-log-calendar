
'use strict';

const EventEmitter = require('events');
const DataCollector = require('./dataCollector');
const config = require('./config');
const helpers = require('./helpers');

class DataManager extends EventEmitter {

    constructor() {

        super();

        this.previousDataCollectTimestamp = null;
        this.currentStartDate = null;
        this.currentEndDate = null;

        this.eventArray = {}; //window.localStorage.getItem('events') ? JSON.parse(window.localStorage.getItem('events')) : {};
        this.manipulatedEventArray = {};

        this.dataCollector = new DataCollector();

        this.dataCollector.on('timeslot', this.dataCollectorTimeslotHandler.bind(this));
        this.dataCollector.on('complete', this.dataCollectorCompleteHandler.bind(this));
    }

    dataCollectorTimeslotHandler(timeslot) {

        this.splitAndArchiveTimeslot(timeslot);
    }

    splitAndArchiveTimeslot(timeslot) {

        if(timeslot.start.timestamp.toDateString() !== timeslot.end.timestamp.toDateString()) {

            var timeslotPart = timeslot;
            timeslotPart.end.timestamp = timeslot.start.timestamp;
            timeslotPart.end.timestamp.setHours(23,59,59,999);

            this.archiveTimeslot(timeslotPart);

            // TODO
            // split up between data

            var timeslotRest = timeslot;
            timeslotRest.start.timestamp.setDate(timeslot.start.timestamp.getDate() + 1);
            timeslotRest.start.timestamp.setHours(0,0,0,0);

            this.splitAndArchiveTimeslot(timeslotRest);
        } else {

            this.archiveTimeslot(timeslot);
        }
    }

    archiveTimeslot(timeslot) {

        const day = timeslot.start.timestamp.toDateString();
        let match = false;

        if(!this.eventArray[day]) {
            this.eventArray[day] = [];
        }

        //timeslot = this.parseSSID(timeslot);

        // do not add if allready in cache
        for(var i = 0, l = this.eventArray[day].length; i < l; i++) {
            if(this.eventArray[day][i].start.timestamp === timeslot.start.timestamp &&
               this.eventArray[day][i].end.timestamp === timeslot.end.timestamp) {
                match = true;
            }
        }

        if(!match) {
            this.eventArray[day].push(timeslot);

            // only emit when asked dates have new data
            if(this.currentStartDate &&
               this.currentEndDate &&
               timeslot.start.timestamp.getTime() > this.currentStartDate.getTime() &&
               timeslot.end.timestamp.getTime() < this.currentEndDate.getTime()) {
                this.emit('newdata');
            }
        }
    }
    //
    // parseSSID(timeslot) {
    //     timeslot.between.type.set
    //     this.SSIDS.push();
    // }

    dataCollectorCompleteHandler() {
        window.localStorage.setItem('events', JSON.stringify(this.eventArray));
        // send to cloud
    }

    getTotalForDate(day) {

        const startOfDay = new Date(day.getFullYear(),day.getMonth(),day.getDate(),0,0,0);
        const minTime = startOfDay.setMilliseconds(config.settings.minTime);
        const maxTime = startOfDay.setMilliseconds(config.settings.maxTime);

        let total = 0;

        for(let i = 0; i < this.manipulatedEventArray[day.toDateString()].length; i++) {
            const timeslot = this.manipulatedEventArray[day.toDateString()][i];
            let value = 0;

            if(timeslot.start.timestamp.getTime() < maxTime && timeslot.end.timestamp.getTime() > minTime) {
                value = Math.abs(timeslot.end.timestamp.getTime() - timeslot.start.timestamp.getTime())
            }

            total += value;
        }

        return total;
    }

    doForEachDay(startDate, endDate, callback) {

        const days = Math.ceil(Math.abs((endDate.getTime() - startDate.getTime())/(24*60*60*1000)));

        for(var i = 0; i < days; i++) {
            let selectedDayDate = new Date(endDate.getTime());
            selectedDayDate.setDate(endDate.getDate() - (days - i));
            callback(selectedDayDate);
        }
    }

    getTotals(startDate, endDate){

        var totals = [];

        this.doForEachDay(startDate, endDate, function(day){
            if(this.manipulatedEventArray[day.toDateString()]) {
                totals[day.getDay()] = this.getTotalForDate(day);
            }
        }.bind(this));

        return totals;
    }


    // dataCollector.collectNewData();

    // group by ssid
    // filter by date (range, merge)

    // emit only new data

    checkforNewData() {

        let timePassed = Date.now() - this.previousDataCollectTimestamp;

        if(timePassed > config.settings.cacheTime || isNaN(timePassed)){

            this.previousDataCollectTimestamp = new Date();

            this.dataCollector.collectNewData();
        }
    }

    getData(startDate, endDate) {
        // get fresh data
        this.manipulatedEventArray = {};

        // store date slot
        this.currentStartDate = startDate;
        this.currentEndDate = endDate;

        this.doForEachDay(startDate, endDate, function(day){
            if(this.eventArray[day.toDateString()]) {
                this.manipulatedEventArray[day.toDateString()] = JSON.parse(JSON.stringify(this.eventArray[day.toDateString()]));
            }
        }.bind(this));

        // get cloud data

        Object.keys(this.manipulatedEventArray).forEach(function(key) {
            this.convert(key);
            this.sort(key);
            // remove doubles
            this.merge(key);
        }.bind(this));

        var today = new Date();
        var todaysEvents = this.manipulatedEventArray[today.toDateString()];

        if(todaysEvents) {
            this.manipulatedEventArray[today.toDateString()][todaysEvents.length - 1].end.timestamp = today;
        }

        return this.manipulatedEventArray;

        // _parseSSID();
        // _colorSSID();
    }

    convert(key) {
        // back to date from stringify
        this.manipulatedEventArray[key].map(function(timeslot){
            timeslot.start.timestamp = (typeof timeslot.start.timestamp === 'string') ? new Date(timeslot.start.timestamp) : timeslot.start.timestamp;
            timeslot.end.timestamp = (typeof timeslot.end.timestamp === 'string') ? new Date(timeslot.end.timestamp) : timeslot.end.timestamp;
            return timeslot;
        });
    }

    sort(key) {
        this.manipulatedEventArray[key].sort(function(a,b){
            return a.start.timestamp.getTime() - b.start.timestamp.getTime();
        });
    }

    merge(key) {

        let i = this.manipulatedEventArray[key].length;

        while (i--) {

            const previousTimeslot = this.manipulatedEventArray[key][i - 1];
            const currentTimeslot  = this.manipulatedEventArray[key][i];

            if (previousTimeslot && currentTimeslot &&
               (currentTimeslot.start.timestamp.getTime() - previousTimeslot.end.timestamp.getTime()) < config.settings.mergeTime) {

                if(!previousTimeslot.between) {
                    this.manipulatedEventArray[key][i - 1].between = [];
                }

                this.manipulatedEventArray[key][i - 1].between.push(currentTimeslot.start);
                this.manipulatedEventArray[key][i - 1].between.concat(currentTimeslot.between);
                this.manipulatedEventArray[key][i - 1].end = currentTimeslot.end;

                this.manipulatedEventArray[key].splice(i, 1);
            }
        }
    }

    getSSIDs() {

        return this.eventColors ? Object.keys(eventColors) : [];
    }
}

module.exports = DataManager;

//
// var eventArray,
//     previousCallbackTime,
//     previousEventArray,
//     colorList,
//     observable,
//     eventColors;
//
// var systemScriptOptions   = config.settings.windows ? config.settings.wevtutilSystemOptions   : config.settings.logOptions,
//     securityScriptOptions = config.settings.windows ? config.settings.wevtutilSecurityOptions : config.settings.logOptions;
//
//
// /**
//  * @function getLog
//  * @public
//  */
// var getLog = function(callback){
//
//     var timePassed = Date.now() - previousCallbackTime;
//
//     if(timePassed > config.settings.cacheTime || isNaN(timePassed)){
//
//         eventArray = [];
//
//         _executeScript(callback);
//     }else{
//
//         eventArray = previousEventArray.slice(0);
//
//         _startParsing(callback);
//     }
// };
//
//
// /**
//  * @function _executeScript
//  * @private
//  */
// var _executeScript = function(callback){
//
//
//     /**
//      * @function _securityScriptCallback
//      * @private
//      */
//     var _securityScriptCallback = function (eventList) {
//
//         eventArray = eventArray.concat(eventList);
//
//         _sortEventArray();
//         _parseSSID();
//         _colorSSID();
//
//         previousCallbackTime = new Date();
//         previousEventArray = eventArray.slice(0);
//
//         _startParsing(callback);
//     };
//
//
//     /**
//      * @function _script
//      * @private
//      */
//     var _systemScriptCallback = function (eventList) {
//
//         eventArray = eventArray.concat(eventList);
//
//         Shell.getEvents(securityScriptOptions, _securityScriptCallback);
//     };
//
//     Shell.getEvents(systemScriptOptions, config.settings.windows ? _systemScriptCallback : _securityScriptCallback);
// };
//
//
// /**
//  * @function _colorSSID
//  * @private
//  */
// var _colorSSID = function(){
//
//     colorList = [
//         '#009688', // Teal
//         '#FF5722', // Deep Orange
//         '#2196F3', // Blue
//         '#F44336', // Red
//         '#673AB7', // Deep purple
//         '#E91E63', // Pink
//         '#607D8B', // Blue Grey
//         '#9C27B0', // Purple
//         '#795548'  // Brown
//     ];
//     eventColors = {'none': colorList.shift()};
//
//     for (var i = 0, l = eventArray.length; i < l; i++){
//
//         if(!(eventArray[i].ssid in eventColors)){
//
//             eventColors[eventArray[i].ssid] = colorList.shift();
//         }
//     }
// };
//
//
// /**
//  * @function _parseSSID
//  * @private
//  */
// var _parseSSID = function(){
//
//     var el = eventArray.length;
//     var ssid = 'none';
//
//     firstOnEvent = eventArray.length;
//
//
//     for (var i = 0; currentEvent = eventArray[i]; i++){
//
//         currentEvent.ssid = ssid;
//
//         if(currentEvent.event === 'on' && firstOnEvent > i){
//
//             firstOnEvent = i;
//         }
//
//         if(currentEvent.event === 'off'){
//
//             if(firstOnEvent < eventArray.length){
//
//                 for(var j = firstOnEvent; j < i; j++){
//
//                     eventArray[j].ssid = ssid;
//                 }
//
//                 firstOnEvent = eventArray.length;
//             }
//         }
//
//         if(currentEvent.event === 'set'){
//
//             ssid = currentEvent.data;
//
//             if(firstOnEvent < eventArray.length){
//
//                 for(var j = firstOnEvent; j < i; j++){
//
//                     eventArray[j].ssid = ssid;
//                 }
//             }
//         }
//     }
//
//     config.settings.currentSSID = ssid;
//
//     while (el--) {
//
//         if(eventArray[el].event === 'set'){
//
//             eventArray.splice(el,1);
//         }
//     }
// };
//
//
// /**
//  * @function _prepareCollection
//  * @private
//  */
// var _prepareCollection = function(){
//
//     var collection = [];
//
//     /**
//      * merge start- and endevents together
//      */
//     for (var i = 0, l = eventArray.length; i < l; i++){
//
//         if((startEvent = eventArray[i]) && (endEvent = eventArray[i + 1]) &&
//             startEvent.event === 'on' && endEvent.event === 'off'){
//
//             var title = (startEvent.ssid === 'none' || startEvent.ssid === 'undefined') ? '' : ' ' + startEvent.ssid;
//
//             var event = {
//                 'title' : helpers.milliSecondsToTimeString(endEvent.date - startEvent.date) + (config.settings.filter ? title : ''),
//                 'start': startEvent.date.toJSON(),
//                 'end': endEvent.date.toJSON()
//             };
//
//             if(config.settings.filter){
//
//                 event.color = eventColors[startEvent.ssid];
//             }
//
//             collection.push(event);
//         }
//     }
//
//     return collection;
// };
//
//
//
//
// /**
//  * @function getTotals
//  * @public
//  */
// var getTotals = function(view, minTime, maxTime, ssid){
//
//     return _getSpecificTotals(view.start.toDate(), view.end.toDate(), minTime, maxTime, ssid);
// };
//
//
// /**
//  * @function getTodaysTotal
//  * @public
//  */
// var getTodaysTotal = function(minTime, maxTime){
//
//     var today = new Date();
//
//     return (_getSpecificTotals(today.setHours(0,0,0,0), today.setHours(23,59,59,999), minTime, maxTime))[today.getDay()] || 0;
// };
//
//
// /**
//  * @function _getSpecificTotals
//  * @private
//  */
// var _getSpecificTotals = function(startDate, endDate, minTime, maxTime, ssid){
//
//     var totals = [];
//
//     if(eventArray) {
//
//         for (var i = 0, l = eventArray.length; i < l; i++){
//
//             if((startEvent = eventArray[i]) && (endEvent = eventArray[i + 1]) &&
//                 startEvent.event === 'on' && endEvent.event === 'off' &&
//                 startEvent.date >= startDate && startEvent.date <= endDate &&
//                 startEvent.date.getDay() === endEvent.date.getDay()){
//
//                 if(minTime && maxTime){
//
//                     var startHour =
//                         (startEvent.date.getHours() * 60 * 60 * 1000) +
//                         (startEvent.date.getMinutes() * 60 * 1000) +
//                         (startEvent.date.getSeconds() * 1000);
//
//                     var endHour =
//                         (endEvent.date.getHours() * 60 * 60 * 1000) +
//                         (endEvent.date.getMinutes() * 60 * 1000) +
//                         (endEvent.date.getSeconds() * 1000);
//
//                     if(startHour > maxTime || endHour < minTime){
//
//                         continue;
//                     }
//                 }
//
//                 if(config.settings.filter && ssid && startEvent.ssid !== ssid){
//
//                     continue
//                 }
//
//                 totals[startEvent.date.getDay()] = (totals[startEvent.date.getDay()] || 0 ) + ((endEvent.log === 'added' ? new Date() : endEvent.date) - startEvent.date);
//             }
//         }
//     }
//
//     return totals;
// };
//
// /**
//  * @function getSSIDs
//  * @public
//  */
// var getSSIDs = function(){
//
//     return eventColors ? Object.keys(eventColors) : [];
// }
//
// exports.getLog = getLog;
// exports.setOptions = setOptions;
// exports.getTotals = getTotals;
// exports.getTodaysTotal = getTodaysTotal;
// exports.getSSIDs = getSSIDs;
