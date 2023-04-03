var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger('pomelo');
var utils = require('../util/utils');
var code = require('../constant/code');

var dao = module.exports;

dao.setData = function (key, value, expire, cb) {
    utils.invokeCallback(cb);
};

dao.getData = function (key, cb) {
    utils.invokeCallback(cb);
};

dao.deleteData = function (key, cb) {
    utils.invokeCallback(cb);
};