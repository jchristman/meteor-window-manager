WM = function() {
    
}

WM.prototype.configure = function(settings) {
    if (Meteor.isServer) {
        default_window_profile = WMCollection.findOne({'default' : 'profile'});
        if (typeof default_window_profile == 'undefined')
            WMCollection.insert(_.extend({'default' : 'profile'}, settings));
    }
}

WM.prototype.init = function() {

}

WM.prototype.getUserWindowProfile = function(user) {
    if (user == undefined)
        user = Meteor.user();
    if (user && WMCollectionSubscription.ready()) { // Check if the user is logged in and the collection ready
        return getOrCreateUserWindowProfile(user);
    }    

    return undefined;
}

WM.prototype.getOrCreateUserWindowProfile = function(user) {
    user_window_profile = WMCollection.findOne({'username' : user.username});
    if (user_window_profile == undefined)
        return this.createUserWindowProfile(user);
    return user_window_profile;
}

WM.prototype.createUserWindowProfile = function(user) {
    var default_window_profile = WMCollection.findOne({'default' : 'profile'});
    delete default_window_profile._id;
    delete default_window_profile.default;
    WMCollection.insert(_.extend({'username' : user.username}, default_window_profile));

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

function WMException(message) {
    this.message = message;
    this.name = "WMException";
}

WindowManager = new WM();

if (Meteor.isServer) {
    Accounts.onLogin(function(attempt) {
        WindowManager.getOrCreateUserWindowProfile(attempt.user); // Make sure the profile exists
    });
}
