WM = function() {
    this.windows = [];
    this.focused_window = undefined;
}

WM.prototype.configure = function(settings) {
    if (Meteor.isServer) {
        if (!settings.hasOwnProperty('default_windows'))
            settings.default_windows = [];
        if (!settings.hasOwnProperty('default_tabs'))
            settings.default_tabs = [];

        default_window_profile = WMCollection.findOne({'default' : 'profile'});
        if (typeof default_window_profile == 'undefined') {
            WMCollection.insert(_.extend({'default' : 'profile'}, settings));
        }
    }
}

WM.prototype.init = function(settings) {
    if (settings != undefined) {
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

WM.prototype.getTabs = function(window_id) {
    var uwp = this.getUserWindowProfile();
    var tabs;
    if (window_id == undefined)
        tabs = uwp.tabs;
    else
        tabs = uwp.tabs.filter(function(tab) {
            if (uwp.default_tabs.length == 0) // An empty default array means everything is default
                return tab.window_id == window_id;
            return (tab.window_id == window_id && _.contains(uwp.default_tabs, tab.id));
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

WM.prototype.updateWindow = function(new_window) {
    var uwp = this.getUserWindowProfile();
    var windowWithIndex = this.getWindowByIdWithIndex(uwp, new_window.id);
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

WM.prototype.registerWindow = function(element, data) {
    var new_window = new WMWindow(element, this, data);
    this.windows.push(new_window);
    if (data.focused) this.focused_window = new_window;
}

WM.prototype.grabFocus = function(wm_window) {
    self = this;

    if (this.focused_window != wm_window) {
        var uwp = this.getUserWindowProfile();

        var focused_window = this.getWindowById(uwp, this.focused_window.id);
        focused_window.focused = false;
        this.updateWindow(focused_window);

        var new_focused_window = this.getWindowById(uwp, wm_window.id);
        new_focused_window.focused = true;
        new_focused_window.zIndex = focused_window.zIndex + 1;

        if (new_focused_window.zIndex > 1000) {
            new_focused_window.zIndex = 10;
            $(this.windows).not(wm_window).each(function(index, arr_wm_window) {
                if (arr_wm_window != wm_window) {
                    var window_to_update = self.getWindowById(uwp, arr_wm_window.id);
                    window_to_update.zIndex = 9;
                    self.updateWindow(window_to_update);
                }
            });
        }

        this.updateWindow(new_focused_window);

        this.focused_window = new_focused_window;
    }
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
