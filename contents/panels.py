import json
import logging
import time
import cgi

from google.appengine.ext import db
from google.appengine.api import memcache
from handler import Handler

def get_materials(course):
    '''Get all the notes for the whole course as a JSON dict'''
    materials = {}
    materials['default'] = '<h3>U+ course notes</h3><p>Some sample notes for testing purposes</p>'
    materials['#Course/cs253/CourseRev/apr2012/Unit/531001/Nugget/568001'] = '<p>Good luck with the final!</p>'
    # materials = '<p>There are no notes for this section on U+<br/>'+\
    #    'Why not use the Notes tab to add some?</p>'
    return materials

def make_note(course, hash_link, author_id, content):
    # add memcache later, but currently no need to retrieve individuals
    note = Note(course=course,
                hash_link=hash_link,
                author_id=author_id,
                content=content)
    note.put()
    update_all()

class ListNotes(Handler):
    def get(self):
        logging.debug('%s'%self.request)
        notes = get_all()
        for note in notes:
            output = "<a href='%s'>%s</a>: %s<hr/>\n"%(note.hash_link, note.hash_link, cgi.escape(note.content))
            self.write(output)      
        
def get_all():
    key = 'all notes'
    all_notes = memcache.get(key)
    if not all_notes:
        all_notes = update_all()
    return all_notes
        
def update_all():
    # This one will be disabled very soon!
    key = 'all notes'
    query = list(db.GqlQuery('SELECT * FROM Note ORDER BY created DESC'))
    logging.debug('DATASTORE: Retrieving all Notes')
    memcache.set(key, query)
    return query
    
class Note(db.Model):
    hash_link = db.StringProperty(required = True)
    course = db.StringProperty(required = True)
    content = db.TextProperty(required = True) 
    created = db.DateTimeProperty(auto_now_add = True)
    author_id = db.IntegerProperty(required = True)