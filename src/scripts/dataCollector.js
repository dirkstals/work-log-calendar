
'use strict';

const EventEmitter = require('events');
const Shell = require('./shell');
const config = require('./config');
const EVENTTYPES = {
    OFF: 'off',
    ON: 'on',
    SET: 'set'
};

class DataCollector extends EventEmitter {

    constructor() {
        super();

        this.timeslot = {};
        this.queue = [];
        this.shell = new Shell();

        this.shell.on('output', this.shellOutputHandler.bind(this));
        this.shell.on('close', this.shellCloseHandler.bind(this));
        this.shell.on('currentday', this.currentDayHandler.bind(this));

        this.shell.getData(config.settings.log);

        this.shell2 = new Shell();

        this.shell2.on('output', this.shellOutputHandler.bind(this));
        this.shell2.on('close', this.shellCloseHandler.bind(this));
        this.shell2.on('currentday', this.currentDayHandler.bind(this));

        this.shell2.getData(config.settings.logMore);

    }

    currentDayHandler() {
        if(this.timeslot !== this.queue[this.queue.length - 1]) {
            if(!this.timeslot.end && this.timeslot.start) {
                this.timeslot.end = {
                    timestamp: new Date(),
                    type: 'now',
                    description: 'end timeslot added',
                    data: null
                };
            }
            this.emit('timeslot', this.timeslot);
            this.queue.push(this.timeslot);
            this.timeslot = {};
        }
    }

    shellOutputHandler(event) {
        var p = {}; // possibilities

        p.ON   = event.type === EVENTTYPES.ON;
        p.OFF  = event.type === EVENTTYPES.OFF;
        p.ELSE = !(p.ON || p.OFF);
        p.START   = this.timeslot.start;
        p.END     = this.timeslot.end;
        p.BETWEEN = this.timeslot.between && this.timeslot.between.length > 0;
        p.EMPTY   = !(p.START || p.BETWEEN || p.END);
        p.STARTBETWEEN    = p.START && p.BETWEEN;
        p.STARTEND        = p.START && p.END;
        p.STARTBETWEENEND = p.START && p.BETWEEN && p.END;
        p.FULL            = p.STARTBETWEENEND || p.STARTEND;
        p.OPEN            = p.STARTBETWEEN || p.START;

        if(p.ON) {
            if(p.FULL || p.EMPTY) {
                if(p.FULL && this.timeslot.start.timestamp.getTime() !== this.timeslot.end.timestamp.getTime()) {
                    this.queue.push(this.timeslot);
                    this.emit('timeslot', this.timeslot);
                }
                this.timeslot = {start: event};
            } else {
                // make new array if there is none
                if (!p.BETWEEN) { this.timeslot.between = []; }
                this.timeslot.between.push(event);
            }
        } else if(p.OFF) {
            if(p.FULL) {
                // previous end = between
                if (!p.BETWEEN) { this.timeslot.between = [];}
                this.timeslot.between.push(this.timeslot.end);
                this.timeslot.end = event;
            } else if(p.OPEN) {
                // end
                this.timeslot.end = event;
            } else if(p.EMPTY) {
                // remove
            }
        } else if(p.ELSE) {
            if(p.OPEN) {
                // between
                if (!p.BETWEEN) { this.timeslot.between = []; }
                this.timeslot.between.push(event);
            } else {
                // remove
            }
        }
    }

    shellCloseHandler () {
        this.emit('complete');
    }

    collectNewData () {
        this.shell.getData(config.settings.log);
        this.shell2.getData(config.settings.logMore);
    }
}

module.exports = DataCollector;
