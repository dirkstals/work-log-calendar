
var notification = require('./scripts/notification'),
    menu = require('./scripts/menu'),
    calendar = require('./scripts/calendar');


/**
 * @function init
 */
var init = function(){

    document.querySelector('#closeapp').addEventListener('click', menu.close);
    //document.querySelector('[data-action="devtools"]').addEventListener('click', menu.devtools);

    calendar.init();
    notification.heartbeat();
};


menu.createMenu();
menu.createTrayMenu();


/**
 * fire init function on document ready
 */
document.addEventListener('DOMContentLoaded', init);
