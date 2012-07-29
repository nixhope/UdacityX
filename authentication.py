import json
import logging

from bcrypt import bcrypt
from google.appengine.ext import db
from google.appengine.api import memcache

def get_user(hashed_id):
    '''Returns a User object, or None if the user is not authenticated'''
    (id_, hexhash) = hashed_id.split('|')
    if id_.isdigit() and check_hash(id_, hexhash):
        key = memcache_key(id_)
        user = memcache.get(key)
        if not user:
            logging.debug("DATASTORE: Retrieving user with id = %s"%id_)
            user = User.get_by_id(int(id_))
            if not user: # Non-existent user_id
                user = "placeholder" # Can't just store false in memcache
            memcache.set(key, user)
        if isinstance(user, User):
            return user
        
def hash_text(text, iters = 2):
    '''Returns a hexhash of the text using bcrypt for n iterations'''
    # I don't actually know how reliable python bcrypt is
    # But compiled version is not an option with GAE
    return bcrypt.hashpw(text, bcrypt.gensalt(iters)).encode('hex')

def check_hash(text, hexhash):
    '''Checks if text matches hexhash'''
    h = hexhash.decode('hex')
    return bcrypt.hashpw(text, h) == h

def new_user(type, ip):
    '''Returns a new user'''
    user = User(type=type, ip=ip)
    user.store()  
    logging.debug("DATASTORE: Stored new user with id = %d"%user.key().id())
    return user

def memcache_key(id_):
    return 'user/%s'%id_
    
class User(db.Model):
    # id is the unique identifier both in db and to browser.
    created = db.DateTimeProperty(auto_now_add = True, required=False)
    settings = db.TextProperty(required = False) # JSON string
    type = db.StringProperty(required = True)
    ip = db.StringProperty(required = False)
    blackcount = db.IntegerProperty(required = False) # Track errors/fraud
    hexhash = db.StringProperty(required = False)
    def get_id(self):
        return self.key().id()
    def get_hash(self):
        return '%d|%s'%(self.key().id(), hash_text(str(self.key().id())))
    def store(self):        
        self.put()
        memcache.set(memcache_key(self.key().id()), self)
    def get_settings(self):
        if self.settings:
            return json.loads(self.settings)
        else:
            return {}
    def change_settings(self, key, value):
        settings = self.get_settings()
        settings[key] = value
        self.settings = json.dumps(settings)
        self.store()
        logging.debug("DATASTORE: Updated user with id = %d"%self.key().id())
    def blackmark(self):
        '''Increases the blackcount'''
        self.blackcount = self.blackcount + 1 if self.blackcount else 1
        