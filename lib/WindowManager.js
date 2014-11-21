WM = function() {
    this.windows = [];
    this.focused_window = undefined;
}

WM.prototype.configure = function(settings) {
    if (Meteor.isServer) {
        if (!settings.hasOwnProperty('windows'))
            settings.windows = [];
        if (!settings.hasOwnProperty('tabs'))
            settings.tabs = [];
        if (!settings.hasOwnProperty('default_windows'))
            settings.default_windows = [];
        if (!settings.hasOwnProperty('default_tabs'))
            settings.default_tabs = [];
        
        _.each(settings.windows, function(win, index, list) {
            if (!win.hasOwnProperty('focused'))     win.focused = false;
            if (!win.hasOwnProperty('minimized'))   win.minimized = false;
            if (!win.hasOwnProperty('maximized'))   win.maximized = false;
            if (!win.hasOwnProperty('pane_tree'))   win.pane_tree = { id : win.id + '_pane' };
        });

        default_window_profile = WMCollection.findOne({'default' : 'profile'});
        if (typeof default_window_profile == 'undefined') {
            WMCollection.insert(_.extend({'default' : 'profile'}, settings));
        }
    }
}

WM.prototype.init = function(settings) {
    this.minimize = this.defaultMinimizeFunction;
    if (settings != undefined) {
        if (settings.hasOwnProperty('minimizeFunction'))
            if (typeof settings.minimizeFunction == 'function')
                this.minimize = settings.minimizeFunction;
    }
}

WM.prototype.getUserWindowProfile = function(user) {
    if (user == undefined)
        user = Meteor.user();
    if (user && WMCollectionSubscription.ready()) { // Check if the user is logged in and the collection ready
        return this.getOrCreateUserWindowProfile(user);
    } else {
        throw new WMException("User not logged in or WMCollection not fully transferred");
    }

    return undefined;
}

WM.prototype.getOrCreateUserWindowProfile = function(user) {
    var uwp = WMCollection.findOne({'username' : user.username});
    if (uwp == undefined) {
        return this.createUserWindowProfile(user);
    }
    return uwp;
}

WM.prototype.createUserWindowProfile = function(user) {
    var default_window_profile = WMCollection.findOne({'default' : 'profile'});
    delete default_window_profile._id;
    delete default_window_profile.default;
    WMCollection.insert(_.extend({'username' : user.username}, default_window_profile));

    return WMCollection.findOne({'username' : user.username});
}

WM.prototype.getWindows = function() {
    var uwp = this.getUserWindowProfile();
    return uwp.windows.filter(function(window) {
        if (uwp.default_windows.length == 0) // An empty default array means everything is default
            return true;
        return _.contains(uwp.default_windows, window.id); 
    });
}

WM.prototype.getTabs = function(pane_id, invert) {
    var uwp = this.getUserWindowProfile();
    var tabs;
    if (pane_id == undefined)
        tabs = uwp.tabs;
    else
        tabs = uwp.tabs.filter(function(tab) {
            if (uwp.default_tabs.length == 0) // An empty default array means everything is default
                return tab.pane_id == pane_id;
            if (invert)
                return (tab.pane_id != pane_id && _.contains(uwp.default_tabs, tab.id));
            else
                return (tab.pane_id == pane_id && _.contains(uwp.default_tabs, tab.id));
        });
    
    if (typeof tabs == 'object')
        tabs =  _.map(tabs, function(tab, key) {
            return tab;
        });

    return tabs;
}

WM.prototype.getWindowById = function(uwp, window_id) {
    return _.find(uwp.windows, function(window) {
        if (window.id == window_id)
            return window;
    });
}

WM.prototype.getWindowByIdWithIndex = function(uwp, window_id) {
    ret = {}
    ret.window = _.find(uwp.windows, function(window, index) {
        if (window.id == window_id) {
            ret.index = index;
            return window;
        }
    });
    return ret;
}

