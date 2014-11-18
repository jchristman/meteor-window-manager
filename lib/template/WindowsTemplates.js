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
    //     Panes code       //
    // -------------------- //
    Template.panes.helpers({
        paneChildTop : function() {
            return this.panes.pane1;
        },

        paneChildBottom : function() {
            return this.panes.pane2;
        },

        paneChildLeft : function() {
            return this.panes.pane1;
        },

        paneChildRight : function() {
            return this.panes.pane2;
        },

        isLeaf : function() {
            return (this.panes == undefined);
        },

        splitIsVertical : function() {
            return (this.panes.split_orientation == 'vertical');
        },

        splitPercentages : function() {
            var div_width = 8;
            var split_percent = 'calc(' + this.panes.split_percent + ' - ' + (div_width/2) + 'px)';
            var inv_split_percent = 'calc(' + (100 - parseInt(
                            this.panes.split_percent.substring(
                                0,this.panes.split_percent.length - 1))) + '% - ' + (div_width/2) + 'px)';
            var pane_start = 'calc(' + this.panes.split_percent + ' + ' + (div_width/2) + 'px)';
            var div_pos = 'calc(' + this.panes.split_percent + ' - ' + (div_width/2 - 2) + 'px)';
            return _.extend(this, { 
                pane1_percent : split_percent,
                pane2_percent : inv_split_percent,
                pane2_start : pane_start,
                divider_position : div_pos
            });
        }
    });

    Template.pane_content.helpers({
        tabs : function(window_id) {
            try {
                return { windowTabs : WindowManager.getTabs(window_id) };
            } catch(e) {
                if (!(e instanceof WMException))
                    throw e;
            }
            return undefined;
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

    var hoverWindow = undefined;

    var registerDroppable = function(element) {
        element = $(element);
        element.droppable(
            {
                tolerance: 'intersect',
                over: function(event, ui) {
                    hoverWindow = $(this);
                },
                out: function(event, ui) {
                    $(this).find('.dest-pane-outline-1,.dest-pane-outline-2').hide();
                },
                drop: function(event, ui) {
                    $(this).find('.dest-pane-outline-1,.dest-pane-outline-2').hide();

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
            start: function(e, ui){
                $(ui.helper).addClass("draggingTab");
            },
            drag: function(e, ui) {
                if (hoverWindow != undefined) {
                    var pane_outline_1 = $(hoverWindow.find('.dest-pane-outline-1'));
                    var pane_outline_2 = $(hoverWindow.find('.dest-pane-outline-2'));
                    if (ui.position.left < hoverWindow.offset().left + hoverWindow.width() / 4) {
                        pane_outline_1.css('top', 62);
                        pane_outline_1.css('left', 2);
                        pane_outline_1.css('width', (hoverWindow.width() - 4) / 3 - 2);
                        pane_outline_1.css('height', hoverWindow.height() - 64);
                        pane_outline_1.show();
                        pane_outline_2.css('top', 62);
                        pane_outline_2.css('left', 2 + (hoverWindow.width() - 4) / 3);
                        pane_outline_2.css('width', 2 * (hoverWindow.width() - 4) / 3);
                        pane_outline_2.css('height', hoverWindow.height() - 64);
                        pane_outline_2.show();
                    } else if (ui.position.left < hoverWindow.offset().left + 3 * hoverWindow.width() / 4) {
                        if (ui.position.top < hoverWindow.offset().top + 3 * hoverWindow.height() / 4) {
                            pane_outline_1.css('top', 62);
                            pane_outline_1.css('left', 2);
                            pane_outline_1.css('width', hoverWindow.width() - 4);
                            pane_outline_1.css('height', hoverWindow.height() - 64);
                            pane_outline_1.show();
                            pane_outline_2.hide();
                        } else {
                            pane_outline_1.css('top', 62);
                            pane_outline_1.css('left', 2);
                            pane_outline_1.css('width', hoverWindow.width() - 4);
                            pane_outline_1.css('height', (hoverWindow.height() - 62) / 2);
                            pane_outline_1.show();
                            pane_outline_2.css('top', (62 + hoverWindow.height()) / 2 + 3);
                            pane_outline_2.css('left', 2);
                            pane_outline_2.css('width', hoverWindow.width() - 4);
                            pane_outline_2.css('height', (hoverWindow.height() - 62) / 2 - 5);
                            pane_outline_2.show();
                        }
                    } else {
                        pane_outline_1.css('top', 62);
                        pane_outline_1.css('left', 2);
                        pane_outline_1.css('width', 2 * (hoverWindow.width() - 4) / 3 - 2);
                        pane_outline_1.css('height', hoverWindow.height() - 64);
                        pane_outline_1.show();
                        pane_outline_2.css('top', 62);
                        pane_outline_2.css('left', 2 * (hoverWindow.width() - 4) / 3 + 2);
                        pane_outline_2.css('width', (hoverWindow.width() - 4) / 3);
                        pane_outline_2.css('height', hoverWindow.height() - 64);
                        pane_outline_2.show();
                    }
                }
            },
        });
    }        

}
