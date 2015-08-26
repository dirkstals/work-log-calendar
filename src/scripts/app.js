$ = require('jquery');

global.document = window.document;
global.jQuery = window.$;

require('bootstrap');
require('moment');
require('fullcalendar');
require('./scripts/window');

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
        minTime : '06:00:00',
        maxTime : '20:00:00'
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
        contentHeight: '100%',
        slotDuration : '00:30:00',
        minTime : settings.minTime,
        maxTime : settings.maxTime,
        timezone: 'local',
        timeFormat: 'H(:mm)',
        titleFormat: 'D MMMM YYYY',
        columnFormat: 'ddd D',
        defaultView: settings.view[0],
        eventColor: '#4caf50',
        eventClick: function(calEvent, jsEvent, view) {

            alert(calEvent.title);
        },
        events: function(start, end, timezone, callback) {

            script.getLog(callback);
        }
    };


    //Create and add Action button with dropdown in Calendar header. 
    var rightMenu = $([
        '<ul class="actions actions-alt" id="fc-actions">',
            '<li id="viewaction"></li>',
            '<li class="dropdown">',
                '<a data-toggle="dropdown" href="#" title="Set merge time"><i class="md md-vertical-align-center"></i></a>',
                '<ul class="dropdown-menu dropdown-menu-right" id="mergetime">',
                    '<li>',
                        '<a data-time="' + (0) + '" href="">off</a>',
                    '</li>',
                    '<li>',
                        '<a data-time="' + (5 * 60 * 1000) + '" href="">5 minutes</a>',
                    '</li>',
                    '<li>',
                        '<a data-time="' + (15 * 60 * 1000) + '" href="">15 minutes</a>',
                    '</li>',
                    '<li>',
                        '<a data-time="' + (30 * 60 * 1000) + '" href="">30 minutes</a>',
                    '</li>',
                    '<li class="active">',
                        '<a data-time="' + (1 * 60 * 60 * 1000) + '" href="">1 hour</a>',
                    '</li>',
                    '<li>',
                        '<a data-time="' + (1.5 * 60 * 60 * 1000) + '" href="">1.5 hour</a>',
                    '</li>',
                    '<li>',
                        '<a data-time="' + (2 * 60 * 60 * 1000) + '" href="">2 hours</a>',
                    '</li>',
                '</ul>',
            '</li>',
            '<li class="dropdown">',
                '<a data-toggle="dropdown" href="#" title="Settings"><i class="md md-settings"></i></a>',
                '<ul class="dropdown-menu dropdown-menu-right">',
                    '<li id="weekendaction"></li>',
                    '<li id="businesshours"></li>',
                '</ul>',
            '</li>',
        '</ul>'
    ].join(''));

    var settingsWeekend = $('<a href="#">' + settings.weekend[0] + '</a>');
    var businessHours = $('<a href="#">' + settings.businessHours[0] + '</a>');
    var settingsView = $('<a href="#" title="Change Calendar view"><i class="md md-apps"></i></a>');
    var mergetime = rightMenu.find('#mergetime li a');

    rightMenu.find('#viewaction').append(settingsView);
    rightMenu.find('#weekendaction').append(settingsWeekend);
    rightMenu.find('#businesshours').append(businessHours);

    
    /**
     * Render the Calendar
     */
    var renderCalendar = function(options, open){

        options.defaultDate = calendarElement.fullCalendar('getDate');

        calendarElement.fullCalendar('destroy');
        calendarElement.fullCalendar(options);

        var toolbar = calendarElement.find('.fc-toolbar');
            toolbar.append(rightMenu);

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

        settingsWeekend.on('click', settingsWeekendClickHandler);
        settingsView.on('click', settingsViewClickHandler);
        mergetime.on('click', mergeTimeClickHandler);
        businessHours.on('click', businessHoursClickHandler);
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
     * set event handlers for pmset script
     */
     var mergeTimeClickHandler = function(e){

        e.preventDefault();

        $('#mergetime li').removeClass('active');
        $(this).parent().addClass('active');
        
        script.setOptions('mergeTime', parseInt($(this).attr('data-time')));

        renderCalendar(options);
     };


    /**
     * set event handlers for pmset script
     */
     var businessHoursClickHandler = function(e){

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
    var settingsViewClickHandler = function(e){

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
    var settingsWeekendClickHandler = function(e){

        e.preventDefault();

        var toggle = ($(this).text() === settings.weekend[0]);
        var newWeekend = settings.weekend[toggle | 0];

        options.weekends = toggle;
        $(this).text(newWeekend);
    
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

    renderCalendar(options);

    $('#closeapp').on('click', closeappClickHandler);
    $('[data-action="devtools"]').on('click', menuClickHandler);
};


/**
 * fire init function on document ready
 */
document.addEventListener('DOMContentLoaded', init);
