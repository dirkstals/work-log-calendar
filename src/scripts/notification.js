
var notifier = require('node-notifier');
var script = require('./convert');
var config = require('./config');


/**
 * @function _notificationHandler
 * @private
 */
var _notificationHandler = function (err, data) {

    console.log('Waited');
    console.log(err, data);
};


/**
 * @function _notificationClickHandler
 * @private
 */
var _notificationClickHandler = function(e){

    console.log(arguments);
};


/**
 * @function heartbeat
 * @public
 */
var heartbeat = function(){

    var todaysTotals = script.getTodaysTotal(config.settings.calendar.minTime, config.settings.calendar.maxTime),
        minutesToGo = Math.round((config.settings.alarm - todaysTotals) / (60 * 1000)),
        message;

    switch(minutesToGo){

        case ((config.settings.alarm / (60 * 1000)) / 2):

            message = config.messages.half;
            break;
        case 60:

            message = config.messages.hour;
            break;
        case 30:
        case 20:
        case 15:
        case 10:
        case 5:

            message = config.messages.minutes(minutesToGo);
            break;
        case 0:

            message = config.messages.end;
            break;
    }

    if(message){

        config.settings.notification.message = message;

        notifier.notify(config.settings.notification, _notificationHandler).on('click', _notificationClickHandler);    
    }

    setTimeout(heartbeat, config.settings.notificationHeartbeat);
};


exports.heartbeat = heartbeat;
