WM = function() {
    this.LOGGING_LEVEL = 5;
}

WM.prototype.configure = function(settings) {
    if (Meteor.isServer) {
        if (!settings.hasOwnProperty('default_windows'))
            settings.default_windows = [];
        if (!settings.hasOwnProperty('default_tabs'))
            settings.default_tabs = [];

        default_window_profile = WMCollection.findOne({'default' : 'profile'});
        if (typeof default_window_profile == 'undefined') {
            this.LOG(LOGGING.INFO, "Default profile does not exist. Creating according to settings.");
            WMCollection.insert(_.extend({'default' : 'profile'}, settings));
        }
    }
}

WM.prototype.init = function(settings) {
    if (settings != undefined) {
        if (settings.hasOwnProperty('LOGGING_LEVEL')) this.LOGGING_LEVEL = settings.LOGGING_LEVEL;
    }
}

WM.prototype.getUserWindowProfile = function(user) {
    if (user == undefined)
        user = Meteor.user();
    if (user && WMCollectionSubscription.ready()) { // Check if the user is logged in and the collection ready
        return this.getOrCreateUserWindowProfile(user);
    } else {
        this.LOG(LOGGING.WARN, "User not logged in or WMCollection not fully transferred");
        throw new WMException("User not logged in or WMCollection not fully transferred");
    }

    return undefined;
}

WM.prototype.getOrCreateUserWindowProfile = function(user) {
    var uwp = WMCollection.findOne({'username' : user.username});
    if (uwp == undefined) {
        this.LOG(LOGGING.INFO, "User window profile does not exist. Creating now.");
        return this.createUserWindowProfile(user);
    }
    return uwp;
}

WM.prototype.createUserWindowProfile = function(user) {
    var default_window_profile = WMCollection.findOne({'default' : 'profile'});
    delete default_window_profile._id;
    delete default_window_profile.default;
    WMCollection.insert(_.extend({'username' : user.username}, default_window_profile));
    this.LOG(LOGGING.INFO, "Created user window profile");

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

WM.prototype.getTabById = function(uwp, tab_id) {
    return _.find(uwp.tabs, function(tab) {
        if (tab.id == tab_id)
            return tab;
    });
}

WM.prototype.getTabContent = function(tab_id) {
    var uwp = this.getUserWindowProfile();
    var tab = this.getTabById(uwp, tab_id);
    return Template[tab.template];
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

WM.prototype.updateTab = function(new_tab) {
    var uwp = this.getUserWindowProfile();
    var tabWithIndex = this.getTabByIdWithIndex(uwp, new_tab.id);
    var update = {}
    var key = "tabs." + tabWithIndex.index;
    update[key] = new_tab;
    this.LOG(LOGGING.INFO, "Updating tab: " + JSON.stringify(update));

    WMCollection.update(uwp._id, {
        $set : update
    });
}

WM.prototype.LOG = function(level, message) {
    if (this.LOGGING_LEVEL <= level)
        if (level == LOGGING.ERROR)
            console.error(LOGGING[level] + ': ' + message);
        else if (level == LOGGING.WARN)
            console.warn(LOGGING[level] + ': ' + message);
        else
            console.log(LOGGING[level] + ': ' + message);
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

// Log if the LOGGING_LEVEL <= LOGGING number
var LOGGING = {
    DEBUG : 1,
    INFO : 2,
    WARN : 3,
    ERROR : 4,
    1 : 'DEBUG',
    2 : 'INFO',
    3 : 'WARN',
    4 : 'ERROR'
}

