import re
import logging

from google.appengine.ext import db
from google.appengine.api import users, memcache
from handler import Handler, SlashRedirect
from webapp2_extras.routes import RedirectRoute, PathPrefixRoute
import webapp2
from webapp2_extras.routes import RedirectRoute, PathPrefixRoute

import articles
import api
from contents import panels

class Main(Handler):
    def get(self):
        logging.debug('%s'%self.request)
        if 'main' in self.request.url:
            self.redirect('/')
        self.render('base.html')
        
def handle_404(request, response, exception):
    Handler(request, response).throw_error(404)

def handle_500(request, response, exception):
    Handler(request, response).throw_error(500)

# Define which urls to handle and how
PAGE_RE = r'((?:[a-zA-Z0-9_-]+/?)*)'
app = webapp2.WSGIApplication(
    [
        #Adding /? after everything allows for an option trailing slash
        RedirectRoute('(.*)//+', SlashRedirect, 'slash-redirect', strict_slash=True), #Strip multiple trailing slashes
        RedirectRoute('/', Main, 'home', strict_slash=False),
        RedirectRoute('/main', Main, 'home', strict_slash=True),
        # API calls:
        PathPrefixRoute('/api', [
            RedirectRoute('/articles/get', api.GetArticles, 'get-articles', strict_slash=True),
            RedirectRoute('/articles/upvote', api.UpVote, 'upvote-article', strict_slash=True),
            RedirectRoute('/articles/devote', api.DeVote, 'downvote-article', strict_slash=True),
            RedirectRoute('/coursematerials/get', api.GetCourseMaterials, 'get-course-materials', strict_slash=True),
            RedirectRoute('/coursematerials/set', api.MakeNote, 'make-note', strict_slash=True) # Testing only
        ]),
        RedirectRoute('/votes', articles.ListVotes, 'list-votes', strict_slash=True), # Testing only
        RedirectRoute('/notes', panels.ListNotes, 'list-notes', strict_slash=True), # Testing only
    ], debug=True)
app.error_handlers[404] = handle_404
app.error_handlers[500] = handle_500