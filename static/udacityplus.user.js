// ==UserScript==

// @name          Udacity Plus Viewer

// @namespace     http://udacityplus.appspot.com

// @description   Enhances Udacity lessons

// @include       http*://udacityplus.appspot.com/*
// @include       http*://*.udacity.com/*
// @include       http*://udacity.com/*

// @require       http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js

// @download      https://udacityplus.appspot.com/static/udacityplus.user.js

// @version       0.0.1027

// ==/UserScript==

// Looking at the source code there is already a bunch of material there
// that was removed for launch

// @require http://courses.ischool.berkeley.edu/i290-4/f09/resources/gm_jq_xhr.js 

var path = window.location // full url
var host = window.location.host // subdomain.domain.tld

// Create an overlay for articles
var article_overlay_html = '<div class="udacity-plus" id="article-overlay"></div>'
GM_addStyle("div.udacity-plus#article-overlay {"+
    "display:none; "+
    //"position:relative;"+ // relative creates a new space
    "position: absolute; "+ // absoulte creates an overlay
    "margin-left: -1px; margin-top: 0px; z-index:100; "+
    "background: #FFFFFF; border: solid 1px #1C78AA; "+
    "font-size: 12px; "+
    "color: black; "+
    "width: 500px; height: 600px;} "+
    "span.udacity-plus-score {color: #1C78AA; font-weight:bold;} "+
    "a.udacity-plus-link {padding: 0px; border: none;} ");  

// Put content into the article overlay
/* Because from GreaseMonkey we can't access the jsonp returned, we have to do something special.
If we have control of the structure of the API, we canget the API to return code (instead of JSON)
which can then be executed on the default DOM. It won't have access to any of the custom elements
or functions of this script because they are sandboxed. To obtain information we can *insert it
elsewhere* and then *steal it with our script* 
*/

jQuery.ajax({
    dataType: "jsonp",
    //url: "http://ds-ex.codemonki.es/jsonp",
    url: "https://udacityplus.appspot.com/api/articles/get",
    data: {fn: 'var head = document.getElementsByTagName("head")[0]; '+ 
    'head.innerHTML += \'<ninjatag id="udacityplus">content</ninjatag>\''},
    // The remote API will add the content
    success: function(data) {},
    error: function(data){
        var ninjatag = jQuery("ninjatag#udacityplus")
        var content = ninjatag.html();
        jQuery("div.udacity-plus#article-overlay").append(content);
        article_overlay_html = '<div class="udacity-plus" id="article-overlay">'+content+'</div>';
        ninjatag.remove(); // Or was it never there to begin with?
    }
});

jQuery(document).mouseup(function (event) {
    var container = jQuery("div.udacity-plus#article-overlay");
    if (container.has(event.target).length === 0) {
        container.hide();
    }
});


// Wait for everything to be loaded
window.addEventListener("load", function(e) {    
    // udacityplus.appspot.com:
    if (host.indexOf("udacityplus.appspot.com") != -1) {
        jQuery("a.install_button").html("Udacity Plus is already installed!");
        jQuery("div#install_script").removeAttr("id");
    }
    
    //Udacity.com stuff:
    if (host.indexOf("udacity.com") != -1) {        
        // Make the U+ additions more obvious
        GM_addStyle("li.udacity-plus {border: solid 1px #1C78AA;}");  
        
        // SECTION articles    
        var progress_link = jQuery("li.topnav").last();        
        // Clicking default tabs must remove the active state from U+ tabs
        jQuery("a", jQuery("li.topnav")).click(function(event){        
            jQuery("li.topnav.udacity-plus").removeClass("selected");
        });            
        // Create new topnav for articles
        var article_link = progress_link.clone();
        article_link.html('<a href="#">Articles</a>');//article_link.html('<a href="#article-overlay">Articles</a>');
        article_link.addClass("udacity-plus");
        progress_link.after(article_link);        
        article_link.append(article_overlay_html);
        article_overlay = jQuery("div.udacity-plus#article-overlay");
        
        // Add click events:
        article_link.click(function(event){
            article_overlay.show();
        });       
        
        // SECTION materials    
        var tab_supplementary = jQuery('a[href="#tab-follow"]');
        // Create a <LI> for Udacity Plus Materials
        var uplus_materials_tab = tab_supplementary.parent().clone();
        uplus_materials_tab.addClass("udacity-plus");
        var uplus_discussion_tab = uplus_materials_tab.clone();
        
        // Clicking default tabs must remove the active state from U+ tabs
        jQuery("a", jQuery("li.ui-state-default")).click(function(event){        
            jQuery("li.ui-state-default.udacity-plus").removeClass(
                "ui-tabs-selected ui-state-active");
        });
        
        // Change text and link binding
        jQuery("a", uplus_materials_tab).html("Udacity Plus Materials");
        jQuery("a", uplus_materials_tab).attr("href", "#tab-uplus-materials");
        // Add tab:
        tab_supplementary.parent().after(uplus_materials_tab);
        // Add click events:
        jQuery("a", uplus_materials_tab).click(function(event){
            event.preventDefault(); 
            jQuery("li.ui-tabs-selected.ui-state-active"). // Deselects current active class
                removeClass("ui-tabs-selected ui-state-active");
            jQuery(uplus_materials_tab).addClass("ui-tabs-selected ui-state-active");
        });
        
        // Change text and link binding
        jQuery("a", uplus_discussion_tab).html("Udacity Plus Discussion");
        jQuery("a", uplus_discussion_tab).attr("href", "#tab-uplus-discussion");
        // Add tab:
        jQuery(uplus_materials_tab).after(uplus_discussion_tab);
        // Add click events:
        jQuery("a", uplus_discussion_tab).click(function(event){
            event.preventDefault(); 
            jQuery("li.ui-tabs-selected.ui-state-active"). // Deselects current active class
                removeClass("ui-tabs-selected ui-state-active");
            jQuery(uplus_discussion_tab).addClass("ui-tabs-selected ui-state-active");
        });
    }
    
}, false);
