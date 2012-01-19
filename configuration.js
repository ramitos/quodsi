var file = require('file');

module.exports = {
	'engine': 'dropbox',
	'link': 'https://www.dropbox.com/s/i3nu0semiguzh98',
	'path': file.path.join(__dirname, 'articles'),
	'database': file.path.join(__dirname, 'db'),
	'filetypes': '\.md|\.markdown'
}