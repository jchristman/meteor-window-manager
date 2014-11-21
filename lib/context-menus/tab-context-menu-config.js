TAB_CONTEXT_MENU = {
    id: 'TAB-CONTEXT-MENU',
    data: [
    {
        header : 'Tab Actions'
    },
    {
        icon: 'glyphicon-edit',
        text: 'Rename Tab',
        action: function(e, selector) {
            tab_text_element = $(selector.find('a')[0]);
            console.log(tab_text_element);
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
                    WindowManager.renameTab(selector.attr('id').split('head_')[1], input.val());
                }
            });
        }
    },
    {
        icon: 'glyphicon-trash',
        text: 'Close Tab'
    }
]};

