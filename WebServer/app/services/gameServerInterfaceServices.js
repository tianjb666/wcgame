let dao = require('../dao/commonDao');
let userDao = require('../dao/userDao');
let async = require('async');
let code = require('../constant/code');
let utils = require('../util/utils');
let gameServerConfig = require('../../config/config.js');
let httpServices = require('../services/httpRequestServices');

let service = module.exports;

service.updateUserDataNotify = function (uid, updateKeys, cb) {
    let url = gameServerConfig.gameHttpAddress + '/updateUserDataNotify';
    httpServices.httpPost(url, {uid: uid, updateKeys: updateKeys}, function (err) {
        utils.invokeCallback(cb, err);
    })
};

service.reloadParameterNotify = function (updateKeys, cb) {
    let url = gameServerConfig.gameHttpAddress + '/reloadParameterNotify';
    httpServices.httpPost(url, {updateKeys: updateKeys}, function (err) {
        utils.invokeCallback(cb, err);
    })
};

service.retransmissionToGameServer = function (route, data, cb) {
    let url = gameServerConfig.gameHttpAddress + '/' + route;
    httpServices.httpPost(url, data, function (err, data) {
        utils.invokeCallback(cb, err, data);
    })
};