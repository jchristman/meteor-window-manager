WindowManager.configure({
    windows : [
        {
            id : "test1", 
            title : "Test Title 1",
            active : true,
            top : "0%", 
            left : "0%", 
            width : "50%", 
            height : "50%"
        },
        {
            id : "test2", 
            title : "Test Title 2",
            active : false,
            top : "0%", 
            left : "50%", 
            width : "50%", 
            height : "50%"
        },
        {
            id : "test3", 
            title : "Test Title 3",
            active : false,
            top : "50%", 
            left : "0%", 
            width : "100%", 
            height : "50%"
        }
    ],

    tabs : [
        {
            id : "test-tab1",
            title : "Test Tab 1",
            window_id : "test1",
            active : true,
            template : "test_template1"
        },
        {
            id : "test-tab2",
            title : "Test Tab 2",
            window_id : "test2",
            active : true,
            template : "test_template2"
        },
        {
            id : "test-tab3",
            title : "Test Tab 3",
            window_id : "test3",
            active : true,
            template : "test_template3"
        },
        {
            id : "test-tab4",
            title : "Test Tab 4",
            window_id : "test1",
            active : false,
            template : "test_template4"
        }
    ],

    default_windows : [ "test1","test2","test3" ],

    default_tabs : [ "test-tab1", "test-tab2", "test-tab3", "test-tab4" ]
});

WindowManager.init({
    LOGGING_LEVEL : 0
});
