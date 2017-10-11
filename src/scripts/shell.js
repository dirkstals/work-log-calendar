
'use strict';

const util = require('util');
const spawn = require('child_process').spawn;
const EventEmitter = require('events');
const moment = require('moment');

class Shell extends EventEmitter {

    constructor(options) {
        super();
        this.days = 0;
        this.allData = [];
    }

    getData(options) {
        if(options) {
            this.options = options;
            this.parameters = this.options.parameters.slice(0);
        }

        if(this.days === 1) {
            this.emit('currentday');
        }

        if(this.options.start && this.options.end && this.days < 7) {
            this.parameters.push(this.options.start[0]);
            this.parameters.push(moment().subtract(this.days, 'days').format(this.options.start[1]));
            this.parameters.push(this.options.end[0]);
            this.parameters.push(moment().subtract(this.days-1, 'days').format(this.options.end[1]));
        }

        let instance = spawn(this.options.command, this.parameters);
        instance.stdout.setEncoding('utf8');
        instance.stdout.on('data', this.shellOutHandler.bind(this));
        instance.stderr.on('data', this.shellErrorHandler.bind(this));

        if(this.options.start && this.options.end && this.days < 7) {
            this.days++;
            instance.on('close', this.getData.bind(this));
        } else {
            instance.on('close', this.shellCloseHandler.bind(this));
        }
    }

    shellCloseHandler (code) {
        if(!this.options.parseOnOut) {
            this.parseData(this.allData, this.options);

            this.emit('currentday');
        }
        this.days = 0;
        this.emit('close');
    }

    shellErrorHandler (data) {
        console.log('stderr: ' + data);
    }

    shellOutHandler (data) {
        if(this.options.parseOnOut) {
            this.parseData(data, this.options);
        } else {
            this.allData += data;
        }
    }

    parseData (data, options) {
        let m = null;

        while (m = options.pattern.exec(data)) {
            m[7] = m[7].replace('_', '');
            m[7] = m[7].replace('/', '');
            const type = options.events[m[7].trim()] ? options.events[m[7].trim()].type : null;
            const description = options.events[m[7].trim()] ? options.events[m[7].trim()].description : null;
            const parsedData = {
                timestamp: new Date(m[1] ? m[1] : new Date().getFullYear(), new Date(Date.parse("2000 " + m[2])).getMonth(), m[3], m[4], m[5], m[6]),
                type: type,
                description: description,
                data: m[8] ? m[8].substring(0, m[8].indexOf(' BSSID')) : m[9] ? m[9].replace(/^'|'$/g, '') : null
            };
            this.emit('output', parsedData);
        }
    }
}

module.exports = Shell;
