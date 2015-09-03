
var Window = (function(window, undefined){

    var gui = window.require('nw.gui');
    var windows = process.platform === 'win32';
    var mainWindow = gui.Window.get();


    /**
     * @function trayMenuCloseClickHandler 
     * @private
     */
    var trayMenuCloseClickHandler = function(){

        mainWindow.close(true);
    }


    /**
     * @function trayMenuOpenClickHandler 
     * @private
     */
    var trayMenuOpenClickHandler = function(){
        
        mainWindow.show();
        mainWindow.focus();
        mainWindow.setShowInTaskbar(true);
    }


    /**
     * @function windowsCloseHandler 
     * @private
     */
    var windowCloseHandler = function(){
        
        mainWindow.hide();
        mainWindow.setShowInTaskbar(false);
    };


    /**
     * Create a tray item
     */
    var tray = new gui.Tray({ icon:  windows ? 'src/images/icon@2x.png' : 'src/images/icon.tiff' });


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


    /**
     * Add Traymenu click handlers
     */
    trayMenuOpen.click = trayMenuOpenClickHandler;
    trayMenuClose.click = trayMenuCloseClickHandler;


    /**
     * Create a Menu so that shortcuts will work on mac
     */
    var nativeMenuBar = new gui.Menu({ type: "menubar" });

    if(!windows){ 

        var menuItems = new gui.Menu();
            menuItems.append(new gui.MenuItem({ label: 'Close', click: windowCloseHandler, key : 'w'}));
        
        nativeMenuBar.createMacBuiltin("Work Log Calendar", {hideEdit: true, hideWindow: true}); 
        nativeMenuBar.append(new gui.MenuItem({label: 'File', submenu: menuItems}));
    }

    /**
     * Add the native menu and add a close listener to the main window
     */
    mainWindow.menu = nativeMenuBar;
    mainWindow.on('close', windowCloseHandler);
    mainWindow.focus();

})(window);

module.exports = Window;