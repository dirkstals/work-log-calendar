$ = require('jquery');

global.document = window.document;
global.jQuery = window.$;

require('bootstrap');
require('moment');
require('fullcalendar');
require('./scripts/window');
require('./scripts/bootstrap-slider');

var windows = process.platform === 'win32';
var gui = require('nw.gui');
var script = windows ? require('./scripts/wevtutil') : require('./scripts/pmset');


/**
 * @function init
 */
var init = function(){

    var mainWindow = gui.Window.get();
    var calendarElement = $("#calendar");

    var settings = {
        weekend : ['Show Weekends', 'Hide Weekends'],
        view : ['agendaWeek', 'month'],
        businessHours : ['Day hours', 'Business hours'],
        totals : ['Show totals', 'Hide totals'],
        showTotals: 0,
        minTime : '06:00:00',
        maxTime : '20:00:00',
        currentMergeTime: 1 * 60 * 60 * 1000
    };


    //Create and add Action button with dropdown in Calendar header. 
    var rightMenu = $([
        '<ul class="actions actions-alt" id="fc-actions">',
            '<li id="viewaction"></li>',
            '<li class="dropdown">',
                '<a data-toggle="dropdown" href="#" title="Settings"><i class="md md-settings"></i></a>',
                '<ul class="dropdown-menu dropdown-menu-right">',
                    '<li id="weekendaction"></li>',
                    '<li id="businesshours"></li>',
                    '<li id="totals"></li>',
                '</ul>',
            '</li>',
        '</ul>'
    ].join(''));

    var leftMenu = [
        '<div class="leftmenu" title="Set merge time">',
            '<input type="text" class="span2 slider" value="">',
        '<div>'
    ].join('');

    var settingsWeekend = $('<a href="#">' + settings.weekend[0] + '</a>');
    var businessHours = $('<a href="#">' + settings.businessHours[0] + '</a>');
    var totals = $('<a href="#">' + settings.totals[0] + '</a>');
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

        /*
        if(windows){
            toolbar.find('#eventmenu').remove();
            toolbar.find('#fc-actions').prepend(_getEventMenu(open));

            var activeEvents = script.getActiveEvents();

            $('#eventform [name="events"]').each(function(){

                if(activeEvents.indexOf($(this).val()) >= 0 ){

                    $(this).prop('checked', true);
                }
            });

            $('#eventform [name="events"]').on('change', function(e){

                script.setActiveEvents(($('#eventform').serializeArray()).map(function(event){return event.value;}));

                renderCalendar(options, true);
            });
        }
        */

        settingsWeekend.on('click', _settingsWeekendClickHandler);
        settingsView.on('click', _settingsViewClickHandler);
        businessHours.on('click', _businessHoursClickHandler);
        totals.on('click', _totalsClickHandler);


        var sliderOptions = {
            'min': 0,
            'max': 2 * 60 * 60 * 1000,
            'step': 5 * 60 * 1000,
            'value': settings.currentMergeTime,
            'formater': _formatSlideValue
        };

        $('.slider').slider(sliderOptions)
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
                    var days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

                    for (var i = 0, l = days.length; i < l; i++){

                        if(totals[i]){

                            $('.fc-day-header.fc-' + days[i]).attr('data-total', totals[i]).addClass('total');
                        }else{

                            $('.fc-day-header.fc-' + days[i]).removeClass('total');
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
     * @function _formatSlideValue
     * @private
     */
    var _formatSlideValue =  function(value){

        var hours = Math.floor(value / ( 1 * 60 * 60 * 1000) % 24),
            minutes = Math.floor(value / ( 1 * 60 * 1000) % 60)

        return _formatDoubleDigit(hours) + ":" + _formatDoubleDigit(minutes);
    }

    /**
     * @function _getEventMenu
     * @private
     */
    var _getEventMenu = function(open){

        var events = script.getEvents();
        var eventList = [];

        for(var eventID in events){

            if (events.hasOwnProperty(eventID)) {

                eventList.push([    
                    '<div class="lv-item media">',
                        '<div class="checkbox pull-left">',
                            '<label>',
                                '<input type="checkbox" name="events" value="' + eventID + '">',
                                '<i class="input-helper"></i>',
                            '</label>',
                        '</div>',
                        '<div class="media-body">',
                            '<div class="lv-title">' + eventID + '</div>',
                            '<small class="lv-small">' + events[eventID] + '</small>',
                        '</div>',
                    '</div>',
                ].join(''));
            }
        }

        return $([
            '<li class="dropdown ' + (open ? 'open' : '') + '" dropdown id="eventmenu">',
                '<a data-toggle="dropdown" title="Filter events" dropdown-toggle href="#" aria-haspopup="true" aria-expanded="false">',
                    '<i class="md md-list"></i>',
                '</a>',
                '<div class="dropdown-menu dropdown-menu-lg pull-right">',
                    '<div class="listview">',
                        '<div class="lv-header">Events</div>',
                        '<form class="lv-body" id="eventform">',
                            eventList.join(''),
                        '</form>',
                        '<div class="clearfix"></div>',
                    '</div>',
                '</div>',
            '</li>'
        ].join(''));
    };


    /**
     * @function _formatDoubleDigit
     * @private
     */
    var _formatDoubleDigit = function(digit){

        return ('0' + digit).slice(-2);
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


    var options = {
        header: {
            right: '',
            center: 'prev, title, next',
            left: ''
        },
        theme: true, 
        firstDay : 1,
        weekends : false,
        allDaySlot : false,
        axisFormat : 'H:mm',
        contentHeight: 600,
        slotDuration : '00:30:00',
        minTime : settings.minTime,
        maxTime : settings.maxTime,
        timezone: 'local',
        timeFormat: 'H(:mm)',
        titleFormat: 'D MMMM YYYY',
        columnFormat: 'ddd D',
        defaultView: settings.view[0],
        eventColor: '#4caf50',
        eventClick: _calendarEventClickHandler,
        events: _calendarEventsHandler,
        windowResize: _calendarResizeHandler
    };

    renderCalendar(options);

    $('.slider').on('slideStop', _slideStopHandler);

    $('#closeapp').on('click', closeappClickHandler);
    $('[data-action="devtools"]').on('click', menuClickHandler);
};


/**
 * fire init function on document ready
 */
document.addEventListener('DOMContentLoaded', init);
