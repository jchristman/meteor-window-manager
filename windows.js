if (Meteor.isClient) {
    // -------------------- //
    //   Windows Iterator   //
    // -------------------- //
    Template.windows.helpers({
        windows : function() {
            //WindowManager.user_window_profile().windows;
        }
    });

    // -------------------- //
    //     Windows code     //
    // -------------------- //
    Template.window.rendered = function() {
        registerDroppable(this.findAll('.window'));
    }

    Template.window.helpers({
        tabs : function(window) {
            var profile = Profiles.findOne({userid : Meteor.userId()});
            return profile.tabs.filter(function(tab) {
                return tab.window_id == window;
            });
        },

        tabContent : function(templateName) {
            if (Meteor.user() != null) {
                var returnTemplate = Template[templateName];
                return { tabContentTemplate: returnTemplate };
            }
        },

        tabMatch : function(tab_window_id, window_id) {
            return tab_window_id == window_id;
        },

        isActive : function() {
            return this.isActive;
        }
    });

    registerDroppable = function(element) {
        $(element).droppable(
                {
                    tolerance: 'intersect',
                    over: function(event, ui) {
                        $(this).addClass('hoverClass');
                    },
                    out: function(event, ui) {
                        $(this).removeClass('hoverClass');
                    },
                    drop: function(event, ui) {
                        // Get id of the item that was moved
                        var draggable = $($(ui.draggable)[0]);
                        var tab_id = draggable.attr('id').split('_')[1];
                        var new_window_id = this.id;
                        var old_parent_window = $(draggable.closest('.window'));
                        if (new_window_id == old_parent_window.attr('id'))
                            return;
                        
                        var profile = Profiles.findOne({username : Meteor.user().username});

                        // We are now ready to update. Let's deactivate the active tab in the other window
                        var active = $('#' + new_window_id).find('.active')
                        for (var i = 0; i < active.length; i++) {
                            var element = $(active[i]);
                            if (element.hasClass('active')) {
                                $(active[i]).removeClass('active');
                                
                                if (element.is('div')) {
                                    var new_tab = getTab(profile, element.attr('id'));
                                    var index = new_tab.index;
                                    new_tab = new_tab.tab;
                                    new_tab.isActive = false;
                                    var new_tab_json = tabToJSON(new_tab, index);

                                    Profiles.update(profile._id, {
                                        $set : new_tab_json
                                    });
                                }
                            }   
                        };

                        if (draggable.hasClass('active')) {
                            old_parent_window.find('.nav.nav-tabs li').each(function(index, element) {
                                element = $(element);
                                if (element.attr('id') != draggable.attr('id') && element.attr('id') != "head_") {
                                    element.find('a').tab('show');
                                    // Now update the database
                                    var new_tab = getTab(profile, element.attr('id').split('_')[1]);
                                    var index = new_tab.index;
                                    new_tab = new_tab.tab;
                                    new_tab.isActive = true;
                                    var new_tab_json = tabToJSON(new_tab, index);

                                    Profiles.update(profile._id, {
                                        $set : new_tab_json
                                    });

                                    return false; // This is to exit the .each loop. We do this so that we only set one new 'active' tab
                                }
                            });;
                        }
                        
                        var new_tab = getTab(profile, tab_id);
                        var index = new_tab.index;
                        new_tab = new_tab.tab;
                        new_tab.window = new_window_id;
                        new_tab.isActive = true; // in case we are dragging an inactive tab
                        
                        var new_tab_json = tabToJSON(new_tab, index);

                        Profiles.update(profile._id, {
                            $set : new_tab_json
                        });
                    }
                });
    }

    registerDraggable = function(element) {
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

    getTab = function(profile, tab_id) {
        var index = findTabIndex(profile, tab_id);
        if (index == -1) {
            console.log("Uh oh! Error in windows.js");
            console.log(profile);
            console.log(tab_id);
        }

        return { tab: profile.tabs[index], index: index };
    }

    var findTabIndex = function(profile, tab_id) {
        var index = -1;
        var tabs = profile.tabs;
        for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].tab_id == tab_id) {
                index = i;
            }
        }
        return index;
    }

    tabToJSON = function(tab, index) {
        var tab_array_spot = "tabs." + index;
        var new_tab_json = {};
        new_tab_json[tab_array_spot] = tab;
        return new_tab_json;
    }
}
