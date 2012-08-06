import json
import logging
import urllib

from google.appengine.ext import db
from google.appengine.api import memcache
from handler import Handler
import webapp2

import authentication
import articles
from contents import panels


class GetArticles(Handler):
    def post(self):
        '''Return the articles (nb: uses post due to token inclusion)'''
        logging.debug('%s'%self.request)
        content = articles.get_articles()        
        self.response.headers['Content-Type'] =	'application/json'
        id_token = urllib.unquote(self.request.get('token'))
        user = None
        if id_token and '|' in id_token:
            user = authentication.get_user(id_token)
            if not user: # token has been tampered with or corrupted
                # try panopticlick-style stuff with ip and headers
                user = authentication.new_user(type='standard',
                                      ip=self.request.remote_addr)
                id_token = user.get_hash()
                #user.blackmark()
                # Send new token? If the user does not update the token,
                # then this step will repeat and we end up with lots of fake users :(
        else:
            user = authentication.new_user(type='standard',
                                  ip=self.request.remote_addr)
            id_token = user.get_hash()            
        response = {"content": content, "token": id_token}
        self.write(json.dumps(response))

def strip_hash(text):
    '''Used to strip chained hash-parts from text.
    So url#part1#part2 becomes url#part2'''
    while text.count('#') > 1:
        start = text.index('#')
        end = text.index('#', start+1)
        text = text[0:start]+text[end:]
    return text
           
class UpVote(Handler):
    def post(self):
        '''Upvote an article'''
        self.response.headers['Content-Type'] = 'application/json'
        link = urllib.unquote(self.request.get('link'))
        if link[-1] == '#': # Want to remove ending # 
            link = link[:-1]
        link = strip_hash(link)
        content = "Link needed."
        id_token = ""
        if link:
            content = "Upvote registered for %s"%link
            id_token = urllib.unquote(self.request.get('token'))
            if id_token and '|' in id_token:
                user = authentication.get_user(id_token)
                if user: # Only accept votes from legit tokens
                    user_id = user.get_id()
                    # Check settings and update preferences
                    settings = user.get_settings()
                    if link in settings and settings[link]:
                        user.blackmark() # Link already upvoted, how did they upvote it again?
                    else: # Register upvote
                        articles.get_vote(link).upvote(user_id)
                        user.change_settings(link, True)
        response = {"content": content, "token": id_token}
        self.write(json.dumps(response))

class DeVote(Handler):
    def post(self):
        '''Remove a previous upvote'''
        logging.debug('%s'%self.request)
        self.response.headers['Content-Type'] = 'application/json'
        link = urllib.unquote(self.request.get('link'))
        if link[-1] == '#': # Want to remove ending # 
            link = link[:-1]
        link = strip_hash(link)
        content = "Link needed."
        id_token = ""
        if link:
            content = "Upvote removed for %s"%link
            id_token = urllib.unquote(self.request.get('token'))
            if id_token and '|' in id_token:
                user = authentication.get_user(id_token)
                if user: # Only accept votes from legit tokens
                    id_ = user.get_id()
                    # Check settings and update preferences
                    settings = user.get_settings()
                    if link in settings and not settings[link]:
                        user.blackmark() # Link already devoted, how did they devote it again?
                    else: # Register upvote
                        articles.get_vote(link).devote(id_)
                        user.change_settings(link, False)            
        response = {"content": content, "token": id_token}
        self.write(json.dumps(response))
        
class GetCourseMaterials(Handler):
    # Get all notes for a given course
    def post(self):
        '''Retrieve course notes (nb: uses post due to token inclusion)'''
        logging.debug('%s'%self.request)
        course = urllib.unquote(self.request.get('course'))
        content = urllib.unquote(panels.get_materials(course))
        self.response.headers['Content-Type'] = 'application/json'
        id_token = urllib.unquote(self.request.get('token'))
        user = None
        if id_token and '|' in id_token:
            user = authentication.get_user(id_token)
            if not user: # token has been tampered with or corrupted
                # try panopticlick-style stuff with ip and headers
                user = authentication.new_user(type='standard',
                                      ip=self.request.remote_addr)
                id_token = user.get_hash()
                #user.blackmark()
                # Send new token? If the user does not update the token,
                # then this step will repeat and we end up with lots of fake users :(
        else:
            user = authentication.new_user(type='standard',
                                  ip=self.request.remote_addr)
            id_token = user.get_hash()            
        response = {"content": content, "token": id_token}
        self.write(json.dumps(response))
        
class MakeNote(Handler):
    # Make a note, during testing/setup
    def post(self):
        logging.debug('%s'%self.request)
        course = urllib.unquote(self.request.get('course'))
        content = urllib.unquote(self.request.get('content'))
        hash_link = urllib.unquote(self.request.get('hash_link'))
        id_token = urllib.unquote(self.request.get('token'))
        user = None
        if id_token and '|' in id_token:
            user = authentication.get_user(id_token)
            if not user:
                user = authentication.new_user(type='standard',
                                      ip=self.request.remote_addr)
        else:
            user = authentication.new_user(type='standard',
                                  ip=self.request.remote_addr)
        author_id = user.get_id()
        if course and content and hash_link:
            panels.make_note(course, hash_link, author_id, content)
            logging.debug('Received content: %s'%content)
            self.write("Notes added")
        else:
            self.write("Please add course and content and hash_link")
        
