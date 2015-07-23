$ = require('jquery');

global.document = window.document;
global.jQuery = window.$;

require('bootstrap');
require('moment');
require('fullcalendar');

var windows = process.platform === 'win32';

var gui = require('nw.gui');
var script = windows ? require('./scripts/wevtutil') : require('./scripts/pmset');


/** start the initialization process */
$(document).ready(function(){

    var calendarElement = $("#calendar");

    var settings = {
        weekend : ['Show Weekends', 'Hide Weekends'],
        view : ['agendaWeek', 'month'],
        businessHours : ['Day hours', 'Business hours'],
        minTime : '06:00:00',
        maxTime : '20:00:00',
        slotDuration : '00:30:00'
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
        slotDuration : settings.slotDuration,
        minTime : settings.minTime,
        maxTime : settings.maxTime,
        timezone: 'local',
        timeFormat: 'H(:mm)',
        titleFormat: 'D MMMM YYYY',
        columnFormat: 'ddd D',
        defaultView: settings.view[0],
        eventClick: function(calEvent, jsEvent, view) {

            alert(calEvent.title);
        },
        events: function(start, end, timezone, callback) {

            script.getLog(callback);
        }
    };

    //Create and ddd Action button with dropdown in Calendar header. 
    var rightMenu = $([
        '<ul class="actions actions-alt" id="fc-actions">',
            '<li class="dropdown">',
                '<a data-toggle="dropdown" href="#"><i class="md md-settings"></i></a>',
                '<ul class="dropdown-menu dropdown-menu-right">',
                    '<li id="weekendaction"></li>',
                    '<li id="businesshours"></li>',
                '</ul>',
            '</li>',
            '<li id="viewaction"></li>',
        '</ul>'
    ].join(''));

    var leftMenu = $([
        '<ul class="actions actions-alt" id="fc-menu">',
            '<li class="dropdown">',
                '<a data-toggle="dropdown" href="#"><i class="md md-more-vert"></i></a>',
                '<ul class="dropdown-menu dropdown-menu-left" id="mergetime">',
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
        '</ul>'
    ].join(''));

    var settingsWeekend = $('<a href="#">' + settings.weekend[0] + '</a>');
    var businessHours = $('<a href="#">' + settings.businessHours[0] + '</a>')
    var settingsView = $('<a href="#" title="Change Calendar view"><i class="md md-apps"></i></a>');
    var mergetime = leftMenu.find('#mergetime li a');

    rightMenu.find('#viewaction').append(settingsView);
    rightMenu.find('#weekendaction').append(settingsWeekend);
    rightMenu.find('#businesshours').append(businessHours);

    
    /**
     * Render the Calendar
     */
    var renderCalendar = function(options){

        options.defaultDate = calendarElement.fullCalendar('getDate');

        calendarElement.fullCalendar('destroy');
        calendarElement.fullCalendar(options);

        var toolbar = calendarElement.find('.fc-toolbar');
            toolbar.find('.fc-right').append(rightMenu);
            toolbar.find('.fc-left').append(leftMenu);

        settingsWeekend.on('click', settingsWeekendClickHandler);
        settingsView.on('click', settingsViewClickHandler);
        mergetime.on('click', mergeTimeClickHandler);
        businessHours.on('click', businessHoursClickHandler);
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

        if(toggle){

            delete options.minTime;
            delete options.maxTime;
        }else{

            options.minTime = settings.minTime;
            options.maxTime = settings.maxTime;
        }

        $(this).text(settings.businessHours[toggle]);

        renderCalendar(options);
     };

    /** 
     * Calendar views click handler
     */
    var settingsViewClickHandler = function(e){

        e.preventDefault();

        var toggle = (calendarElement.fullCalendar('getView').type === settings.view[0]);

        options.defaultView = settings.view[toggle | 0];

        calendarElement.fullCalendar('changeView', settings.view[toggle | 0]); 
        $(this).find('.md').toggleClass('md-apps', !toggle).toggleClass('md-view-week', toggle); 
    };


    /** 
     * Calendar weekends click Handler
     */
    var settingsWeekendClickHandler = function(e){

        e.preventDefault();

        var toggle = ($(this).text() === settings.weekend[0]);

        options.weekends = toggle;
        $(this).text(settings.weekend[toggle | 0]);
    
        renderCalendar(options);
    };

    renderCalendar(options);

});


var gui = require('nw.gui');
var win = gui.Window.get();
var nativeMenuBar = new gui.Menu({ type: "menubar" });

if(!windows){

    nativeMenuBar.createMacBuiltin("Timer", {
      hideEdit: true,
      hideWindow: true
    });

    win.menu = nativeMenuBar;
}

// Listen to main window's close event
win.on('close', function() {


    // Hide the window to give user the feeling of closing immediately
    this.hide();

    // After closing the new window, close the main window.
    this.close(true);
});