var domain = module.exports;
var logger = require('pomelo-logger').getLogger('pomelo');
var utils = require('../../../util/utils');
var parameterServices = require('../../../services/parameterServices');
let async = require('async');

domain.afterStartup = function (cb) {
    utils.invokeCallback(cb);
};

domain.afterStartAll = function (cb) {
    domain.loadParameter(cb);
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
            logger.error("game load parameter err:" + err);
        }else {
            logger.debug("game load parameter finished");
        }
        utils.invokeCallback(cb, err);
    });
};




