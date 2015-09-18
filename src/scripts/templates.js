var helpers = require('./helpers');


/**
 * HTML templates
 */
var templates = {
    menuRight: function(){
        return [    
            '<div class="rightmenu">',

                '<button id="menu-totals" class="mdl-button mdl-js-button mdl-button--icon">',
                    '<i class="material-icons md-18">info_outline</i>',
                '</button>',
                
                '<ul class="mdl-menu mdl-menu--bottom-right mdl-js-menu mdl-js-ripple-effect" for="menu-totals" id="ssid-list">',
                    `${arguments[0]}`,
                '</ul>',

                '<button id="menu-filter" class="mdl-button mdl-js-button mdl-button--icon">',
                    '<i class="material-icons md-18">filter_list</i>',
                '</button>',

                '<button id="menu-view" class="mdl-button mdl-js-button mdl-button--icon">',
                    '<i class="material-icons md-18">apps</i>',
                '</button>',

                '<button id="menu-settings" class="mdl-button mdl-js-button mdl-button--icon">',
                    '<i class="material-icons md-18">settings</i>',
                '</button>',
                
                '<ul class="mdl-menu mdl-menu--bottom-right mdl-js-menu mdl-js-ripple-effect" for="menu-settings">',
                    `<li class="mdl-menu__item" id="menu-settings-weekend">${arguments[1]}</li>`,
                    `<li class="mdl-menu__item" id="menu-settings-businesshours">${arguments[2]}</li>`,
                    `<li class="mdl-menu__item" id="menu-settings-totals">${arguments[3]}</li>`,
                '</ul>',

            '</div>'
        ].join('');
    },
    menuLeft: function(){
        return [    
            '<div class="leftmenu">',

                '<p style="width:220px;">',
                    `<input id="mergetime" class="mdl-slider mdl-js-slider" type="range" min="0" max="72" value="${arguments[0]}" step="3" />`,
                '</p>',

                '<div class="mdl-tooltip" for="mergetime">',
                    'Set merge time',
                '</div>',

            '<div>'
        ].join('');
    },
    totalItem: function(){
        return [
            '<li class="mdl-menu__item">',
                `<label class="mdl-radio mdl-js-radio mdl-js-ripple-effect" for="option-${arguments[0]}">`,
                    `<input type="radio" id="option-${arguments[0]}" class="mdl-radio__button" name="ssids" value="${arguments[0]}" />`,
                    `<span class="mdl-radio__label">${arguments[0]}</span>`,
                '</label>',
            '</li>'
        ].join('');
    }
};

module.exports = templates;
