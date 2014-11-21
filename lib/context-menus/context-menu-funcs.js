CONTEXT_MENU_FUNCS = {
    listTabsNotInPane : function(selector) {
        var menuObj = [];

        var pane_id = selector.closest('.pane-container').attr('id');
        var otherPanes = WindowManager.getTabs(pane_id, true);
        if (otherPanes.length == 0) {
            menuObj.push({
                icon: 'glyphicon-exclamation-sign',
                text: 'No other tabs to move'
            });
        } else {
            _.each(otherPanes, function(tab) {
                menuObj.push({
                    text: tab.title,
                    action: function(e, selector) {
                        WindowManager.moveTab(tab.id, tab.pane_id, pane_id);
                    }
                });
            });
        }

        return menuObj;
    }
}
