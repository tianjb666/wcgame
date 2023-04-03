'use strict';

module.exports = function(app, http, plugin) {

	if (plugin.useSSL) {

		http.get('/testHttps', function(req, res, next) {
			// console.log(req.body);
			res.set('resp', 'https success');
			next();
		});
	} else {

		http.get('/testHttp', function(req, res, next) {
			// console.log(req.body);
			res.set('resp', 'http success');
			next();
		});
	}
};