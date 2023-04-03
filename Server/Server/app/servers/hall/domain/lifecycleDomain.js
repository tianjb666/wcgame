var domain = module.exports;
var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger('pomelo');
var utils = require('../../../util/utils');
var parameterServices = require('../../../services/parameterServices');
var async = require('async');
let matchServices = require('../../../services/matchServices');

domain.afterStartAll = function (cb) {
    // 初始化匹配服务
    matchServices.init();

    domain.loadParameter(cb);
};

domain.beforeShutdown = function () {
    matchServices.deInit();
};

domain.loadParameter = function (cb) {
    async.parallel([
        function (cb) {
            parameterServices.loadGameTypes(cb);
        },
        function (cb) {
            parameterServices.loadAgentProfitConfig(cb);
        },
        function (cb) {
            parameterServices.loadPublicParameter(cb);
        }
    ], function (err) {
        if (!!err){
            logger.error("hall load parameter err:" + err);
        }else{
            logger.debug("hall load parameter finished");
        }
        utils.invokeCallback(cb, err);
    });
};