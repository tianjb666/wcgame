'use strict';
var pomelo = require('pomelo');
var httpPlugin = require('../../');
var path = require('path');

/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'example');


// app configuration
app.configure('development', 'gamehttp', function() {
	app.loadConfig('httpConfig', path.join(app.getBase(), 'config/http.json'));
	app.use(httpPlugin, {
		http: app.get('httpConfig').gamehttp,
	});
	app.use(httpPlugin, {
		http: app.get('httpConfig').gamehttps,
	});

	httpPlugin.filter(require('./app/filters/log')());
	httpPlugin.afterFilter(function(req, res) {
		res.send(res.get('resp'));
	});
});
// start app
app.start();

process.on('uncaughtException', function(err) {
	console.error(' Caught exception: ' + err.stack);
});