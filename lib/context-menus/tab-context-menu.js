registerTabContextMenu = function(element) {
    $(element).contextmenu({
        target : '#tab-context-menu',
        before : function (event, element, target) {
            // Prevent showing the default menu
            event.preventDefault();
            return true;
        }, 
        onItem : function (context, event) {
            var selected = $(event.target);
            if (selected.text() == 'Rename Tab') {
                tab_text_element = $(element.find('a')[0]);
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
                        // Now update the database for reactive awesomeness
                        var profile = Profiles.findOne({username : Meteor.user().username});
                        var new_tab = getTab(profile, element.attr('id').split('_')[1]);
                        var index = new_tab.index;
                        new_tab = new_tab.tab;
                        new_tab.title = input.val(); // TODO: modify the id at all? Make id's unique?
                        var new_tab_json = tabToJSON(new_tab, index);
                        Profiles.update(profile._id, {
                            $set : new_tab_json
                        });                        
                    }
                });
            }
        }
    });
}
