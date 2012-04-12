var quodsi = require('../quodsi.js')
		
quodsi.set({
	'engine': 'git',
	'link': 'git@github.com:ramitos/blog.git',
	'path': __dirname + '/articles',
	'filetypes': '\.md|\.markdown'
})

setTimeout(function () {
	console.log(quodsi.fetch(10, 0));
}, 10000);