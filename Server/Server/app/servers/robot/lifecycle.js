var pomelo = require('pomelo');
var async = require('async');
var lifecycleDomain = require('./domain/lifecycleDomain');

module.exports.beforeStartup = function (app, cb) {
    // do some operations before application start up
    console.log(app.curServer.id, 'beforeStartup');
    cb();
};

module.exports.afterStartup = function (app, cb) {
    // do some operations after application start up
    console.log(app.curServer.id, 'afterStartup');
    cb();
};

module.exports.beforeShutdown = function (app, cb) {
    // do some operations before application shutdown down
    console.log(app.curServer.id, 'beforeShutdown');
    console.time('ShutDown' + app.curServer.id);
    async.parallel([
            function(cb){
                lifecycleDomain.beforeShutdown(cb);
            }
        ]
    , function (err, res) {
        console.log('callback in lifecycle and I think this will not hit in pomelo-sync@0.0.3', err, res);
        console.timeEnd('ShutDown' + app.curServer.id);
        cb();
    });
};

module.exports.afterStartAll = function (app) {
    console.log(app.curServer.id, 'afterStartAll');

    lifecycleDomain.afterStartAll();
};
