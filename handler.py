import logging
import os

import webapp2
from google.appengine.ext import db
import jinja2

class Handler(webapp2.RequestHandler):
    '''Creates a base handler and adds jinja2 templates'''
    template_dir = os.path.join(
            os.path.dirname(__file__), 'templates')
    jinja_env = jinja2.Environment(
        loader = jinja2.FileSystemLoader(template_dir),
        autoescape = True)
    
    def write(self, *a, **kw):
        '''Writes directly to the http request'''
        #logging.debug("%s: %s\n%s" % ('ip', self.request.remote_addr, self.request))
        self.response.out.write(*a, **kw)
        
    def render_str(self, template, **params):
        '''Returns a string of the rendered template'''
        t = self.jinja_env.get_template(template)
        return t.render(params)
        
    def render(self, template, **kw):
        '''Render using the template and parameters'''
        self.write(self.render_str(template, _url=self.request.url, **kw))
        
    def throw_error(self, code):
        '''Throws an error, e.g. 404'''
        # Error code is logged and a message is displayed
        # GAE should log sufficient details for debugging
        self.response.set_status(code)
        logging.exception(code)
        message = 'An error was encountered. Terribly sorry.'
        if code == 403:
            message = 'Access denied. You do not have permission to access this resource. '\
                'You may need to log in on an account with sufficient access rights.'
        if code == 404:
            message = 'The page or resource you requested could not be found. '\
                'If you caught a broken link, please report it.'
        if code == 500:
            message = 'Something appears to have gone horribly wrong at our end '\
                'and the server has gone kaput.'        
        self.render('error.html', errorcode=code, errormessage=message)		
        
class SlashRedirect(Handler):
    '''Removes multiple trailing slashes and redirects'''
    def get(self, path):
        self.redirect(path)