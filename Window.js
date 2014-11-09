WMWindow = function(element, manager, data) {
    console.log("Creating window");
    this.element = $(element);
    this.manager = manager;
    this.id = data.id;
    this.init();
}

WMWindow.prototype.init = function() {
    var self = this; // this is replaced in the mousedown function, so save a reference
    
    /* ------- CLICK ------- */
    this.element.click(function() {
        self.click();
    });

    /* ------- TITLE BAR ------- */
    this.titleBar = $('.windowtitlebar', this.element);
    this.titleBar.mousedown(function(event) {
            self.startMove(event);
        });

    this.titleBarText = $('.titlebartext', this.element);
    this.titleBarText.onselectstart = this.cancel;
    this.titleBarText.unselectable = "on";

    /* ------- MOVER ------- */
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    this.moverBoxPosition = {
        top : 0,
        left : 0,
        width : 0,
        height : 0
    }
    this.moverProxy = $('<div id="moverproxy">').mousemove(function(event) {
            return self.updateMove(event);
        })
        .mouseup(function() {
            return self.endMove();
        });
    this.moverProxyContainer = $('<div>').appendTo(this.moverProxy);
    this.moverProxy.onselectstart = this.cancel;
    
    /* ------- RESIZER ------- */
    this.resizeMask = 0;
    this.resizeBoxPosition = {
        right : 0,
        bottom : 0,
        width : 0,
        height : 0
    }

    this.element.find('.resizer-tl,.resizer-t,.resizer-tr,.resizer-r,.resizer-br,' + 
        '.resizer-b,.resizer-bl,.resizer-l').mousedown(function() {
            return self.startResize(this);
        });

    this.resizerProxy = $('<div id="resizerproxy">').mousemove(function(event) {
            return self.updateResize(event);
        })
        .mouseup(function() {
            return self.endResize();
        });
    this.resizerProxy.onselectstart = this.cancel;
}

WMWindow.prototype.startMove = function(event) {
    if (event.button && event.button == 2) return true;
    // TODO: double click?
    
    this.manager.grabFocus(this);

    this.moverBoxPosition = this.getWindowInfo();
    this.moverBoxPosition.width = this.element.width() + 2;
    this.moverBoxPosition.height = this.element.height() + 2;
    this.moverBoxPosition.bottom = this.moverBoxPosition.right = 'auto';

    this.moverProxyContainer.css(this.moverBoxPosition);
    this.moverProxy.appendTo($(document.body));
    this.moverProxy.show();

    this.lastMouseY = event.pageY;
    this.lastMouseX = event.pageX;

    return false;
}

WMWindow.prototype.updateMove = function(event) {
    this.moverBoxPosition.top += event.pageY - this.lastMouseY;
    this.moverBoxPosition.left += event.pageX - this.lastMouseX;
    
    console.log(this.lastMouseX, this.lastMouseY, event.pageX, event.pageY);

    this.lastMouseY = event.pageY;
    this.lastMouseX = event.pageX;
    this.moverProxyContainer.css(this.moverBoxPosition);

    return false;
}

WMWindow.prototype.endMove = function() {
    this.moverProxy.hide();
    this.moverProxy.detach();
    return false;
}

WMWindow.prototype.startResize = function(resizeHandle) {
    resizeHandle = $(resizeHandle);
    var match = resizeHandle.attr('class').match(/resizer\-(\w+)/);
    if (match.length != 2) return true;

    var type = match[1];
    this.resizeMask = 0;
    if (type[0] == 't') this.resizeMask |= R_MASK.TOP;
    else if (type[0] == 'b') this.resizeMask |= R_MASK.BOTTOM;
    if (type.match(/l/)) this.resizeMask |= R_MASK.LEFT;
    else if (type.match(/r/)) this.resizeMask |= R_MASK.RIGHT;

    this.manager.grabFocus(this);

    return false;
}

WMWindow.prototype.updateResize = function(event) {
    return false;
}

WMWindow.prototype.endResize = function() {
    return false;
}

WMWindow.prototype.click = function() {
    this.manager.grabFocus(this);
}

WMWindow.prototype.getWindowInfo = function() {
    var info = this.element.offset();
    info.width = this.element.width();
    info.height = this.element.height();

    var parentInfo = this.element.parent().offset();
    info.parentTop = parentInfo.top;
    info.parentLeft = parentInfo.left;
    info.parentWidth = this.element.parent().width();
    info.parentHeight = this.element.parent().height();

    return info;
}

WMWindow.prototype.translatePosition = function(pos) {
    return {
        top : pos.top - pos.parentTop,
        left : pos.left - pos.parentLeft,
        width : pos.width,
        height : pos.height,
        parentWidth : pos.parentWidth,
        parentHeight: pos.parentHeight
    };
}

WMWindow.prototype.cancel = function() {
    return false;
}

var R_MASK = {
    TOP : 1,
    RIGHT : 2,
    BOTTOM : 4,
    LEFT : 8,
}
