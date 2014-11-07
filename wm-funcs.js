    $('.wm-bottom').zIndex(100000000);

    $('.window').each(function() {
        $().WM('register', $(this));
        $(this).show();
    });
