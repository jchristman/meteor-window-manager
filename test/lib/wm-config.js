WindowManager.configure({
    windows : [
        {
            id : 'test1', 
            title : 'Test Title 1',
            top : '0%', 
            left : '0%', 
            width : '50%', 
            height : '50%'
        },
        {
            id : 'test2', 
            title : 'Test Title 2',
            top : '0%', 
            left : '50%', 
            width : '50%', 
            height : '50%'
        },
        {
            id : 'test3', 
            title : 'Test Title 3',
            top : '50%', 
            left : '0%', 
            width : '100%', 
            height : '50%'
        }
    ],

    tabs : [

    ],

    default-windows : [ 'test1','test2','test3' ],

    default-tabs : [

    ]
});

WindowManager.init();
