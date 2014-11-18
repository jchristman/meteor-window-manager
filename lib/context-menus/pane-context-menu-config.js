PANE_CONTEXT_MENU = [
    {
        name: 'split-vertically',
        icon: 'glyphicon-resize-horizontal',
        title: 'Split Vertically',
    },
    {
        name: 'split-horizontally',
        icon: 'glyphicon-resize-vertical',
        title: 'Split Vertically',
    },
    {},
    {
        name: 'open-tab',
        icon: 'glyphicon-open',
        title: 'Open Tab'
    },
    {
        name: 'move-tab',
        icon: 'glyphicon-move',
        title: 'Move Tab To:',
        subMenu : [
                {
                    name: 'none',
                    icon: 'glyphicon-exclamation-sign',
                    title: 'No possible destination'
                }
            ]
    },
    {
        name: 'move-tab-here',
        icon: 'glyphicon-move',
        title: 'Move Tab Here:',
        subMenu : [
                {
                    name: 'none',
                    icon: 'glyphicon-exclamation-sign',
                    title: 'No other tabs are open'
                }
            ]
    },
    {
        name: 'close-tab',
        icon: 'glyphicon-trash',
        title: 'Close Tab'
    }
];
