## Extra Notes

###Authentication:
Some notes about how the authentication scheme works: During first use, the browser requests an identifier token from the app.
The app generates a self-authenticating token and stores the date.
The browser then sends the token back with every upvote for authentication.
When the browser first requests a token, the app decides if this is legitimately a unique user to prevent/reduce abuse of voting.
**Note**: there is a really obvious (token) authentication issue in the current implementation that should have been picked up much earlier.

###User identification:
According to Panopticlick, the following information could be used to identify browsers:
- User Agent
- HTTP_ACCEPT Headers
- Browser plugin details
- Time zone
- Screen resolution and color depth
- System fonts
- Cookies enabled
- Supercookie test

Unfortunately, we're not collecting market research data so we need to be able to accurately identify a user to load their settings.
More on this later.

###Article upvoting
The set of upvoted articles is stored locally using GM_setValue() so that already upvoted articles can be highlighted after page load.

What happens when the upvote button is clicked (apart from the icon being highlighted)?
The server is notified via GM_XHR and records the upvote against the link.

What happens with upvoted items?
They are examined by members of the community, a small description is added and then they are added to the collection of articles.

How is the set of articles determined?
This is yet to be decided on and will depend on community activity.
Ideally we can create a list of "hot links" a la reddit, as well as all-time favourites.
