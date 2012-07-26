import webapp2
import re

from google.appengine.ext import db
from google.appengine.api import users, memcache
from handler import Handler, ErrorHandler, SlashRedirect
import articles

def validate_cookie():
    '''validate using s|HMAC(secret, s)'''
    pass

def validate_password():
    '''Store name, hash(password+salt), salt'''
    pass

class Main(Handler):
    def get(self):
        if 'main' not in self.request.url:
            self.redirect('/main')
        self.render('base.html')

# Define which urls to handle and how
PAGE_RE = r'((?:[a-zA-Z0-9_-]+/?)*)'
app = webapp2.WSGIApplication([
        #Adding /? after everything allows for an option trailing slash
        ('(.*)//+', SlashRedirect), #Strip multiple trailing slashes
        ('/', Main),
        ('/main', Main),
        ('/api/articles/get', articles.GetArticles),
        ('/api/articles/test', articles.GetTest),
        ('/(.*)', ErrorHandler)
        ], debug=True)