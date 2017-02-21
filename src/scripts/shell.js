var spawn = require('child_process').spawn;
var EventObservable = require('EventObservable');

var shell,
    observable,
    options;

/**
 * @function getEvents
 * @public
 */
var getEvents = function(ops, callback){

    options = opts;
    observable = new EventObservable();

    /**
     * execute the script
     * set event handlers for the script
     */
    shell = spawn(options.command, options.parameters);
    shell.stdout.setEncoding('utf8');
    shell.stdout.on('data', _shellOutHandler);
    shell.stderr.on('data', _shellErrorHandler);
    shell.on('close', _shellCloseHandler);
};

var _shellCloseHandler = function (code) {
    observable.complete();
};

var _shellErrorHandler = function (data) {
    console.log('stderr: ' + data);
};

var _shellOutHandler = function (data) {
    var m = options.pattern.exec(data);

    observable.add({
        timestamp: new Date(m[1] ? m[1] : new Date().getFullYear(), new Date(Date.parse("2000 " + m[2])).getMonth(), m[3], m[4], m[5], m[6]),
        type: options.events[m[7]].type,
        description: options.events[m[7]].description,
        data: m[8] ? m[8].substring(0, m[8].indexOf(' BSSID')) : m
    });
};

exports.getEvents = getEvents;
