var logger = require('pomelo-logger').getLogger('pomelo');
let async = require('async');
let lifecycleDomain = require('./domain/lifecycleDomain');

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
    cb();
};

module.exports.afterStartAll = function (app) {
    lifecycleDomain.afterStartAll(function (err) {
        if (!!err){
            console.error('after start all err:' + err);
        }
        app.set('allServerStarted', true);
        logger.info(app.curServer.id, 'afterStartAll');
    });
};
