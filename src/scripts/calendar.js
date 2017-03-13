
var $ = require('jquery');
var dataManeger = require('./dataManager');
var config = require('./config');
var helpers = require('./helpers');
var templates = require('./templates');
var DataCollector = require('./dataCollector');

global.document = window.document;

require('moment');
require('fullcalendar');


var calendarElement,
    settings,
    rightMenu,
    leftMenu,
    settingsWeekend,
    businessHours,
    totals,
    settingsView;


/**
 * Render the Calendar
 */
var renderCalendar = function(options, open){

    options.defaultDate = calendarElement.fullCalendar('getDate');

    calendarElement.fullCalendar('destroy');
    calendarElement.fullCalendar(options);

    _calendarResizeHandler();

    //fullcalendar.addEventSource();
};


/**
 * @function _prepareMenuItems
 * @private
 */
var _prepareMenuItems = function(){

    var wrapper= document.createElement('div');
    var ssids = dataManager.getSSIDs();
    var totalItems = [];

    for(var i = 0; ssid = ssids[i]; i++){
        totalItems.push(templates.totalItem(ssid));
    }

    wrapper.innerHTML = templates.menuRight(totalItems.join(''), settings.weekend[0], settings.businessHours[0], settings.totals[0]);
    rightMenu = wrapper.firstChild;

    wrapper.innerHTML = templates.menuLeft(settings.currentMergeTime / 100000);
    leftMenu = wrapper.firstChild;

    rightMenu.querySelector('#menu-settings-weekend').addEventListener('click', _settingsWeekendClickHandler);
    rightMenu.querySelector('#menu-view').addEventListener('click', _settingsViewClickHandler);
    rightMenu.querySelector('#menu-settings-businesshours').addEventListener('click', _businessHoursClickHandler);
    rightMenu.querySelector('#menu-settings-totals').addEventListener('click', _totalsClickHandler);
    rightMenu.querySelector('#menu-filter').addEventListener('click', _filterClickHandler);
    leftMenu.querySelector('#mergetime').addEventListener("change", _mergeTimeChangeHandler);

    var radioButtons = rightMenu.querySelectorAll('#ssid-list .mdl-radio__button');

    for(var i = 0; radioButton = radioButtons[i]; i++){

        radioButton.addEventListener('click', _SSIDClickHandler);
    }
};


/**
 * @function _addMenuItemsToCalendar
 * @private
 */
var _addMenuItemsToCalendar = function(){

    if(!rightMenu || !leftMenu){

        _prepareMenuItems();

        calendarElement.find('.fc-left').append(leftMenu);
        calendarElement.find('.fc-right').append(rightMenu);

        window.componentHandler.upgradeDom();
    }else{

        calendarElement.find('.fc-left').append(leftMenu);
        calendarElement.find('.fc-right').append(rightMenu);
    }

    leftMenu.querySelector('#mergetime').value = settings.currentMergeTime / 100000;
    rightMenu.querySelector('#menu-settings-weekend').textContent = settings.weekend[options.weekends | 0];
    rightMenu.querySelector('#menu-settings-businesshours').textContent = settings.businessHours[(options.minTime) ? 0 : 1];
    rightMenu.querySelector('#menu-settings-totals').textContent = settings.totals[settings.showTotals | 0];
};


/**
 * @function _calendarResizeHandler
 * @private
 */
var _calendarResizeHandler = function(view){

    calendarElement.fullCalendar('option', 'contentHeight', window.innerHeight - 108);
};


/**
 * @function _calendarEventClickHandler
 * @private
 */
var _calendarEventClickHandler = function(calEvent, jsEvent, view) {

    console.log(calEvent.data);
};


/**
 * @function _calendarEventsHandler
 * @private
 */
var _calendarEventsHandler = function(start, end, timezone, callback) {

    dataManager.getLog(function(collection){

        callback(collection);

        if(settings.showTotals){

            var calendarView = calendarElement.fullCalendar('getView');

            if(calendarView.type === settings.view[0]){

                var totals = dataManager.getTotals(calendarView, options.minTime, options.maxTime, settings.currentSSID);

                for (var i = 0, l = settings.days.length; i < l; i++){

                    if(weekElement = document.querySelector('.fc-day-header.fc-' + settings.days[i])){

                        if(totals[i]){

                            weekElement.classList.add('total');
                            weekElement.setAttribute('data-total', helpers.milliSecondsToTimeString(totals[i]));
                        }else{

                            weekElement.classList.remove('total');
                        }
                    }
                }
            }
        }

        _addMenuItemsToCalendar();
    });
}


