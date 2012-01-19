var alfred = require('alfred'),
		d = require('d').set('db', 'red', 'development')
		
alfred.open(__dirname + '/.db/', function(e, _db) {
	if (e) {
		d.l('error opening db', 'error');
		throw e;
	} else {
		d.l('db successfully opened');
	}

	db = _db;

	article = db.define('article');
	article.property('title', 'string', {optional: false});
	article.property('date', 'object', {optional: false});
	article.property('md5', 'string', {optional: false});
	article.property('filename', 'string', {optional: false});
	article.property('article', 'string', {optional: false});

	article.index('title', function(article) {
		return article.title;
	});	
	article.index('md5', function(article) {
		return article.md5;
	});
	article.index('date', function(article) {
		return article.date;
	}, {ordered: true});

	d.l('models set');
	
	// article.find({date: {$range: {$start: null, $end: null}}}).all(function (articles) {
	// 	console.log(articles);
	// });
	
	// article.find({date: {$range: {$start: null, $end: null}}}).stream(function (stream) {
	// 	stream.on('record', function(key, record) {
	// 	  console.log('record');
	// 	});
	// 	
	// 	stream.on('error', function(err) {
	// 	  throw(err);
	// 	});
	// 	
	// 	stream.on('end', function() {
	// 	  console.log('ended');
	// 	});
	// });
});