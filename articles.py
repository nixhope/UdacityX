import webapp2
import sys
import md5

from google.appengine.ext import db
from google.appengine.api import memcache
from handler import Handler

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
        
class GetTest(Handler):
    def get(self):
        fn = self.request.get('fn')
        content = '''This page details a number of projects created by Udacians with the knowledge they learned in CS253. Definitely worth a browse'''
        self.response.headers['Content-Type'] =	'text/plain'
        if not fn:
            self.write(content)
        else:
            self.write(fn.replace("content", content))
        
class GetArticles(Handler):
    def get(self):
        '''We're performing some hacky stuff here 
        to get cross-domain content to the user script'''
        content = '''<p><span class="udacity-plus-score">17</span><a class="udacity-plus-link" href="http://forums.udacity.com/cs253/questions/24829/anyone-using-what-youve-learned-to-build-something">http://forums.udacity.com/cs253/questions/24829/anyone-using-what-youve-learned-to-build-something</a> by <span class="udacity-plus-author">Sean_udacity</span>. Description:<br/> This page details a number of projects created by Udacians with the knowledge they learned in CS253. Definitely worth a browse!</p><p><span class="udacity-plus-score">13</span><a class="udacity-plus-link"  href="http://forums.udacity.com/cs253/questions/30714/udacity-got-me-a-job">http://forums.udacity.com/cs253/questions/30714/udacity-got-me-a-job</a> by <span class="udacity-plus-author">Tejas Bubane</span>. Description:<br/> The author details landing a job with the knowledge acquired in CS253.</p><p><span class="udacity-plus-score">10</span><a class="udacity-plus-link"  href="http://forums.udacity.com/cs253/questions/24590/finals-few-tips-that-might-save-you-from-hours-of-debugging">http://forums.udacity.com/cs253/questions/24590/finals-few-tips-that-might-save-you-from-hours-of-debugging</a> by <span class="udacity-plus-author">atik</span>. Description:<br/> As the title suggests, some tips to assist in debugging your projects. Might save you a few hours with passing the grading scripts!</p><p><span class="udacity-plus-score">249</span><a class="udacity-plus-link"  href="http://forums.udacity.com/cs253/questions/9973/how-to-use-the-jinja2-template-engine-with-appengine">http://forums.udacity.com/cs253/questions/9973/how-to-use-the-jinja2-template-engine-with-appengine</a> by <span class="udacity-plus-author">voithos</span>. Description:<br/> A detailed guide to using Jinja2, the templating engine bundled with Google App Engine. Useful extension of the brief coverage in CS253 lectures. Extra notes can be found <a class="udacity-plus-link"  href="http://forums.udacity.com/cs253/questions/9973/how-to-use-the-jinja2-template-engine-with-appengine#13119">in this response.</a></p><p><span class="udacity-plus-score">13</span><a class="udacity-plus-link"  href="http://forums.udacity.com/cs253/questions/602/irc-channels-for-udacity-courses">http://forums.udacity.com/cs253/questions/602/irc-channels-for-udacity-courses</a> by <span class="udacity-plus-author">AmberJ</span>. Description:<br/> A list of IRC channels (on Freenode) for current Udacity courses, plus some useful links to using IRC</p><p><span class="udacity-plus-score">91</span><a class="udacity-plus-link"  href="http://forums.udacity.com/cs253/questions/14750/a-couple-helpful-links-for-hw-3">http://forums.udacity.com/cs253/questions/14750/a-couple-helpful-links-for-hw-3</a> by <span class="udacity-plus-author">Steve Huffman</span>. Description:<br/>The CS253 lecturer provides additional material on routing, permalinks and the datastore. Extra permalinking notes can be found <a class="udacity-plus-link" href="forums.udacity.com/cs253/questions/14750/a-couple-helpful-links-for-hw-3#15526">in this response</a>.</p>'''
        self.response.headers['Content-Type'] =	'text/plain'
        fn = self.request.get('fn')
        if not fn:
            self.write(content)
        else:
            self.write(fn.replace("content", content))