/**
 * Calendar views click handler
 */
var _settingsViewClickHandler = function(e){

    e.preventDefault();

    var toggle = (calendarElement.fullCalendar('getView').type === settings.view[0]);
    var newView = settings.view[toggle | 0];

    options.defaultView = newView;

    calendarElement.fullCalendar('changeView', newView);

    refreshCalendarEvents();

    this.querySelector('.material-icons').textContent = toggle ? 'view_week' : 'apps';
};


/**
 * set event handlers for script
 */
 var _businessHoursClickHandler = function(e){

    e.preventDefault();

    var toggle = (options.minTime) ? 1 : 0;

    if(toggle){

        delete options.minTime;
        delete options.maxTime;
    }else{

        options.minTime = settings.minTime;
        options.maxTime = settings.maxTime;
    }

    setTimeout(function(){ renderCalendar(options); }, 200);
 };


/**
 * Calendar weekends click Handler
 */
var _settingsWeekendClickHandler = function(e){

    e.preventDefault();

    var toggle = (this.textContent === settings.weekend[0]);

    options.weekends = toggle;

    setTimeout(function(){ renderCalendar(options); }, 200);
};


/**
 * @function _totalsClickHandler
 * @private
 */
var _totalsClickHandler = function(e){

    e.preventDefault();

    var toggle = (this.textContent === settings.totals[0]);

    settings.showTotals = toggle;

    setTimeout(function(){ renderCalendar(options); }, 200);
};


/**
 * @function _filterClickHandler
 * @private
 */
var _filterClickHandler = function(e){

    e.preventDefault();

    settings.filter = !settings.filter;

    refreshCalendarEvents();
};


/**
 * @function _SSIDClickHandler
 * @private
 */
var _SSIDClickHandler = function(e){

    e.preventDefault();

    settings.currentSSID = this.value;

    settings.showTotals = 1;

    refreshCalendarEvents();
};



/**
 * @function _
 */
var _mergeTimeChangeHandler = function(e){

    settings.currentMergeTime = parseInt(this.value) * 100000;

    dataManager.setOptions('mergeTime', settings.currentMergeTime);

    refreshCalendarEvents();
};

/**
 * @function refreshCalendarEvents
 * @public
 */
var refreshCalendarEvents = function(timeout){

    calendarElement.fullCalendar('refetchEvents');
};



var createTimeSlot = function(event) {
    var startDateTime = event.start.timestamp;
    var endDateTime = event.end.timestamp;

    // console.log(endDateTime, startDateTime);
    // console.log(endDateTime - startDateTime);
    // console.log(helpers.milliSecondsToTimeString(endDateTime - startDateTime));

    var timeslot = {
        title: helpers.milliSecondsToTimeString(endDateTime - startDateTime),
        start: startDateTime.toJSON(),
        end: endDateTime.toJSON(),
        data: event.data
    };

    return timeslot;
};


/**
 * @function init
 * @public
 */
var init = function(){

    var dataCollector = new DataCollector();

    dataCollector.on('timeslot', function (event) {
        //  fullcalendar.addEventSource
        //  asynchronous events
        console.log('timeslot received');

        calendarElement.fullCalendar('addEventSource', [createTimeSlot(event)]);
    });

    dataCollector.on('complete', function (events) {
        //  fullcalendar
        console.log('complete received');
        //  synchronous events
        if(events) {
          //  options.events = events.map(createTimeSlot);
        }

        //renderCalendar(options);
    });

    calendarElement = $("#calendar");
    settings = config.settings;

    renderCalendar(options);

    // dataManager.getLog(function(e) {
    //     console.log('got log ');
    //     console.log(e);
    // });
};


var options = config.settings.calendar;
    options.eventClick = _calendarEventClickHandler;
    //options.events = _calendarEventsHandler;
    options.windowResize = _calendarResizeHandler;


exports.init = init;
exports.refresh = refreshCalendarEvents;
