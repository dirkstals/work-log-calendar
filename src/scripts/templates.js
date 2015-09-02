var helpers = require('./helpers');

var Templates = (function(){


    /**
     * HTML templates
     */
    var templates = {
        menuRight: 
            [
                '<ul class="actions actions-alt" id="fc-actions">',
                    '<li id="viewaction"></li>',
                    '<li class="dropdown">',
                        '<a data-toggle="dropdown" href="#" title="Settings"><i class="md md-settings"></i></a>',
                        '<ul class="dropdown-menu dropdown-menu-right">',
                            '<li id="weekendaction"></li>',
                            '<li id="businesshours"></li>',
                            '<li id="totals"></li>',
                        '</ul>',
                    '</li>',
                '</ul>'
            ].join(''),
        menuLeft: 
            [
                '<div class="leftmenu" title="Set merge time">',
                    '<input type="text" class="span2 slider" value="">',
                '<div>'
            ].join(''),
        eventListItem: function()
            {
                return [    
                    '<div class="lv-item media">',
                        '<div class="checkbox pull-left">',
                            '<label>',
                                `<input type="checkbox" name="events" value="${arguments[0]}">`,
                                '<i class="input-helper"></i>',
                            '</label>',
                        '</div>',
                        '<div class="media-body">',
                            `<div class="lv-title">${arguments[0]}</div>`,
                            `<small class="lv-small">${arguments[1]}</small>`,
                        '</div>',
                    '</div>',
                ].join('');
            },
        eventList: function()
            {
                [
                    `<li class="dropdown ${arguments[0]}" dropdown id="eventmenu">`,
                        '<a data-toggle="dropdown" title="Filter events" dropdown-toggle href="#" aria-haspopup="true" aria-expanded="false">',
                            '<i class="md md-list"></i>',
                        '</a>',
                        '<div class="dropdown-menu dropdown-menu-lg pull-right">',
                            '<div class="listview">',
                                '<div class="lv-header">Events</div>',
                                '<form class="lv-body" id="eventform">',
                                    arguments[1],
                                '</form>',
                                '<div class="clearfix"></div>',
                            '</div>',
                        '</div>',
                    '</li>'
                ].join('')
            }
    };

    return templates;

})();

module.exports = Templates;