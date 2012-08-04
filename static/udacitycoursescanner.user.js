// ==UserScript==

// @name            Udacity Course Scanner

// @namespace       https://udacityplus.appspot.com

// @description     Converts a Udacity lesson page into a dict that maps nugget hrefs to lessons

// @match           http*://*.udacity.com/*
// @match           http*://udacity.com/*

// @require         http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js

// @download        https://udacityplus.appspot.com/static/udacitycoursescanner.user.js

// @version         1.0.1028

// ==/UserScript==

// Once page has loaded, click mouse to show the dict.

var clicked = false;

// Escape '
var escape = function(text) {
    text = text.replace("\\", "\\\\");
    text = text.replace("'", "\\'");
    return text;
}

window.addEventListener("load", function(e) {
    jQuery(document).mouseup(function (event) {
        if (!clicked) {
            clicked = true;
            var c = "LINKS = ";
            c +=("{<br/>");
            var course = "&nbsp;&nbsp;&nbsp;&nbsp;'course': '"+$("span#top-course-title").text().trim()+"',<br/>";
            c += course;
            var lessons = ""
            $("div.unit-name").each(function(i, e){
                var unit = $(e).text().trim();
                // Grab contents of each item
                var list = $(e).next();			
                $("li", $(list)).each(function(lesson_number, element){
                    var lesson = $("a", $(element));
                    var lesson_link = lesson.attr("href");
                    var lesson_title = escape(lesson.text().trim());
                    var lesson_details = "{'unit': '"+unit+"', "+
                        "'number': "+(lesson_number+1)+", "+
                        "'title': '"+lesson_title+"'}";
                    var text = "&nbsp;&nbsp;&nbsp;&nbsp;'"+lesson_link+"':"+lesson_details+",<br/>";
                    lessons += text;
                });
            });
            c += lessons.substring(0, lessons.length-(",<br/>".length));
            c += ("<br/>}");
            $("body").html(c);
        }
    });
});