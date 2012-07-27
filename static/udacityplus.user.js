// ==UserScript==

// @name          Udacity Plus

// @namespace     https://udacityplus.appspot.com

// @description   Enhances Udacity lessons

// @match       http*://udacityplus.appspot.com/*
// @match       http*://*.udacity.com/*
// @match       http*://udacity.com/*

// @require       http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js

// @download      https://udacityplus.appspot.com/static/udacityplus.user.js

// @version       0.1.1027

// ==/UserScript==

// Looking at the udacity.com html code there is already a bunch of material there
// that was removed for launch

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

// Function to set the content, both in the overlay, if already created,
// and in the overlay filler html
var setContent = function(content) {
    if (typeof content !== "string") {
        content = "<p>An error occurred retrieving the articles."+
        "Please try again or contact the Udacity Plus author</p>";
    }
    article_overlay_html = '<div class="udacity-plus" id="article-overlay">'+content+'</div>';
    jQuery("div.udacity-plus#article-overlay").html(content);    
}

// Articles should be cached for an hour
// Get content (via ajax or from storage) and put it into the article overlay
var retrieval = GM_getValue('udacity plus articles', false);
if (retrieval) {
    try {
        var asJSON = JSON.parse(retrieval);
        if ((asJSON["timestamp"] + 3600*1000) < new Date().getTime()) {
            // Cache expires after 1 hour
            retrieval = false;
        } else {
            setContent(asJSON["content"]);
        }
    } catch(e) {
        // In case **** happens, e.g. corrupted cache
        retrieval = false;
    }    
}    
if (!retrieval && host.indexOf("udacity.com") != -1) {
    // Retrieve data via XHR
    GM_xmlhttpRequest({
        method: "GET",
        url: "https://udacityplus.appspot.com/api/articles/get?fn=content",
        onload: function(response) {        
            var content = response.responseText;
            var storage = {"content": content, "timestamp": new Date().getTime()};
            GM_setValue('udacity plus articles', JSON.stringify(storage));
            setContent(content);
        }
    });
}		

jQuery(document).mouseup(function (event) {
    var container = jQuery("div.udacity-plus#article-overlay");
    if (container.has(event.target).length === 0) {
        container.hide();
    }
});

// Wait for everything to be loaded
window.addEventListener("load", function(e) {    
    // Site is udacityplus.appspot.com:
    if (host.indexOf("udacityplus.appspot.com") != -1) {
        jQuery("a.install_button").html("Udacity Plus is already installed!");
        jQuery("div#install_script").removeAttr("id");
    }
    
    // Site is udacity.com:
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
