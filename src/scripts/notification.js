
var notifier = require('node-notifier');
var script = require('./dataManager');
var config = require('./config');
var menu = require('./menu');


/**
 * @function _notificationClickHandler
 * @private
 */
var _notificationClickHandler = function(e){

    menu.open();
};


/**
 * @function heartbeat
 * @public
 */
var heartbeat = function(){
    //
    // var todaysTotals = script.getTodaysTotal(config.settings.calendar.minTime, config.settings.calendar.maxTime),
    //     minutesToGo = Math.round((config.settings.alarm - todaysTotals) / (60 * 1000)),
    //     message;
    //
    // switch(minutesToGo){
    //
    //     case ((config.settings.alarm / (60 * 1000)) / 2):
    //
    //         message = config.messages.half;
    //         break;
    //     case 60: case 30: case 20: case 15: case 10: case 5:
    //
    //         message = config.messages.minutes(minutesToGo);
    //         break;
    //     case 0: case -1: case -2:
    //
    //         message = config.messages.end;
    //         break;
    // }
    //
    // if(message){
    //
    //     config.settings.notification.message = message;
    //
    //     notifier.notify(config.settings.notification).on('click', _notificationClickHandler);
    // }
    //
    // setTimeout(heartbeat, config.settings.notificationHeartbeat);
};


exports.heartbeat = heartbeat;
