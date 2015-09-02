$ = require('jquery');

global.document = window.document;
global.jQuery = window.$;

require('bootstrap');
require('moment');
require('fullcalendar');
require('./scripts/window');
require('./scripts/bootstrap-slider');

var gui = require('nw.gui');
var notifier = require('node-notifier');
var script = require('./scripts/convert');
var config = require('./scripts/config');
var helpers = require('./scripts/helpers');
var templates = require('./scripts/templates');


/**
 * @function init
 */
var init = function(){

    var mainWindow = gui.Window.get();
    var calendarElement = $("#calendar");

    var settings = config.settings;


    //Create and add Action button with dropdown in Calendar header. 
    var rightMenu = $(templates.menuRight);

    var leftMenu = templates.menuLeft;

    var settingsWeekend = $(`<a href="#">${settings.weekend[0]}</a>`);
    var businessHours = $(`<a href="#">${settings.businessHours[0]}</a>`);
    var totals = $(`<a href="#">${settings.totals[0]}</a>`);
    var settingsView = $('<a href="#" title="Change Calendar view"><i class="md md-apps"></i></a>');

    rightMenu.find('#viewaction').append(settingsView);
    rightMenu.find('#weekendaction').append(settingsWeekend);
    rightMenu.find('#businesshours').append(businessHours);
    rightMenu.find('#totals').append(totals);

    
    /**
     * Render the Calendar
     */
    var renderCalendar = function(options, open){

        options.defaultDate = calendarElement.fullCalendar('getDate');

        calendarElement.fullCalendar('destroy');
        calendarElement.fullCalendar(options);

        _calendarResizeHandler();

        var toolbar = calendarElement.find('.fc-toolbar');
            toolbar.append(leftMenu);
            toolbar.append(rightMenu);


        settingsWeekend.on('click', _settingsWeekendClickHandler);
        settingsView.on('click', _settingsViewClickHandler);
        businessHours.on('click', _businessHoursClickHandler);
        totals.on('click', _totalsClickHandler);

        config.settings.sliderOptions.value = settings.currentMergeTime;

        $('.slider').slider(config.settings.sliderOptions)
            .on('slideStart', _slideStartHandler)
            .on('slideStop', _slideStopHandler);
    };


    /**
     * @function _calendarResizeHandler
     * @private
     */
    var _calendarResizeHandler = function(view){

        calendarElement.fullCalendar('option', 'contentHeight', window.innerHeight - 137);
    };


    /**
     * @function _calendarEventClickHandler
     * @private
     */
    var _calendarEventClickHandler = function(calEvent, jsEvent, view) {

        // alert(calEvent.title);
    };


    /**
     * @function _calendarEventsHandler
     * @private
     */
    var _calendarEventsHandler = function(start, end, timezone, callback) {

        script.getLog(function(collection){

            callback(collection);

            if(settings.showTotals){

                var calendarView = calendarElement.fullCalendar('getView');

                if(calendarView.type === settings.view[0]){

                    var totals = script.getTotals(calendarView, options.minTime, options.maxTime);

                    for (var i = 0, l = settings.days.length; i < l; i++){

                        if(totals[i]){

                            $('.fc-day-header.fc-' + settings.days[i]).attr('data-total', helpers.milliSecondsToTimeString(totals[i])).addClass('total');
                        }else{

                            $('.fc-day-header.fc-' + settings.days[i]).removeClass('total');
                        }
                    }
                }
            }
        });
    }


    /**
     * @function _slideStopHandler
     * @private
     */
    var _slideStopHandler =  function(e){

        $('.slider-handle').removeClass('active');

        settings.currentMergeTime = parseInt(e.value); 

        script.setOptions('mergeTime', settings.currentMergeTime);

        renderCalendar(options);
    };

    /**
     * @function _slideStartHandler
     * @private
     */
    var _slideStartHandler =  function(e){

        $('.slider-handle').addClass('active');
    };


    /**
     * @function _getEventMenu
     * @private
     */
    var _getEventMenu = function(open){

        var events = script.getEvents();
        var eventList = [];

        for(var eventID in events){

            if (events.hasOwnProperty(eventID)) {

                eventList.push(templates.eventListItem(eventID, events[eventID]));
            }
        }

        return $(templates.eventList(open ? 'open' : '', eventList.join('')));
    };


    /**
     * set event handlers for pmset script
     */
     var _businessHoursClickHandler = function(e){

        e.preventDefault();

        var toggle = (options.minTime) ? 1 : 0;
        var newBusinessHours = settings.businessHours[toggle];

        if(toggle){

            delete options.minTime;
            delete options.maxTime;
        }else{

            options.minTime = settings.minTime;
            options.maxTime = settings.maxTime;
        }

        $(this).text(newBusinessHours);

        renderCalendar(options);
     };


    /** 
     * Calendar views click handler
     */
    var _settingsViewClickHandler = function(e){

        e.preventDefault();

        var toggle = (calendarElement.fullCalendar('getView').type === settings.view[0]);
        var newView = settings.view[toggle | 0];

        options.defaultView = newView;

        calendarElement.fullCalendar('changeView', newView); 
        $(this).find('.md').toggleClass('md-apps', !toggle).toggleClass('md-view-week', toggle); 
    };


    /** 
     * Calendar weekends click Handler
     */
    var _settingsWeekendClickHandler = function(e){

        e.preventDefault();

        var toggle = ($(this).text() === settings.weekend[0]);
        var newWeekend = settings.weekend[toggle | 0];

        options.weekends = toggle;
        $(this).text(newWeekend);
    
        renderCalendar(options);
    };

    var _totalsClickHandler = function(e){

        e.preventDefault();

        var toggle = ($(this).text() === settings.totals[0]);

        settings.showTotals = toggle;
        
        $(this).text(settings.totals[toggle | 0]);
    
        renderCalendar(options);
    };


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


    var options = config.settings.calendar;
        options.eventClick = _calendarEventClickHandler;
        options.events = _calendarEventsHandler;
        options.windowResize = _calendarResizeHandler;

    renderCalendar(options);

    $('.slider').on('slideStop', _slideStopHandler);

    $('#closeapp').on('click', closeappClickHandler);
    $('[data-action="devtools"]').on('click', menuClickHandler);


    /**
     * @function _checkForAlarm
     * @private
     */
    var _checkForAlarmHeartbeat = function(){

        var todaysTotals = script.getTodaysTotal(options.minTime, options.maxTime),
            minutesToGo = Math.round((settings.alarm - todaysTotals) / (60 * 1000)),
            message;

        switch(minutesToGo){

            case ((settings.alarm / (60 * 1000)) / 2):

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

            default:

                message = config.messages.end;
                break;
        }

        if(message){

            config.settings.notification.message = message;

            notifier.notify(config.settings.notification, _notificationHandler).on('click', _notificationClickHandler);    
        }

        setTimeout(_checkForAlarmHeartbeat, 1 * 60 * 1000);
    };

    _checkForAlarmHeartbeat();
};


/**
 * fire init function on document ready
 */
document.addEventListener('DOMContentLoaded', init);
