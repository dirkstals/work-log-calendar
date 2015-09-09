var helpers = require('./helpers');


/**
 * HTML templates
 */
var templates = {
    menuRight: function(){
        return [    
            '<div class="rightmenu">',
                '<button id="menu-view" class="mdl-button mdl-js-button mdl-button--icon">',
                    '<i class="material-icons md-18">apps</i>',
                '</button>',

                '<button id="menu-settings" class="mdl-button mdl-js-button mdl-button--icon">',
                    '<i class="material-icons md-18">settings</i>',
                '</button>',
                
                '<ul class="mdl-menu mdl-menu--bottom-right mdl-js-menu mdl-js-ripple-effect" for="menu-settings">',
                    `<li class="mdl-menu__item" id="menu-settings-weekend">${arguments[0]}</li>`,
                    `<li class="mdl-menu__item" id="menu-settings-businesshours">${arguments[1]}</li>`,
                    `<li class="mdl-menu__item" id="menu-settings-totals">${arguments[2]}</li>`,
                '</ul>',
            '</div>'
        ].join('');
    },
    menuLeft: function(){
        return [    
            '<div class="leftmenu">',
                '<p style="width:220px;">',
                    `<input id="mergetime" class="mdl-slider mdl-js-slider" type="range" min="0" max="72" value="${arguments[0]}" step="3" tabindex="0"/>`,
                '</p>',
                '<div class="mdl-tooltip" for="mergetime">',
                    'Set merge time',
                '</div>',
            '<div>'
        ].join('');
    }
};

module.exports = templates;
