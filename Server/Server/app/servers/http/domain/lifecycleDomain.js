let domain = module.exports;

let logger = require('pomelo-logger').getLogger('pomelo');
let utils = require('../../../util/utils');
let parameterServices = require('../../../services/parameterServices');
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
            parameterServices.loadPublicParameter(cb);
        },
        function (cb) {
            parameterServices.loadGameTypes(cb);
        },
        function (cb) {
            parameterServices.loadAgentProfitConfig(cb);
        }
    ], function (err) {
        if (!!err){
            logger.error('after start up error:' + JSON.stringify(err));
        }else{
            logger.debug("http load parameter finished");
        }
        utils.invokeCallback(cb, err);
    });
};