require('sugar')

var file = require('file'),
    fs = require('fs'),
    path = require('path'),
    watch = require('watch'),
    walker = require('walker'),
    stringex = require('stringex'),
    md = require('github-flavored-markdown')

var quodsi = function () {}

quodsi.prototype.set = function (conf) {
  if(!conf || 
     !conf.engine || 
     !conf.link || 
     !conf.path ||
     (!conf.filetypes && (conf.engine === 'dropbox'))) throw new Error('empty or malformed configuration object')
     
  this.conf = conf
  this.entrys = []
  this.conf.filetypes = new RegExp(this.conf.filetypes)
  
  switch (conf.engine) {
    case 'dropbox':
      //this.engine = require('arca').set(conf.link, conf.filetypes, conf.path)
      console.log('NOT YET FUNCTIONAL');
      break;
    case 'git':
      this.engine = require('../pull').set(conf.link, conf.path, this.walk.bind(this, this.watch.bind(this)))
      break;
    default:
      throw new Error(conf.engine + ' is not a valid engine')
  }
};

quodsi.prototype.walk = function (callback) {
  walker(this.conf.path).filterDir(function (dir, stat) {
    return !dir.has('/.git')
  }).on('file', function (f, stat) {
    this.created(f, stat)
  }.bind(this)).on('end', callback)
}

quodsi.prototype.watch = function () {
  watch.createMonitor(this.conf.path, this.monitor.bind(this))
}

quodsi.prototype.monitor = function (monitor) {
  monitor.on('created', this.created.bind(this))
  monitor.on('changed', this.changed.bind(this))
  monitor.on('removed', this.removed.bind(this))
  this.engine.sync()
}

quodsi.prototype.created = function (f, stat) {
  this.validate(f, stat, this.parseFile.bind(this), function (ent) {
    if(ent) this.postEntry(ent)
  }.bind(this))
}

quodsi.prototype.changed = function (f, curr, prev) {	
  this.validate(f, curr, this.parseFile.bind(this), function (ent) {
    if(ent) this.putEntry(ent)
  }.bind(this))
}

quodsi.prototype.removed = function (f, stat) {
  this.validate(file, stat, this.deleteEntry.bind(this));
}

quodsi.prototype.validate = function (f, stat, callback, cb) {
  var t = path.extname(f).has(this.conf.filetypes)
  if(stat.isFile() && path.extname(f).has(this.conf.filetypes)) callback(f, cb.bind(this))
}

quodsi.prototype.parseFile = function (f, callback) {
  fs.readFile(f, 'utf-8', function(e, d) {
    if (e) throw e
    
    var mtd = d.match(/\{([^}]*)\}/)
    if(!mtd) return callback(null)
    var c = d.remove(mtd[0])
    mtd = JSON.parse(mtd[0])
    
    if(mtd.title && mtd.date) return callback({
      content: md.parse(c),
      title: stringex.toUrl(mtd.title),
      date: mtd.date.toDate(),
      filename: f.remove(this.conf.path + '/')
    })
    callback(null)
  }.bind(this))
}

quodsi.prototype.postEntry = function (ent) {
  var exists = this.entrys.findAll(function (e) {
    return e.title === ent.title
  }).isEmpty()
  
  if(exists) {
    this.entrys.push(ent)
    this.sort()
  }
}

quodsi.prototype.putEntry = function (ent) {
  this.entrys = this.entrys.exclude(function (e) {
    return e.title = ent.title
  })

  this.entrys.push(ent)
  this.sort()
}

quodsi.prototype.deleteEntry = function (f) {
  this.entrys = this.entrys.exclude(function (e) {
    return e.filename = f
  })

  this.sort()
}

quodsi.prototype.sort = function () {
  this.entrys.sortBy(function (e) {
    return e.date;
  })
}

quodsi.prototype.fetch = function (qty, pg) {
  return this.entrys.inGroupsOf(qty)[pg].compact(true);
}

quodsi.prototype.sync = function () {
  this.engine.sync()
}

module.exports = new quodsi()