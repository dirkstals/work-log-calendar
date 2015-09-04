$ = require('jquery');

global.document = window.document;
global.jQuery = window.$;

require('bootstrap');
require('moment');
require('fullcalendar');
require('./scripts/bootstrap-slider');
require('./scripts/calendar');

var gui = require('nw.gui');
var notification = require('./scripts/notification');
var menu = require('./scripts/menu');


/**
 * @function init
 */
var init = function(){

    /**
     * set event handlers
     */
    $('#closeapp').on('click', menu.close);
    $('[data-action="devtools"]').on('click', menu.devtools);


    /**
     * start the notification heartbeat
     */
    notification.heartbeat();
};


menu.createMenu();
menu.createTrayMenu();


/**
 * fire init function on document ready
 */
document.addEventListener('DOMContentLoaded', init);
