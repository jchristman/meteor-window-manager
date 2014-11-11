WMWindow = function(element, manager, data) {
    this.element = $(element);
    this.manager = manager;
    this.minimized = data.minimized;
    this.maximized = data.maximized;
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
    
    /* ------- BUTTONS ------- */
    this.buttons = this.titleBar.find('.horizbuts').mousedown(this.cancel).children();
    this.buttons.eq(0).click(function() { self.minimize(this); return false; });
    this.buttons.eq(1).click(function() { self.restore(this); return false; });
    this.buttons.eq(2).click(function() { self.maximize(this); return false; });
    this.buttons.eq(3).click(function() { self.close(this); return false; });

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
    this.resizerProxyContainer = $('<div>').appendTo(this.resizerProxy);
    this.resizerProxy.onselectstart = this.cancel;

    /* -------- SAVE -------- */
    this.savedPosition = {
        top : 0,
        left : 0,
        width : 0,
        height : 0
    }

    /* ------- CONTEXT MENU ------- */
    this.element.find('.tab-head').contextMenu({
        menuObject : TAB_CONTEXT_MENU,
        menuSelected : function(invokedOn, selectedItem) {
            self.handleTabContextMenu(invokedOn, selectedItem);
        }
    });
}

WMWindow.prototype.startMove = function(event) {
    if (event.button && event.button == 2) return true;
    // TODO: double click?
    
    this.manager.grabFocus(this);

    this.moverBoxPosition = this.getWindowInfo();
    this.moverBoxPosition.bottom = this.moverBoxPosition.right = 'auto';

    this.moverProxyContainer.css(this.moverBoxPosition);
    this.moverProxy.appendTo($(document.body));
    this.moverProxy.show();

    this.winOffsetY = event.pageY - this.moverBoxPosition.top;
    this.winOffsetX = event.pageX - this.moverBoxPosition.left;

    return false;
}

WMWindow.prototype.updateMove = function(event) {
    this.moverBoxPosition.top = event.pageY - this.winOffsetY;
    this.moverBoxPosition.left = event.pageX - this.winOffsetX;
    
    this.moverProxyContainer.css(this.moverBoxPosition);

    return false;
}

WMWindow.prototype.endMove = function() {
    this.manager.setWindowPos(this, this.translatePosition(this.moverBoxPosition));

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

    this.resizerBoxPosition = this.getWindowInfo();
    this.resizerBoxPosition.right = this.resizerBoxPosition.left + this.resizerBoxPosition.width;
    this.resizerBoxPosition.bottom = this.resizerBoxPosition.top + this.resizerBoxPosition.height;
    this.resizerBoxPosition.width = this.resizerBoxPosition.width;
    this.resizerBoxPosition.height = this.resizerBoxPosition.height;
    
    this.resizerProxyContainer.css(this.resizerBoxPosition);
    this.resizerProxy.appendTo($(document.body));
    this.resizerProxy.show();

    this.winOffsetY = event.pageY - this.resizerBoxPosition.top;
    this.winOffsetX = event.pageX - this.resizerBoxPosition.left;

    return false;
}

WMWindow.prototype.updateResize = function(event) {
    if (this.resizeMask & R_MASK.TOP)           this.resizerBoxPosition.top = event.pageY;
    else if (this.resizeMask & R_MASK.BOTTOM)   this.resizerBoxPosition.bottom = event.pageY;
    if (this.resizeMask & R_MASK.LEFT)          this.resizerBoxPosition.left = event.pageX;
    else if (this.resizeMask & R_MASK.RIGHT)    this.resizerBoxPosition.right = event.pageX;

    this.resizerBoxPosition.height = Math.abs(this.resizerBoxPosition.top - this.resizerBoxPosition.bottom) + 2;
    this.resizerBoxPosition.width = Math.abs(this.resizerBoxPosition.left - this.resizerBoxPosition.right) + 2;
    this.resizerProxyContainer.css(this.resizerBoxPosition);

    return false;
}

WMWindow.prototype.endResize = function() {
    this.manager.setWindowPos(this, this.translatePosition(this.resizerBoxPosition));

    this.resizerProxy.hide();
    this.resizerProxy.detach();

    return false;
}

WMWindow.prototype.click = function() {
    this.manager.grabFocus(this);
}

WMWindow.prototype.minimize = function() {
    this.manager.minimizeWindow(this);
    this.minimized = true;
    this.maximized = false;
}

WMWindow.prototype.restore = function() {
    this.manager.restoreWindow(this);
    this.minimized = false;
    this.maximized = false;
}

WMWindow.prototype.maximize = function() {
    this.manager.maximizeWindow(this);
    this.minimized = false;
    this.maximized = true;
}

WMWindow.prototype.close = function() {
    this.manager.closeWindow(this);
}   

WMWindow.prototype.saveWindowInfo = function() {
    this.savedPosition = this.getWindowInfo();
}

WMWindow.prototype.loadWindowInfo = function() {
    return this.savedPosition;
}

WMWindow.prototype.getWindowInfo = function() {
    var info = this.element.offset();
    info.width = this.element.width() + 2;
    info.height = this.element.height() + 2;

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

WMWindow.prototype.id = function() {
    return this.element.attr('id');
}

WMWindow.prototype.handleTabContextMenu = function(invokedOn, selectedItem) {
    if (selectedItem.attr('id') == 'rename-tab') {
        tab_text_element = $(invokedOn);
        input = $('<input>').attr({
            type : 'text',
            id : 'newTabName',
            value : tab_text_element.text()
        });
        tab_text_element.html(input);
        input.focus();
        input.select();
        input.bind('keypress', function(event) {
            if (event.keyCode == 13) {
                tab_text_element.text("");
                WindowManager.renameTab(tab_text_element.parent().attr('id').split('head_')[1], input.val());
            }
        });
    }
}

var R_MASK = {
    TOP : 1,
    RIGHT : 2,
    BOTTOM : 4,
    LEFT : 8,
}