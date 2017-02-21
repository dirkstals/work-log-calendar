var util = require('util');
var EventEmitter = require('events').EventEmitter;

var EVENTTYPES = {
    OFF: 0,
    ON: 1,
    SET: 2
};

function EventObservable() {
    EventEmitter.call(this);
    this.timeslot = {};
    this.queue = [];
}

var createTimeSlot = function() {
    var startDateTime = matchToDate(queue.start)
    var endDateTime = matchToDate(queue.end);

    var timeslot = {
        title: helpers.milliSecondsToTimeString(endDateTime - startDateTime)
        start: {
            datetime: startDateTime.toJSON(),
            description: options.events[queue.start[7]].description
        }
        end: {
            datetime: endDateTime.toJSON(),
            description: options.events[queue.end[7]].description
        }
        data: queue.data
    };

    return timeslot;
};

EventObservable.prototype.add = function (event) {

    var p = {}; // possibilities

    p.ON   = event.type === EVENTTYPES.ON;
    p.OFF  = event.type === EVENTTYPES.OFF;
    p.ELSE = !(p.ON || p.OFF);
    p.START   = timeslot.start;
    p.END     = timeslot.end;
    p.BETWEEN = timeslot.between && timeslot.between.length > 0;
    p.EMPTY   = !(p.START || p.BETWEEN || p.END);
    p.STARTBETWEEN    = p.START && p.BETWEEN;
    p.STARTEND        = p.START && p.END;
    p.STARTBETWEENEND = p.START && p.BETWEEN && p.END;
    p.FULL            = p.STARTBETWEENEND || p.STARTEND;
    p.OPEN            = p.STARTBETWEEN || p.START;

    if(p.ON) {
        if(p.FULL || p.EMPTY) {
            if(p.FULL) {
                this.queue.push(timeslot);
                this.emit('add', timeslot);
            }
            timeslot = {start: event};
        } else {
            // make new array if there is none
            if (!p.BETWEEN) { timeslot.between = []; }
            timeslot.between.push(event);
        }
    } else if(p.OFF) {
        if(p.FULL) {
            // previous end = between
            if (!p.BETWEEN) { timeslot.between = [];}
            timeslot.between = timeslot.end;
            timeslot.end = event;
        } else if(p.OPEN) {
            // end
            timeslot.end = event;
        } else if(p.EMPTY) {
            // remove
        }
    } else if(p.ELSE) {
        if(p.OPEN) {
            // between
            if (!p.BETWEEN) { timeslot.between = []; }
            timeslot.between.push(event);
        } else {
            // remove
        }
    }
};

EventObservable.prototype.complete = function () {
    this.emit('complete', this.events);
    this.events = [];
};

util.inherits(EventObservable, EventEmitter);
