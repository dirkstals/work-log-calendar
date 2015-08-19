module.exports = (function(window, undefined){

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
        
        // Hide the window to give user the feeling of closing immediately
        this.hide();

        // After closing the new window, close the main window.
        this.setShowInTaskbar(false);
        this.close(true);
    };


    /**
     * Create a tray item
     */
    var tray = new gui.Tray({ title: 'Tray', icon: process._nw_app.manifest.window.icon });


    /**
     * Create a popup menu for the tray
     */
    var trayMenu = new gui.Menu();
    var trayMenuOpen = new gui.MenuItem({ label: 'Open' });
    var trayMenuClose = new gui.MenuItem({ label: 'Close' });


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
        
        nativeMenuBar.createMacBuiltin("Work Log Calendar", {hideEdit: true, hideWindow: true}); 
    }

    /**
     * Add the native menu and add a close listener to the main window
     */
    mainWindow.menu = nativeMenuBar;
    mainWindow.on('close', windowCloseHandler);
    mainWindow.focus();

})(window);
