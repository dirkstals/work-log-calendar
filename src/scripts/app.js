$ = require('jquery');

global.document = window.document;
global.jQuery = window.$;

require('bootstrap');
require('moment');
require('fullcalendar');
require('./scripts/bootstrap-slider');

require('./scripts/window');
require('./scripts/calendar');


var gui = require('nw.gui');
var notifier = require('node-notifier');
var script = require('./scripts/convert');
var config = require('./scripts/config');


/**
 * @function init
 */
var init = function(){

    var mainWindow = gui.Window.get();
    

    /** 
     * Close App click handler
     */
    var closeappClickHandler = function(e){

        e.preventDefault();

        mainWindow.close();
    };


    /** 
     * Menu click handler
     */
    var menuClickHandler = function(e){

        e.preventDefault();

        mainWindow.showDevTools();
    };


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
     * @function _checkForAlarm
     * @private
     */
    var _checkForAlarmHeartbeat = function(){

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

        setTimeout(_checkForAlarmHeartbeat, 1 * 60 * 1000);
    };

    
    /**
     * set event handlers
     */
    $('#closeapp').on('click', closeappClickHandler);
    $('[data-action="devtools"]').on('click', menuClickHandler);


    /**
     * start the alarm heartbeat
     */
    _checkForAlarmHeartbeat();
};


/**
 * fire init function on document ready
 */
document.addEventListener('DOMContentLoaded', init);