WM.prototype.updateWindow = function(new_window, old_window_id) {
    var uwp = this.getUserWindowProfile();
    if (old_window_id == undefined)
        var windowWithIndex = this.getWindowByIdWithIndex(uwp, new_window.id);
    else
        var windowWithIndex = this.getWindowByIdWithIndex(uwp, old_window_id);
    var update = {}
    var key = "windows." + windowWithIndex.index;
    update[key] = new_window;
    
    WMCollection.update(uwp._id, {
        $set : update
    });
}

WM.prototype.getTabById = function(uwp, tab_id) {
    return _.find(uwp.tabs, function(tab) {
        if (tab.id == tab_id)
            return tab;
    });
}

WM.prototype.getTabByIdWithIndex = function(uwp, tab_id) {
    ret = {};
    ret.tab = _.find(uwp.tabs, function (tab, index) {
        if (tab.id == tab_id) {
            ret.index = index; // set the index of the ret object
            return tab;
        }
    });
    return ret;
}

WM.prototype.getTabContent = function(tab_id) {
    var uwp = this.getUserWindowProfile();
    var tab = this.getTabById(uwp, tab_id);
    return Template[tab.template];
}

WM.prototype.updateTab = function(new_tab) {
    var uwp = this.getUserWindowProfile();
    var tabWithIndex = this.getTabByIdWithIndex(uwp, new_tab.id);
    var update = {}
    var key = "tabs." + tabWithIndex.index;
    update[key] = new_tab;

    WMCollection.update(uwp._id, {
        $set : update
    });
}

WM.prototype.setTabActive = function(tab_id) {
    var uwp = this.getUserWindowProfile();
    var new_active_tab = this.getTabById(uwp, tab_id);
    var self = this;
    _.each(this.getTabs(new_active_tab.pane_id), function(tab, index, tabs) {
        if (tab.id != new_active_tab.id && tab.active) {
            tab.active = false;
            self.updateTab(tab);
        }
    });
    
    new_active_tab.active = true;
    this.updateTab(new_active_tab);
}

WM.prototype.registerWindow = function(element, data) {
    var new_window = new WMWindow(element, this, data);
    this.windows.push(new_window);
    if (data.focused) this.focused_window = new_window;
}

WM.prototype.grabFocus = function(wm_window, ignore_old_window) {
    var self = this;

    if (this.focused_window == undefined || this.focused_window.id() != wm_window.id()) {
        var uwp = this.getUserWindowProfile();
        
        var new_focused_window = this.getWindowById(uwp, wm_window.id());
        new_focused_window.focused = true;

        if (ignore_old_window != true && this.focused_window != undefined) {
            var focused_window = this.getWindowById(uwp, this.focused_window.id());
            focused_window.focused = false;
            this.updateWindow(focused_window);
            new_focused_window.zIndex = focused_window.zIndex + 1;
        }

        if (new_focused_window.zIndex > 1000) {
            new_focused_window.zIndex = 10;
            $(this.windows).not(wm_window).each(function(index, arr_wm_window) {
                if (arr_wm_window != wm_window) {
                    var window_to_update = self.getWindowById(uwp, arr_wm_window.id());
                    window_to_update.zIndex = 9;
                    self.updateWindow(window_to_update);
                }
            });
        }

        this.updateWindow(new_focused_window);

        this.focused_window = _.find(this.windows, function(win, index, list) {
            if (win.id() == new_focused_window.id)
                return win;            
        });
    }
}

WM.prototype.setWindowPos = function(wm_window, pos, minimized, maximized) {
    var uwp = this.getUserWindowProfile();
    var win = this.getWindowById(uwp, wm_window.id());
    win.top = pos.top;
    if (typeof win.top == 'number') win.top += 'px';
    win.left = pos.left;
    if (typeof win.left == 'number') win.left += 'px';
    win.width = pos.width;
    if (typeof win.width == 'number') win.width += 'px';
    win.height = pos.height;
    if (typeof win.height == 'number') win.height += 'px';
    if (minimized != undefined) win.minimized = minimized;
    if (maximized != undefined) win.maximized = maximized;

    this.updateWindow(win);
}

