var domain = module.exports;
var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger('pomelo');
var utils = require('../../../util/utils');
var parameterServices = require('../../../services/parameterServices');
var dao = require('../../../dao/commonDao');
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
            logger.debug("connector load parameter finished");
        }
        utils.invokeCallback(cb, err);
    });
};



