import sys
import json
import time
import logging

from google.appengine.ext import db
from google.appengine.api import memcache
from handler import Handler
import webapp2

import authentication

class Article(db.Model):
    title = db.StringProperty(required = True) # 500 chars max
    content = db.TextProperty(required = True) 
    score = db.IntegerProperty(required = True)
    last_updated = db.DateTimeProperty(required = True)
    author = db.StringProperty(required = True)
    digest = db.StringProperty(required = True)
    id_ = db.StringProperty(required = True)
    def __str__(self):
        return self.title+' by '+self.author+' score:'+self.score
        
def get_articles():
    '''Return the articles'''
    content = '''<p><span class="udacity-plus-score">17</span><a class="udacity-plus-link" href="http://forums.udacity.com/cs253/questions/24829/anyone-using-what-youve-learned-to-build-something">http://forums.udacity.com/cs253/questions/24829/anyone-using-what-youve-learned-to-build-something</a> by <span class="udacity-plus-author">Sean_udacity</span>. Description:<br/> This page details a number of projects created by Udacians with the knowledge they learned in CS253. Definitely worth a browse!</p><p><span class="udacity-plus-score">13</span><a class="udacity-plus-link"  href="http://forums.udacity.com/cs253/questions/30714/udacity-got-me-a-job">http://forums.udacity.com/cs253/questions/30714/udacity-got-me-a-job</a> by <span class="udacity-plus-author">Tejas Bubane</span>. Description:<br/> The author details landing a job with the knowledge acquired in CS253.</p><p><span class="udacity-plus-score">10</span><a class="udacity-plus-link"  href="http://forums.udacity.com/cs253/questions/24590/finals-few-tips-that-might-save-you-from-hours-of-debugging">http://forums.udacity.com/cs253/questions/24590/finals-few-tips-that-might-save-you-from-hours-of-debugging</a> by <span class="udacity-plus-author">atik</span>. Description:<br/> As the title suggests, some tips to assist in debugging your projects. Might save you a few hours with passing the grading scripts!</p><p><span class="udacity-plus-score">249</span><a class="udacity-plus-link"  href="http://forums.udacity.com/cs253/questions/9973/how-to-use-the-jinja2-template-engine-with-appengine">http://forums.udacity.com/cs253/questions/9973/how-to-use-the-jinja2-template-engine-with-appengine</a> by <span class="udacity-plus-author">voithos</span>. Description:<br/> A detailed guide to using Jinja2, the templating engine bundled with Google App Engine. Useful extension of the brief coverage in CS253 lectures. Extra notes can be found <a class="udacity-plus-link"  href="http://forums.udacity.com/cs253/questions/9973/how-to-use-the-jinja2-template-engine-with-appengine#13119">in this response.</a></p><p><span class="udacity-plus-score">13</span><a class="udacity-plus-link"  href="http://forums.udacity.com/cs253/questions/602/irc-channels-for-udacity-courses">http://forums.udacity.com/cs253/questions/602/irc-channels-for-udacity-courses</a> by <span class="udacity-plus-author">AmberJ</span>. Description:<br/> A list of IRC channels (on Freenode) for current Udacity courses, plus some useful links to using IRC</p><p><span class="udacity-plus-score">91</span><a class="udacity-plus-link"  href="http://forums.udacity.com/cs253/questions/14750/a-couple-helpful-links-for-hw-3">http://forums.udacity.com/cs253/questions/14750/a-couple-helpful-links-for-hw-3</a> by <span class="udacity-plus-author">Steve Huffman</span>. Description:<br/>The CS253 lecturer provides additional material on routing, permalinks and the datastore. Extra permalinking notes can be found <a class="udacity-plus-link" href="http://forums.udacity.com/cs253/questions/14750/a-couple-helpful-links-for-hw-3#15526">in this response</a>.</p>'''
    return content

class ListVotes(Handler):
    def get(self):
        logging.debug('%s'%self.request)
        votes = get_all()
        for vote in votes:
            output = '*%d* %s<br/>\n'%(vote.score, vote.get_link())
            self.write(output)      
        
def get_all():
    key = 'all votes'
    all_votes = memcache.get(key)
    if not all_votes:
        all_votes = update_all()
    return all_votes
        
def update_all():
    # This one will be disabled very soon!
    key = 'all votes'
    query = list(db.GqlQuery('SELECT * FROM Vote WHERE score > :1 ORDER BY score DESC', 0))
    logging.debug('DATASTORE: Retrieving all Votes')
    memcache.set(key, query)
    return query

def get_vote(link):
    key = memcache_key(link)
    vote = memcache.get(key)
    if not vote:
        logging.debug("DATASTORE: Retrieving Vote with link = %s"%link)
        vote = Vote.get_by_key_name(link)
        if not vote: # Non-existent link, create new
            vote = new_vote(link)
        memcache.set(key, vote)
    return vote
    
def memcache_key(link):
    return 'vote/%s'%link

def new_vote(link):
    vote = Vote(key_name=link)
    vote.put()
    logging.debug("DATASTORE: Stored new Vote with link=%s"%vote.key().name())
    # Don't need to set memcache since upvote/devote will do that
    return vote
    
class Vote(db.Model):
    # Each link (URL) is associated with at most one Vote object
    # link is key_name()
    score = db.IntegerProperty(required=False, indexed=True)
    history = db.TextProperty(required=False) # Forward compatible, hopefully 
    
    def upvote(self, user_id):
        self.score = self.score + 1 if self.score else 1
        self.add_history(1, user_id)
        self.store()
            
    def devote(self, user_id):
        self.score = self.score - 1 if self.score else -1
        self.add_history(-1, user_id)
        self.store()
        
    def add_history(self, delta, user_id):
        h = json.loads(self.history) if self.history else []
        h.append((delta, time.mktime(time.gmtime()))) #UTC time in seconds
        self.history = json.dumps(h)
        
    def get_link(self):
        return self.key().name()
    
    def store(self):
        self.put()
        logging.debug("DATASTORE: Stored Vote with link=%s"%self.key().name())
        memcache.set(memcache_key(self.key().name()), self)
        update_all()