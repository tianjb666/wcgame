var domain = module.exports;
var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger('pomelo');
var utils = require('../../../util/utils');
var dao = require('../../../dao/commonDao');
var robotManager = require('../domain/robotManager');
var controllerManager = require('../domain/controllerManager');
var async = require('async');
var parameterServices = require('../../../services/parameterServices');

domain.afterStartAll = function () {
    domain.loadParameter();

    robotManager.afterStartAll();
    controllerManager.afterStartAll();
};

domain.beforeShutdown = function (cb) {
    async.series([
        function (cb) {
            robotManager.beforeShutdown(cb);
        },
        function (cb) {
            controllerManager.beforeShutdown(cb);
        }
    ], function () {
        utils.invokeCallback(cb);
    })
};

domain.loadParameter = function (cb) {
    parameterServices.loadGameTypes(function (err) {
        if (!!err){
            logger.error("robot load parameter err:" + err);
        }else{
            logger.debug("robot load parameter finished");
        }
        utils.invokeCallback(cb, err);
    });
};