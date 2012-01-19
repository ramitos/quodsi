var file = require('file'),
		alfred = require('alfred'),
		watch = require('watch'),
		stringex = require('stringex'),
		moment = require('moment'),
		fs = require('fs'),
		md = require('github-flavored-markdown'),
		d = require('debug')('quodsi');
		require('sugar');



var quodsi = function () {};



quodsi.prototype.set = function (config) {
	d('set');
	
	if(!config || !config.engine || !config.link || !config.path || !config.database) throw new Error('empty or malformed configuration object');
	
	switch (config.engine) {
		case 'dropbox':
			if(!config.filetypes) throw new Error('filetypes not especified');
			this.engine = require('arca').set(config.link, config.filetypes, config.path);
			break;
		case 'git':
			this.engine = require('pull').set(config.link, config.path);
			break;
		default:
			throw new Error(config.engine + ' is not a valid engine');
	}
	
	this.config = config;
	
	alfred.open(this.config.database, function (e, db) {
		if(e) throw e;				
		this.db = db;

		this.entry = this.db.define('entry');
		this.entry.property('title', 'string', {optional: false});
		this.entry.property('date', 'object', {optional: false});
		this.entry.property('filename', 'string', {optional: false});
		this.entry.property('content', 'string', {optional: false});
		
		this.entry.index('title', function (entry) {
			return entry.title;
		});
		
		this.entry.index('filename', function (entry) {
			return entry.filename;
		});
		
		this.entry.index('date', function (entry) {
			return entry.date;
		}, {ordered: true});
		
		this.watch();
		//self.syncEngine();
	}.bind(this));
};



quodsi.prototype.watch = function () {
	d('watch');
		
	watch.createMonitor(this.config.path, this.monitor.bind(this));	
};



quodsi.prototype.monitor = function (monitor) {
	d('monitor');
	
	monitor.on("created", function (file, stat) {
		d('monitor: ' + file + ' created');
		
		this.parseFile(file, function (entry) {
			entry ? this.postEntry(entry) : null;
		}.bind(this));
	}.bind(this));
		
	monitor.on("changed", function (file, current, previous) {
		d('monitor: ' + file + ' changed');
		
		this.parseFile(file, function (entry) {
			entry ? this.putEntry(entry) : null;
		}.bind(this));
	});
	
	monitor.on("removed", function (file, stat) {
		d('monitor: ' + file + ' removed');
		
		this.deleteEntry(file);
	});
	
	this.engine.sync();
};



quodsi.prototype.parseFile = function (file, callback) {
	fs.readFile(file, 'utf-8', function (e, data) {
		if(e) throw e;
		
		if(metadata = data.match(/\{([^}]*)\}/)) {
			metadata = metadata[0];
			var content = data.remove(metadata);
			metadata = JSON.parse(metadata);
			
			(metadata.title && metadata.date) ? callback({
				content: md.parse(content),
				title: stringex.toUrl(metadata.title),
				date: moment(metadata.date),
				filename: file.remove(this.config.path)
			}) : callback(null);	
		}	else callback(null);
	}.bind(this));
};



quodsi.prototype.postEntry = function (entry) {
	d('postEntry: ' + entry.title);
	
	console.log(entry);
	
	this.entry.find({title: {$eq : entry.title}}).all(function(entrys) {
		entrys.isEmpty() ? this.entry.new(entry).save() : null;
	}.bind(this));
};



quodsi.prototype.putEntry = function (entry) {
	
};



quodsi.prototype.deleteEntry = function (file) {
	
};



quodsi.prototype.fetch = function (quantity, page) {};



module.exports = new quodsi();