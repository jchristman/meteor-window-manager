Template.windows.rendered = function() {
    $('.wm-bottom').zIndex(100000000);

    GetWindows = function(){
        return $('.window');
    }

    GetWindowById = function(id) {
        return $('#' + id);
    }

    SetWindowTitle = function($hwnd,title){
        $hwnd.find('.titlebartext').text(title);
        // update the bottom window button
        // <button type="button" class="btn btn-default navbar-btn">Sign in</button>
    }

    CreateWindow = function(){
        console.log("creating window");
        
        var main = $(".main");
        var $w = $().WM('open', main);
        $w.find('.windowcontent')
                        .addClass("panel")
                        .addClass("with-nav-tabs")
                        //.addClass("panel-primary") // change color to blue
                        .addClass("panel-default")
                        .wrapInner('<div class="panel-body"><div class="tab-content"></div></div>')
                        .prepend('<div class="panel-heading"></div>')
                        .find('.panel-heading')
                        .append('<ul class="nav nav-tabs"></ul>');
        // <button type="button" class="btn btn-default navbar-btn">Sign in</button>
        
        SetWindowTitle($w, "default");

        //console.log('creating taskbar tab for window');
        //$('#created_windows').append('<li class="active"><a href="#">default</a></li>');
            
        
        return $w;
    };

    GetTabTitles = function(){
        return $('.window').find('.nav.nav-tabs').find('li').find('a')
                .map(function(){return $(this).text();});
    };

    GetTabsTitlesInWindow = function(hwnd){
        return $(hwnd).find('li a')
                .map(function(){return $(this).text()});
    };

    CreateWindowTab = function(w,title,content){
        console.log("creating ",title);
        
        // button:
        // <li><a href="#tab2primary" data-toggle="tab">Primary 2</a></li>
        if (w.find('.nav.nav-tabs').find('.active').length) {
            w.find('.nav.nav-tabs').append(
                '<li><a href="#'+title+'" role="tab" data-toggle="tab">'+title+'</a></li>');
        } else {
            w.find('.nav.nav-tabs').append(
                '<li class="active"><a href="#'+title+'" role="tab" data-toggle="tab">'+title+'</a></li>');
            SetWindowTitle(w, title);
        }
        
        // Content:
        // <div class="tab-pane fade" id="tab2primary">Primary 2</div>
        if (w.find('.tab-pane.active').length) {
            w.find('.panel-body').find('.tab-content')
                .append('<div class="tab-pane" id="'+title+'">'+content+'</div>');
        } else {
            w.find('.panel-body').find('.tab-content')
                .append('<div class="tab-pane active" id="'+title+'">'+content+'</div>');
        }
        

        $('a[data-toggle="tab"]').click(function(e) {
              //e.target // activated tab
              //e.relatedTarget // previous tab
              SetWindowTitle(w, String(e.target).split('#')[1]);
        })
    };

    GetTabOwner = function(tabtitle){
        var retVal = null;
        GetWindows().each(function(){
            if($.inArray(tabtitle, GetTabsTitlesInWindow(this)) >= 0){
                retVal = this;
            }
        });
        return retVal;
    };
    
    MoveWindowTab = function(oldW,newW,tabTitle){
    };

    // hide the user-created content; we will reference as needed
    $('.wm-window').hide();
    $('.wm-windowtab').hide();

    // show all the default ones first
    var defaultWindows = $(".window.default");

    defaultWindows.each(function() {
        w = $().WM('register', $(this));
    });

    GetWindows().show();
    return;
};
