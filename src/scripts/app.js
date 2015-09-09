var $ = require('jquery');

global.document = window.document;
global.jQuery = window.$;


var gui = require('nw.gui');
var notification = require('./scripts/notification');
var menu = require('./scripts/menu');
var calendar = require('./scripts/calendar');


/**
 * @function init
 */
var init = function(){

    /**
     * set event handlers
     */
    $('#closeapp').on('click', menu.close);
    $('[data-action="devtools"]').on('click', menu.devtools);


    calendar.init();


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
