// ==UserScript==

// @name          Udacity Plus

// @namespace     https://udacityplus.appspot.com

// @description   Enhances Udacity lessons

// @match       http*://udacityplus.appspot.com/*
// @match       http*://*.udacity.com/*
// @match       http*://udacity.com/*

// @require       http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js

// @download      https://udacityplus.appspot.com/static/udacityplus.user.js

// @version       0.1.1351

// ==/UserScript==

// Looking at the udacity.com html code there is already a bunch of material there
// that was removed for launch

/*div.uplus-article{ border-bottom: 1px solid gray; }*/
/*To do:
  - Fix caching of materials
  - Have notes go somewhere reasonable
  - Provide a proper article feed
  - Create somewhere to easily edit materials and articles
  - Make stuff look good
  - Change article to be of format {"link": link, "author": author, "description": description}.
    That way all article formatting can be done in-script straight from datastore feed.
  - Consider removing the course subcategory from materials to bring it in line with notes.
    Will mean more bandwidth used when pulling materials from server, so prefer not to.
  - Add a version check function
*/

var path = String(window.location); // full url
var host = window.location.host; // subdomain.domain.tld

if (host.indexOf("udacity.com") != -1) {
    // Create an overlay for articles
    var article_overlay_html = '<div class="uplus" id="article-overlay"></div>';
    GM_addStyle("div.uplus#article-overlay {"+
        "padding: 5px !important;"+
        "display:none; "+
        "position: absolute; "+ // absoulte creates an overlay
        "margin-left: 250px; margin-top: 22px; z-index:100; "+
        "background: #FFFFFF; border: solid 1px #1C78AA; "+
        "font-size: 12px; "+
        "color: black; "+
        "width: 500px; height: auto;} "+//height: 600px;} "+
        "span.uplus-score {color: #1C78AA; font-weight:bold;} "+
        "div.uplus-article {border: 1px solid gray; padding: 5px !important;} "+
        "a.uplus-link {color: #1C78AA; font-weight:bold;} ");
    // Set style of upvote buttons
    GM_addStyle("a.uplus-upvote {"+
        "font-size: 18px;"+
        "border:2px solid #1C78AA;"+
        "background: #FFF no-repeat 4px 5px;"+
        "text-decoration: none;"+
        "border-radius: 5px;"+
        "}\n"+
        "a.uplus-upvote:hover, a.uplus-upvote:focus, a.uplus-upvote.selected {"+
        //"border:2px solid #000000;"+
        "background: #00FF00;}");
        
    // Function to set the content, both in the overlay, if already created,
    // and in the overlay filler html
    function setContent(content) {
        if (typeof content !== "string") {
            content = "<p>An error occurred retrieving the articles."+
            "Please try again or contact the Udacity Plus author</p>";
        }
        article_overlay_html = '<div class="uplus" id="article-overlay">'+content+'</div>';
        jQuery("div.uplus#article-overlay").html(content);    
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

    // Retrieve user token and settings, if stored
    var local_data = GM_getValue("udacity plus settings", false);
    var settings = false;
    var token = false;
    if (local_data) {
        local_data = JSON.parse(local_data);
        if ("settings" in local_data) {
            settings = local_data["settings"];
        } else {
            settings = {};
        }
        if ("token" in local_data) {
            token = local_data["token"];
        }
    } else {
        settings = {};
    }

    function updateSettings() {
        // Makes use of globals (token, settings)
        var storage = {"token": token, "settings": settings};
        GM_setValue('udacity plus settings', JSON.stringify(storage));
    }

    function upvote(link){
        settings[link] = true;
        GM_xmlhttpRequest({
            method: "POST",
            url: "https://udacityplus.appspot.com/api/articles/upvote",
            data: "link="+encodeURIComponent(link)+"&token="+encodeURIComponent(token),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            onload: function(response) {    
                response = JSON.parse(response.responseText); // Check that it worked            
                //console.log("Upvoted: "+link);
                updateSettings();
            }
        });    
    }

    function devote(link){
        settings[link] = false;
        GM_xmlhttpRequest({
            method: "POST",
            url: "https://udacityplus.appspot.com/api/articles/devote",
            data: "link="+encodeURIComponent(link)+"&token="+encodeURIComponent(token),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            onload: function(response) {
                response = JSON.parse(response.responseText);
                //console.log(response["content"]); // Check that it worked
                updateSettings();
            }
        });    
    }

    function isSelected(link){
        if (link in settings && settings[link]) {
            return true;
        } else {
            return false;
        }
    }
    
    retrieval = false; // Testing only

    // Retrieve articles from server
    if (!retrieval && host.indexOf("udacity.com") != -1) {
        // Retrieve data via XHR
        GM_xmlhttpRequest({
            method: "POST",
            url: "https://udacityplus.appspot.com/api/articles/get",
            data: "token="+encodeURIComponent(token),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            onload: function(response) {        
                //console.log(response.responseText); // For testing
                var response = JSON.parse(response.responseText);
                var articles = response["content"]; // articles is an array
                var content = "";
                for (index in articles) {
                    content += '<div class="uplus-article">'+
                        articles[index]+'</div>\n';
                }
                //console.log(content);
                if (!token || token !== response["token"]) {
                    token = response["token"];
                    updateSettings();
                }
                var storage = {"content": content, "timestamp": new Date().getTime()};
                GM_setValue('udacity plus articles', JSON.stringify(storage));
                setContent(content);
            }
        });
    }

    // If clicking outside the article overlay, hide it
    jQuery(document).mouseup(function (event) {
        var container = jQuery("div.uplus#article-overlay");
        if (container.has(event.target).length === 0) {
            container.hide();
        }
    });

    // MATERIALS section
    var materialCache = GM_getValue('udacity plus materials', { });
    var courseMaterial = { }; // associative array of notes for this course
    var course = jQuery("span#top-course-title").text().trim();
    /* Need to find a better way to obtain the course */
    course = window.location.hash.substr(8, 5); // "#Course/cs253/"
        
    //materialCache = { }; // Clears cache for testing
        
    // Materials should be cached for an hour
    // If cache empty or stale, retrieve via AJAX
    if (materialCache !== { }) {
        try {
            materialCache = JSON.parse(materialCache);
            if (course in materialCache) {
                courseMaterial = asJSON[course];
                if ((courseMaterial["timestamp"] + 3600*1000) < new Date().getTime()) {
                    // Cache expires after 1 hour
                    courseMaterial = false;
                }
            } else {
                courseMaterial = false;
            }
        } catch(e) {
            // In case **** happens, e.g. corrupted cache, or format change
            courseMaterial = false;
        }
    }

    // Retrieve materials from server
    if (!courseMaterial && host.indexOf("udacity.com") != -1) {
        // Retrieve data via XHR
        GM_xmlhttpRequest({
            method: "POST",
            url: "https://udacityplus.appspot.com/api/coursematerials/get",
            data: "token="+encodeURIComponent(token)+"&course="+encodeURIComponent(course),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            onload: function(response) {        
                var response = JSON.parse(response.responseText);            
                courseMaterial = response["content"]
                if (!token || token !== response["token"]) { // Update token
                    token = response["token"];
                    updateSettings();
                }
                // Cache material for this course
                courseMaterial["timestamp"] = new Date().getTime();
                materialCache[course] = courseMaterial
                GM_setValue("udacity plus materials", JSON.stringify(materialCache));
                // Add text to field by manually calling hashChanged();
                hashChanged();
            }
        });
    }

    // Update material panel with content for this lesson
    function setMaterialPanel(hashLink) {
        var content = "<p>No extra material available for this lesson, why not add some using the U+ Notes feature?</p>";
        if (typeof courseMaterial !== "object") {
            content = "<p>An error was encountered while loading U+ Materials, please try again.</p>";
        } else if (hashLink in courseMaterial) {
            content = courseMaterial[hashLink];
        }
        jQuery("div#tab-uplus-materials").html(content);    
    }
    
    // NOTES section
    var allNotes = JSON.parse(GM_getValue("udacity plus notes", "{ }")); // This collects notes for every course
    
    // Save the notes
    function saveNotes() {        
        // Get the current notes
        var currentNotes = jQuery("textarea#uplus-notes").val();
        // Get the link these notes are for
        var oldHash = jQuery("textarea#uplus-notes").attr("name");
        if (oldHash) {
            if (oldHash in allNotes && allNotes[oldHash] != currentNotes) {
                // New notes overwrite existing notes
                allNotes[oldHash] = currentNotes;
                // Store notes dict locally
                GM_setValue("udacity plus notes", JSON.stringify(allNotes));
            } else if (currentNotes.length > 0) {
                // Create new (nonblank) entry in allNotes
                allNotes[oldHash] = currentNotes;
                // Store notes dict locally
                GM_setValue("udacity plus notes", JSON.stringify(allNotes));
            } // The checks above prevent unneccessary storing
        }        
    }
    
    // Clear saved notes for a given hash
    function clearNotes() {
        var currentHash = jQuery("textarea#uplus-notes").attr("name");
        // Ensure hash is currently in notes (otherwise we get an error)
        if (currentHash in allNotes) {
            delete allNotes[currentHash];
            GM_setValue("udacity plus notes", JSON.stringify(allNotes));
        }
        jQuery("textarea#uplus-notes").val("");
    }

    // The hash (#) url changed, so try to load new nugget's materials
    function hashChanged() {
        var localHash = window.location.hash;
        // Update materials
        setMaterialPanel(localHash);        
        // Save any notes made
        saveNotes();
        // Update the notes from cache for the new hash
        if (localHash in allNotes) {
            jQuery("textarea#uplus-notes").val(allNotes[localHash]);
        } else {
            jQuery("textarea#uplus-notes").val(""); // Default text
        }
        // Store the new hash in the textarea as the name for future reference
        jQuery("textarea#uplus-notes").attr("name", localHash);
    }
    
    // Ensure notes are saved when leaving the page
    jQuery(window).unload(function(event) {
        saveNotes();
    });
    
} // End Udacity-only section

// Wait for everything to be loaded
window.addEventListener("load", function(e) {    
    // Site is udacityplus.appspot.com:
    if (host.indexOf("udacityplus.appspot.com") != -1) {
        jQuery("a.install_button").html("Udacity Plus is already installed!");
        jQuery("div#install_script").removeAttr("id");
    }
    
    // Site is udacity.com:
    if (host.indexOf("udacity.com") != -1) {        
        // Detect if the local hash address has changed
        window.onhashchange = hashChanged;
        
        // Make the U+ additions more obvious
        GM_addStyle("li.uplus {border: solid 1px #1C78AA;}");  
        
        // SECTION articles    
        var progress_link = jQuery("li.topnav").last();        
        // Clicking default tabs must remove the active state from U+ tabs
        jQuery("a", jQuery("li.topnav")).click(function(event){        
            jQuery("li.topnav.uplus").removeClass("selected");
        });            
        // Create new topnav for articles
        var article_link = progress_link.clone();
        article_link.html('<a href="#">Articles</a>');//article_link.html('<a href="#article-overlay">Articles</a>');
        article_link.addClass("uplus");
        progress_link.after(article_link);        
        article_link.after(article_overlay_html);
        article_overlay = jQuery("div.uplus#article-overlay");
        
        // Add click events:
        article_link.click(function(event){
            article_overlay.show();
            return false;
        });       
        
        // Add U+ upvote functionality
        if (host.indexOf("forums.udacity.com") != -1) {
            var insert = '<a class="uplus-upvote" href="#"'+
                'title="Upvote on Udacity Plus! (Click again to undo)">&nbsp;+&nbsp;</a><br/>&nbsp;<br/>';
            var questionUpVote = jQuery(insert); // Create a new DOM element
            jQuery("div#favorite-count").after(questionUpVote);
            if (isSelected(path)) {
                jQuery(questionUpVote).addClass("selected");
            }
            questionUpVote.click(function(event){
                event.preventDefault();
                if (jQuery(this).hasClass("selected")) {
                    jQuery(this).removeClass("selected");
                    devote(path);
                } else {
                    jQuery(this).addClass("selected");
                    upvote(path);
                }
                this.blur();
            });
            
            jQuery("div.answer").each(function(index){
                var answerUpVote = jQuery(insert);                
                jQuery("a.post-vote.down", this).after(answerUpVote);
                var answerID = jQuery(this).prev("a").attr("name");
                var link = path+"#"+answerID
                if (isSelected(link)) {
                    answerUpVote.addClass("selected");
                }
                answerUpVote.click(function(event){
                    event.preventDefault();
                    if (jQuery(this).hasClass("selected")) {
                        jQuery(this).removeClass("selected");
                        devote(link);
                    } else {
                        jQuery(this).addClass("selected");
                        upvote(link);
                    }
                    this.blur();
                });
            });
        }
        
        // MATERIALS section 
        var tab_supplementary = jQuery('a[href="#tab-follow"]');
        // Create a <LI> for Udacity Plus Materials
        var uplus_materials_tab = tab_supplementary.parent().clone();
        uplus_materials_tab.addClass("uplus");
        var uplus_notes_tab = uplus_materials_tab.clone();
        
        // Clicking default tabs must remove the active state from U+ tabs
        // and also hide U+ panels
        jQuery("a", jQuery("li.ui-state-default")).click(function(event){        
            jQuery("li.ui-state-default.uplus").removeClass(
                "ui-tabs-selected ui-state-active");
            jQuery("div.uplus.ui-tabs-panel").addClass("ui-tabs-hide");
        });
        
        // Change text and link binding for U+ Materials
        jQuery("a", uplus_materials_tab).html("U+ Materials");
        jQuery("a", uplus_materials_tab).attr("href", "#tab-uplus-materials");
        // Add tab:
        tab_supplementary.parent().after(uplus_materials_tab);
        // Create a div area for the content
        jQuery("div#tab-follow").after('<div id="tab-uplus-materials" '+
            'class="ui-tabs-panel ui-widget-content ui-corner-bottom ui-tabs-hide uplus">\n'+
                '<div>\n'+
                    '<span class="pretty-format"><p>Some sample materials here</p></span>\n'+
                '</div>\n'+
            '</div>\n')
        // Add click events:
        jQuery("a", uplus_materials_tab).click(function(event){
            event.preventDefault(); 
            jQuery("li.ui-tabs-selected.ui-state-active"). // Deselects current active tab
                removeClass("ui-tabs-selected ui-state-active");
            jQuery("div.ui-tabs-panel").addClass("ui-tabs-hide"); // Hide all panels
            jQuery(uplus_materials_tab).addClass("ui-tabs-selected ui-state-active");
            jQuery("div#tab-uplus-materials").removeClass("ui-tabs-hide"); // Show materials panel
        });        
        // Add text to field by manually calling hashChanged();
        hashChanged();        
        
        // NOTES section
        // Change text and link binding for U+ Notes
        jQuery("a", uplus_notes_tab).html("U+ Notes");
        jQuery("a", uplus_notes_tab).attr("href", "#tab-uplus-notes");
        // Add tab:
        jQuery(uplus_materials_tab).after(uplus_notes_tab);
        // Create a div area for the content
        jQuery("div#tab-uplus-materials").after('<div id="tab-uplus-notes" '+
            'class="ui-tabs-panel ui-widget-content ui-corner-bottom ui-tabs-hide uplus">\n'+
                '<div>\n'+
                    '<p><textarea id="uplus-notes" rows="8" cols="120"></textarea></p>'+//'<span class="pretty-format"><p>Enter notes here</p></span>\n'+
                    '<div class="button" id="uplus-notes-submit" title="Contribute your notes to the U+ materials pool">Send to U+</div>\n'+//Testing/populating only
                    '<div class="button" id="uplus-notes-clear" title="Clear your saved notes (irreversible)">Clear notes</div>'+
                '</div>\n'+
            '</div>\n')
        // Add click events to tab:
        jQuery("a", uplus_notes_tab).click(function(event){
            event.preventDefault(); 
            jQuery("li.ui-tabs-selected.ui-state-active"). // Deselects current active tab
                removeClass("ui-tabs-selected ui-state-active");
            jQuery("div.ui-tabs-panel").addClass("ui-tabs-hide"); // Hide all panels
            jQuery(uplus_notes_tab).addClass("ui-tabs-selected ui-state-active");
            jQuery("div#tab-uplus-notes").removeClass("ui-tabs-hide"); // Show notes panel
        });
        // Add submit option for button
        /*currently used for testing*/
        jQuery("div#uplus-notes-submit").click(function(event){
            event.preventDefault();
            var content = jQuery("textarea#uplus-notes").val();
            GM_xmlhttpRequest({
                method: "POST",
                url: "https://udacityplus.appspot.com/api/coursematerials/set",
                data: "token="+encodeURIComponent(token)+"&course="+encodeURIComponent(course)+"&content="+encodeURIComponent(content)+
                "&hash_link="+encodeURIComponent(window.location.hash),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                onload: function(response) {        
                    console.log("Sent notes to server: "+response.responseText);
                }
            });
        });
        // Enable clearing of notes
        jQuery("div#uplus-notes-clear").click(function(event){
            clearNotes();
        });
    }    
}, false);
