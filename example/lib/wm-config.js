WindowManager.configure({
    windows : [
        {
            id : "test1", 
            title : "Test Title 1",
            focused : true,
            top : "0%", 
            left : "0%", 
            width : "50%", 
            height : "50%",
            zIndex : 3
        },
        {
            id : "test2", 
            title : "Test Title 2",
            top : "0%", 
            left : "50%", 
            width : "50%", 
            height : "50%",
            zIndex : 2,
        },
        {
            id : "test3", 
            title : "Test Title 3",
            top : "50%", 
            left : "0%", 
            width : "100%", 
            height : "50%",
            zIndex : 1,
            pane_tree : {
                id : "test3_pane",
                panes : {
                    split_orientation : 'vertical',
                    split_percent : '60%',
                    pane1 : {
                        id : 'test3_pane1'
                    },
                    pane2 : {
                        id : 'test3_pane2',
                        panes : {
                            split_orientation : 'horizontal',
                            split_percent : '50%',
                            pane1 : {
                                id : 'test3_pane2.1'
                            },
                            pane2 : {
                                id : 'test3_pane2.2'
                            }
                        }
                    }
                }
            }
        }
    ],

    tabs : [
        {
            id : "test-tab1",
            title : "Test Tab 1",
            pane_id : "test1_pane",
            active : true,
            template : "test_template1"
        },
        {
            id : "test-tab2",
            title : "Test Tab 2",
            pane_id : "test2_pane",
            active : true,
            template : "test_template2"
        },
        {
            id : "test-tab3",
            title : "Test Tab 3",
            pane_id : "test3_pane2.1",
            active : true,
            template : "test_template3"
        },
        {
            id : "test-tab4",
            title : "Test Tab 4",
            pane_id : "test3_pane2.2",
            active : true,
            template : "test_template4"
        },
        {
            id : "test-tab5",
            title : "Test Tab 5",
            pane_id : "test3_pane1",
            active : false,
            template : "test_template5"
        },
        {
            id : "test-tab6",
            title : "Test Tab 6",
            pane_id : "test3_pane1",
            active : true,
            template : "test_template6"
        }
    ]
});

WindowManager.init({
});
