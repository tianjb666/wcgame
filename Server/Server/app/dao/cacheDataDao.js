var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger('pomelo');
var utils = require('../util/utils');
var code = require('../constant/code');

var dao = module.exports;

dao.setData = function (key, value, cb) {
    let redisClient = pomelo.app.get('redisClient');
    redisClient.set(key, value, function (err) {
        utils.invokeCallback(cb, err);
    });
};

dao.getData = function (key, cb) {
    let redisClient = pomelo.app.get('redisClient');
    redisClient.get(key, function (err, result) {
        utils.invokeCallback(cb, err, result);
    });
};

dao.deleteData = function (key, cb) {
    utils.invokeCallback(cb);
};