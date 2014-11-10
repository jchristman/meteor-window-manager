if (Meteor.isClient) {
    // -------------------- //
    //   Windows Iterator   //
    // -------------------- //
    Template.windows.helpers({
        windows : function() {
            try {
                return WindowManager.getWindows();
            } catch (e) {
                if (!(e instanceof WMException))
                    throw e;
            }
            return undefined;
        }
    });

    // -------------------- //
    //     Windows code     //
    // -------------------- //
    Template.window.rendered = function() {
        var data = this.data;
        $(this.findAll('.window')).each(function(index, element) {
            element = $(element);
            registerDroppable(element);
            WindowManager.registerWindow(element, data);
        });
    }

    Template.window.helpers({
        tabs : function(window_id) {
            try {
                return { windowTabs : WindowManager.getTabs(window_id) };
            } catch(e) {
                if (!(e instanceof WMException))
                    throw e;
            }
            return undefined;
        },

        isFocused : function() {
            return this.focused;
        },

        isMinimized : function() {
            return this.minimized;
        },

        isMaximized : function() {
            return this.maximized;
        }
    });

    // -------------------- //
    //       Tab code       //
    // -------------------- //
    Template.tab_head.rendered = function() {
        $(this.findAll('.draggableTab')).each(function(index, element) {
            registerDraggable(element);
        });
    }

    Template.tab_head.helpers({
        isActive : function() {
            return this.active;
        }
    });

    Template.tab_body.helpers({
        tabContentContext : function(tab_id) {
            try {
                return { tabTemplate : WindowManager.getTabContent(tab_id) }
            } catch(e) {
                if (!(e instanceof WMException))
                    throw e;
            }
            return undefined;
        },

        isActive : function() {
            return this.active;
        }
    });

    var registerDroppable = function(element) {
        element = $(element);
        element.droppable(
            {
                tolerance: 'intersect',
                over: function(event, ui) {
                    $(this).addClass('hoverClass');
                },
                out: function(event, ui) {
                    $(this).removeClass('hoverClass');
                },
                drop: function(event, ui) {
                    var draggable = $($(ui.draggable)[0]);
                    var tab_id = draggable.attr('id').split('head_')[1];
                    var new_window_id = $(this).attr('id');
                    var old_window = $(draggable.closest('.window'));
                    var old_window_id = old_window.attr('id');
                    if (new_window_id == old_window_id)
                        return;
                    
                    var uwp = WindowManager.getUserWindowProfile();

                    // We are now ready to update. Let's deactivate the active tab in the other window
                    $('#' + new_window_id).find('.active').each(function(index, element) {
                        element = $(element);
                        
                        var tab = WindowManager.getTabById(uwp, element.attr('id').split('head_')[1]);
                        if (tab == undefined) // If we can't find the tab
                            return true;
                        tab.active = false;

                        WindowManager.updateTab(tab);
                    });

                    if (draggable.hasClass('active')) { // Activate a tab in the old window
                        old_window.find('.nav.nav-tabs li').each(function(index, element) {
                            element = $(element);
                            if (element.attr('id') != draggable.attr('id')) {
                                // Now update the database
                                var tab = WindowManager.getTabById(uwp, element.attr('id').split('head_')[1]);
                                console.log(tab);
                                if (tab == undefined) // If we can't find the tab
                                    return true;
                                tab.active = true;

                                WindowManager.updateTab(tab);
                                return false; // This is to exit the .each loop. We do this so that we only set one new 'active' tab
                            }
                        });
                    }
                    
                    var tab = WindowManager.getTabById(uwp, tab_id);
                    tab.window_id = new_window_id;
                    tab.active = true; // in case we are dragging an inactive tab

                    WindowManager.updateTab(tab);
                }
            });
    }

    var registerDraggable = function(element) {
        $(element).draggable({
            opacity: 0.9, 
            helper: 'clone',
            appendTo: 'body',
            containment: 'DOM',
            zIndex: 1500,
            start: function(e, ui)
            {
                $(ui.helper).addClass("draggingTab");
            }
        });
    }        

}
