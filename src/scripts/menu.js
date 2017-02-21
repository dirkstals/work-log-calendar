var gui = window.require('nw.gui');
var windows = process.platform === 'win32';
var mainWindow = gui.Window.get();
var calendar = require('./calendar');


/**
 * @function quit
 */
var quit = function(){

    mainWindow.close(true);
};


/**
 * @function close
 */
var close = function(){

    mainWindow.hide();
    mainWindow.setShowInTaskbar(false);
};


/**
 * @function open
 */
var open = function(){

    calendar.refresh();

    mainWindow.show();
    mainWindow.focus();
    mainWindow.setShowInTaskbar(true);
};


/**
 * @function devtools
 * @public
 * devtools click handler
 */
var devtools = function(e){

    e.preventDefault();

    mainWindow.showDevTools();
};


/**
 * @function createTrayMenu
 * @public
 */
var createTrayMenu = function(){

    /**
     * Create a tray item
     */
    var tray = new gui.Tray({
        'icon':  windows ? 'src/images/icon@2x.png' : 'src/images/icon.tiff',
        'tooltip': 'Work Log Calendar'
    });


    /**
     * Create a popup menu for the tray
     */
    var trayMenu = new gui.Menu();
    var trayMenuOpen = new gui.MenuItem({ label: 'Open' });
    var trayMenuClose = new gui.MenuItem({ label: 'Quit WorkLogCalendar'});


    /**
     * Append the menu-items to the popupmenu
     */
    trayMenu.append(trayMenuOpen);
    trayMenu.append(trayMenuClose);


    /**
     * Append the popupmenu to the tray
     */
    tray.menu = trayMenu;
    tray.on('click', open);


    /**
     * Add Traymenu click handlers
     */
    trayMenuOpen.click = open;
    trayMenuClose.click = quit;
};


/**
 * @function createMenu
 * @public
 * Creates a Menu so that shortcuts will work on mac
 */
var createMenu = function(){

    if(!windows){

        var nativeMenuBar = new gui.Menu({ type: "menubar" });

        var menuItems = new gui.Menu();
            menuItems.append(new gui.MenuItem({ label: 'Close', click: close, key : 'w'}));

        nativeMenuBar.createMacBuiltin("Work Log Calendar", {hideEdit: true, hideWindow: true});
        nativeMenuBar.append(new gui.MenuItem({label: 'File', submenu: menuItems}));

        mainWindow.menu = nativeMenuBar;
    }
};


/**
 * Add a close listener to the main window
 * focus the main window
 */
mainWindow.on('close', quit);
mainWindow.focus();

/**
 * make sure the running app opens, instead of opening a new app.
 */
gui.App.on('reopen', open);


exports.createMenu = createMenu;
exports.createTrayMenu = createTrayMenu;
exports.devtools = devtools;
exports.close = close;
exports.open = open;