WM.prototype.setPanePos = function(wm_window, parent_con_id, new_percentage) {
    var uwp = this.getUserWindowProfile();
    var win = this.getWindowById(uwp, wm_window.id());
    
    this.setPanePosHelper(win.pane_tree, parent_con_id, new_percentage);
    this.updateWindow(win);
}

WM.prototype.setPanePosHelper = function(pane_tree, id, new_percentage) {
    if (pane_tree.id == id) {
        pane_tree.panes.split_percent = new_percentage;
        return true;
    }
    
    if (pane_tree.panes == undefined) return false;
    if (this.setPanePosHelper(pane_tree.panes.pane1, id, new_percentage)) return true;
    if (this.setPanePosHelper(pane_tree.panes.pane2, id, new_percentage)) return true;
    
    return false;
}

WM.prototype.splitPaneVertically = function(wm_window, pane_id, percentage, moveTabsToSplit) {
    var uwp = this.getUserWindowProfile();
    var win = this.getWindowById(uwp, wm_window.id());
    
    this.splitPaneHelper(win.pane_tree, pane_id, percentage, 'vertical', moveTabsToSplit);
    this.updateWindow(win);
}

WM.prototype.splitPaneHorizontally = function(wm_window, pane_id, percentage, moveTabsToSplit) {
    var uwp = this.getUserWindowProfile();
    var win = this.getWindowById(uwp, wm_window.id());
    
    this.splitPaneHelper(win.pane_tree, pane_id, percentage, 'horizontal', moveTabsToSplit);
    this.updateWindow(win);
}

WM.prototype.splitPaneHelper = function(pane_tree, pane_id, percentage, orientation, moveTabsToSplit) {
    if (pane_tree.id == pane_id) {
        pane_tree.panes = {
            split_orientation : orientation,
            split_percent : percentage,
            pane1 : {
                id : pane_tree.id + '.1'
            },
            pane2 : {
                id : pane_tree.id + '.2'
            }
        }
        
        var self = this;
        _.each(this.getTabs(pane_id), function(tab, index, tabs) {
            if (moveTabsToSplit == true)
                tab.pane_id = pane_tree.id + '.2';
            else
                tab.pane_id = pane_tree.id + '.1';
            self.updateTab(tab);
        });

        return true;
    }

    if (pane_tree.panes == undefined) return false;
    if (this.splitPaneHelper(pane_tree.panes.pane1, pane_id, percentage, orientation, moveTabsToSplit)) return true;
    if (this.splitPaneHelper(pane_tree.panes.pane2, pane_id, percentage, orientation, moveTabsToSplit)) return true;
    
    return false;
}

WM.prototype.closePane = function(wm_window, pane_id) {
    var uwp = this.getUserWindowProfile();
    var win = this.getWindowById(uwp, wm_window.id());
    var old_id = wm_window.id();

    this.closePaneHelper(win.pane_tree, pane_id, undefined, wm_window);
    if (this.windows.indexOf(wm_window) == -1) // Then we deleted the window
        return;
    this.updateWindow(win, old_id);
}

WM.prototype.closePaneHelper = function(pane_tree, pane_id, parent_tree, wm_window) {
    if (pane_tree.id == pane_id) {
        if (parent_tree == undefined) {
            this.closeWindow(wm_window);
            return true;   
        } else {
            if (parent_tree.panes.pane1.id == pane_id) {
                parent_tree.id = parent_tree.panes.pane2.id;
                if (parent_tree.panes.pane2.panes == undefined)
                    delete parent_tree.panes;
                else
                    parent_tree.panes = parent_tree.panes.pane2.panes;
            } else {
                parent_tree.id = parent_tree.panes.pane1.id;
                if (parent_tree.panes.pane1.panes == undefined)
                    delete parent_tree.panes;
                else
                    parent_tree.panes = parent_tree.panes.pane1.panes;
            }
            return true;
        }
    }
    
    if (pane_tree.panes == undefined) return false;
    if (this.closePaneHelper(pane_tree.panes.pane1, pane_id, pane_tree, wm_window)) return true;
    if (this.closePaneHelper(pane_tree.panes.pane2, pane_id, pane_tree, wm_window)) return true;
    
    return false;
}

