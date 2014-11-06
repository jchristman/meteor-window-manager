WM = function() {
    this.LOGGING_LEVEL = 5;
}

WM.prototype.configure = function(settings) {
    if (Meteor.isServer) {
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
    user_window_profile = WMCollection.findOne({'username' : user.username});
    if (user_window_profile == undefined) {
        this.LOG(LOGGING.INFO, "User window profile does not exist. Creating now.");
        return this.createUserWindowProfile(user);
    }
    this.LOG(LOGGING.INFO, "User window profile found.");
    return user_window_profile;
}

WM.prototype.createUserWindowProfile = function(user) {
    var default_window_profile = WMCollection.findOne({'default' : 'profile'});
    delete default_window_profile._id;
    delete default_window_profile.default;
    WMCollection.insert(_.extend({'username' : user.username}, default_window_profile));
    this.LOG(LOGGING.INFO, "Created user window profile");

    return WMCollection.findOne({'username' : user.username});
}

WM.prototype.Window = function(_id, _title, _dimensions) {
    if (typeof _id == 'undefined') throw new WMException('Must specify ID for window');
    if (typeof _title == 'undefined') _title = 'Default';
    if (typeof _dimensions == 'undefined') 
        throw new WMException('Must specificy dimensions object as third argument');
    if (!_dimensions.hasOwnProperty('top')) throw new WMException('Need top property in dimensions');
    if (!_dimensions.hasOwnProperty('left')) throw new WMException('Need left property in dimensions');
    if (!_dimensions.hasOwnProperty('width')) throw new WMException('Need width property in dimensions');
    if (!_dimensions.hasOwnProperty('height')) throw new WMException('Need height property in dimensions');
    
    this.id = _id;
    this.title = _title;
    
    this.top = dimensions.top;
    this.left = dimensions.left;
    this.width = dimensions.width;
    this.height = dimensions.height;
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
