
var $ = require('jquery');
var script = require('./convert');
var config = require('./config');
var helpers = require('./helpers');
var templates = require('./templates');


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
 * @function _slideStartHandler
 * @private
 */
var _slideStartHandler =  function(e){

    $('.slider-handle').addClass('active');
};


/**
 * @function _slideStopHandler
 * @private
 */
var _slideStopHandler =  function(e){

    $('.slider-handle').removeClass('active');

    settings.currentMergeTime = parseInt(e.value); 

    script.setOptions('mergeTime', settings.currentMergeTime);

    refreshCalendar();
};


/**
 * set event handlers for script
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

    refreshCalendar();
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

    refreshCalendar();
};

/**
 * @function _totalsClickHandler
 * @private
 */
var _totalsClickHandler = function(e){

    e.preventDefault();

    var toggle = ($(this).text() === settings.totals[0]);

    settings.showTotals = toggle;
    
    $(this).text(settings.totals[toggle | 0]);

    refreshCalendar();
};

/**
 * @function refreshCalendar
 * @public
 */
var refreshCalendar = function(){

    renderCalendar(options);
};


var calendarElement = $("#calendar");
var settings = config.settings;

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


var options = config.settings.calendar;
    options.eventClick = _calendarEventClickHandler;
    options.events = _calendarEventsHandler;
    options.windowResize = _calendarResizeHandler;


refreshCalendar();


exports.refresh = refreshCalendar;