WM.prototype.minimizeWindow = function(wm_window) {
    if (!wm_window.maximized) wm_window.saveWindowInfo();
    this.minimize(wm_window);    
}

WM.prototype.defaultMinimizeFunction = function(wm_window) {
    var new_height = wm_window.titleBar.height() + 5 + 'px'

    var pos = {
        top : 'calc(100% - ' + new_height + ')',
        left : 'auto',
        width : '300px',
        height : new_height
    }

    this.setWindowPos(wm_window, pos, true, false);
}

WM.prototype.maximizeWindow = function(wm_window) {
    if (!wm_window.minimized) wm_window.saveWindowInfo();

    var pos = {
        top : '0px',
        left : '0px',
        width : '100%',
        height : '100%'
    }

    this.setWindowPos(wm_window, pos, false, true);
}

WM.prototype.restoreWindow = function(wm_window) {
    var info = wm_window.loadWindowInfo();
    this.setWindowPos(wm_window, info, false, false);
}

WM.prototype.closeWindow = function(wm_window) {
    var uwp = this.getUserWindowProfile();
    var win = this.getWindowById(uwp, wm_window.id());
    var to_remove = {}
    to_remove.windows = {
        id : wm_window.id()
    };
    to_remove.default_windows = wm_window.id();

    WMCollection.update(uwp._id, {
        $pull : to_remove
    });

    delete this.windows[this.windows.indexOf(wm_window)];

    if (this.focused_window.id() == wm_window.id()) {
        var new_focused_window = _.max(this.windows, function(win) {
            return win.element.zIndex();
        });

        this.grabFocus(new_focused_window, true);
    }
}

WM.prototype.renameTab = function(tab_id, name) {
    var uwp = this.getUserWindowProfile();
    var tab = this.getTabById(uwp, tab_id);
    tab.title = name;
    this.updateTab(tab);
}

WM.prototype.moveTab = function(tab_id, from_pane_id, to_pane_id) {
    self = this;
    var uwp = this.getUserWindowProfile();
    var tab = this.getTabById(uwp, tab_id);
    
    if (tab.active) { // If we were active, activate a tab in our old pane
        old_pane_tabs = this.getTabs(from_pane_id);
        if (old_pane_tabs.length > 0) {
            old_pane_tabs[0].active = true;
            this.updateTab(old_pane_tabs[0]);
        }
    }

    // Deactivate all tabs in the new pane
    _.each(this.getTabs(to_pane_id), function(newPaneTab) {
        if (newPaneTab.active) {
            newPaneTab.active = false;
            self.updateTab(newPaneTab);
        }
    });

    tab.pane_id = to_pane_id;
    tab.active = true;
    this.updateTab(tab);
}

WM.prototype.refreshWindow = function(window_id) {
    var win = this.getWMWindowById(window_id);
    if (win != undefined) {
        win.registerDividers();
        win.registerContextMenus();
    }
}

WM.prototype.getWMWindowById = function(window_id) {
    return _.find(this.windows, function(wm_window, index) {
        if (wm_window.id() == window_id)
            return wm_window;
    });
}

WMException = function (message) {
    this.message = message;
    this.name = "WMException";
}

WindowManager = new WM();

if (Meteor.isServer) {
    Accounts.validateLoginAttempt(function(attempt) {
        if (attempt.allowed) // Check for the profile and complete it before login if successful
            WindowManager.getOrCreateUserWindowProfile(attempt.user);
        return attempt.allowed;
    });
}
