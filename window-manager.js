WM = function() {

}

WM.prototype.configure = function(settings) {

}

WM.prototype.init = function() {
    
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
