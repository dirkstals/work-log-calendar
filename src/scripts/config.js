var helpers = require('./helpers');
var path = require('path');


/**
 * General settings
 */
var settings = {
    windows: process.platform === 'win32',
    weekend: ['Show Weekends', 'Hide Weekends'],
    view: ['agendaWeek', 'month'],
    businessHours: ['Day hours', 'Business hours'],
    totals: ['Show totals', 'Hide totals'],
    days: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], 
    showTotals: 0,
    minTime: 6 * 60 * 60 * 1000,
    maxTime: 20 * 60 * 60 * 1000,
    currentMergeTime: 1 * 60 * 60 * 1000,
    mergeTime : 1 * 60 * 60 * 1000,
    cacheTime : 1 * 60 * 60 * 1000,
    alarm: 8 * 60 * 60 * 1000,
    currentSSID: 'none',
    filter: false,
    sliderOptions: {
        'min': 0,
        'max': 2 * 60 * 60 * 1000,
        'step': 5 * 60 * 1000,
        'formater': helpers.milliSecondsToTimeString
    },
    notification: {
        'title': 'Work Log Calendar',
        'wait': true,
        'sound': 'Glass',
        'icon': path.join(__dirname, '..', 'images', 'icon-192.png')
    },
    notificationHeartbeat: 1 * 60 * 1000,
    calendar: {
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
        timezone: 'local',
        timeFormat: 'H:mm',
        titleFormat: 'D MMMM YYYY',
        columnFormat: 'ddd D',
        eventColor: '#4caf50',
        themeButtonIcons: false,
        buttonText:{
            prev: 'arrow_back',
            next: 'arrow_forward'
        }
    },
    pmsetOptions: {
        pattern: /^(\d+)\-(\d+)\-(\d+)\s*(\d+)\:(\d+)\:(\d+)\s*[\+|\-]\d+\s.*(?:Display is turned|powerd process is|Lid|Clamshell)\s(\s*\w+)/gim,
        command: 'pmset',
        parameters: ['-g', 'log'],
        events: {
            'on': {
                'type': 'on',
                'description': 'display'
            },
            'off': {
                'type': 'off',
                'description': 'display'
            },
            'Sleep': {
                'type': 'off',
                'description': 'Clamshell sleep'
            },
            'Open': {
                'type': 'on',
                'description': 'Lid open'
            },
            'started': {
                'type': 'on',
                'description': 'processd'
            }
        }
    },
    syslogOptions: {
        pattern: /^(\d+)\-(\d+)\-(\d+)T(\d+)\:(\d+)\:(\d+)[\+|\-]\d+\s.*:\s(SHUTDOWN_TIME|SSID).('.*')?.*/gm,
        command: 'syslog',
        parameters: ['-T', 'ISO8601', '-k', 'Time', 'ge', '-14d'],
        events: {
            'SHUTDOWN_TIME': {
                'type': 'off',
                'description': 'syslog'
            },
            'SSID': {
                'type': 'set',
                'description': 'ssid'
            }
        }
    },
    wevtutilSecurityOptions: {
        command: 'wevtutil', 
        parameters: ['qe', 'Security', '/f:text', '/q:*[System[TimeCreated[timediff(@SystemTime)<=' + (14 * 24 * 60 * 60 * 1000) + ']]]'],
        events: {
            // Security
            '512': {
                'type': 'on',
                'description': '512 - Windows NT is starting up'
            },
            '513': {
                'type': 'off',
                'description': '513 - Windows is shutting down'
            }, 
            '528': {
                'type': 'on',
                'description': '528 - Successful Logon'
            }, 
            '538': {
                'type': 'off',
                'description': '538 - User Logoff'
            }, 
            '551': {
                'type': 'off',
                'description': '551 - User initiated logoff'
            }, 
            '1100': {
                'type': 'off',
                'description': '1100 - The event logging service has shut down'
            }, 
            '4608': {
                'type': 'on',
                'description': '4608 - Windows is starting up'
            },
            '4609': {
                'type': 'off',
                'description': '4609 - Windows is shutting down'
            },
            '4800': {
                'type': 'off',
                'description': 'The workstation was locked'
            },
            '4801': {
                'type': 'on',
                'description': '4801 - The workstation was unlocked'
            },
            '4802': {
                'type': 'off',
                'description': '4802 - screensaver on'
            },
            '4803': {
                'type': 'on',
                'description': '4803 - screensaver off'
            },
            '4624': {
                'type': 'on',
                'description': '4624 - An account was successfully logged on'
            },
            '4634': {
                'type': 'off',
                'description': '4634 - An account was logged off'
            },
            '4647': {
                'type': 'off',
                'description': '4647 - User initiated logoff'
            }
        }
    },
    wevtutilSystemOptions: {
        command: 'wevtutil', 
        parameters: ['qe', 'System', '/f:text', '/q:*[System[TimeCreated[timediff(@SystemTime)<=' + (14 * 24 * 60 * 60 * 1000) + ']]]'],
        events: {
            '12': {
                'type': 'on',
                'description': '12 - The operating system started at system time'
            },
            '13': {
                'type': 'off',
                'description': '13 - The operating system is shutting down at system time [Date][Timestamp]'
            },
            '109': {
                'type': 'off',
                'description': '109 - The kernel power manager has initiated a shutdown transition'
            },
            '1074': {
                'type': 'on',
                'description': '1074 - The process %process% has initiated the power off/restart of computer %computer% on behalf of user %user% for the following reason: Other (Unplanned)'
            },
            '6005': {
                'type': 'on',
                'description': '6005 - The Event log service was started.'
            },
            '6006': {
                'type': 'off',
                'description': '6006 - The Event log service was stopped.'
            },
            '6013': {
                'type': 'on',
                'description': '6013 - The system uptime is <number> seconds.'
            },
            '7001': {
                'type': 'on',
                'description': '7001 - User Logon Notification for Customer Experience Improvement Program '
            },
            '7002': {
                'type': 'off',
                'description': '7002 - User Logoff Notification for Customer Experience Improvement Program'
            }
        }
    }
};


/**
 * Settings based patterns
 */
settings.wevtutilSecurityOptions.pattern = new RegExp('(\\d{4})\\-(\\d{2})\\-(\\d{2})T(\\d{2})\\:(\\d{2})\\:(\\d{2}).\\d{3}\\s+.*:\\s+(' + Object.keys(settings.wevtutilSecurityOptions.events).join('|') + ')','gim');
settings.wevtutilSystemOptions.pattern = new RegExp('(\\d{4})\\-(\\d{2})\\-(\\d{2})T(\\d{2})\\:(\\d{2})\\:(\\d{2}).\\d{3}\\s+.*:\\s+(' + Object.keys(settings.wevtutilSystemOptions.events).join('|') + ')','gim');


/**
 * Settings based Calendar options
 */
settings.calendar.minTime = settings.minTime;
settings.calendar.maxTime = settings.maxTime;
settings.calendar.defaultView = settings.view[0];


/**
 * Messages
 */
var messages = {
    half: 'Whooaa we\'re halfway there!',
    minutes: function(){ return `Time to go after ${arguments[0]} minutes`;},
    end: 'GET TO THE CHOPPA!'
};

exports.messages = messages;
exports.settings = settings;
