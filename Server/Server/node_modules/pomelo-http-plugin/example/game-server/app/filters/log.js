'use strict';

module.exports = function() {
	return new LogFilter();
}

var LogFilter = function(plugin) {
}

LogFilter.prototype.before = function(req, res, next) {
	console.log('[http request]:', req.method, req.url);
	next();
}

LogFilter.prototype.after = function(req, res, next) {
	console.log('[http response]:', req.method, req.url, res.get('resp'));
	next();
}