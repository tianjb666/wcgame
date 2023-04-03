var pomelo = require('pomelo');
var async = require('async');
var logger = require('pomelo-logger').getLogger('pomelo');
var lifecycleDomain = require('./domain/lifecycleDomain');

module.exports.beforeStartup = function (app, cb) {
    // do some operations before application start up
    logger.info(app.curServer.id, 'beforeStartup');
    cb();
};

module.exports.afterStartup = function (app, cb) {
    // do some operations after application start up
    logger.info(app.curServer.id, 'afterStartup');
    cb();
};

module.exports.beforeShutdown = function (app, cb) {
    // do some operations before application shutdown down
    logger.info(app.curServer.id, 'beforeShutdown');
    console.time('ShutDown' + app.curServer.id);

    console.timeEnd('ShutDown' + app.curServer.id);

    cb();
};

module.exports.afterStartAll = function (app) {
    logger.info(app.curServer.id, 'afterStartAll');

    lifecycleDomain.afterStartAll(function(){
        logger.info(app.curServer.id, 'loadPublicParameter finished');
    });
};
