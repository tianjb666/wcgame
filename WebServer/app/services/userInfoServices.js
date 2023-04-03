/*
电话：400-187-6838
手机：13682427674 (WX)
QQ: 1718841401
武汉神彩信息技术有限公司  http://nmi.cn/（简称神彩）成立于2016年，是一家集研发、运营和销售为一体的网络彩票软件开发商与运营商。
*/

let dao = require('../dao/commonDao');
let userDao = require('../dao/userDao');
let async = require('async');
let code = require('../constant/code');
let utils = require('../util/utils');
let gameServerConfig = require('../../config/config.js');
let httpServices = require('../services/httpRequestServices');

let service = module.exports;

service.convertMongoUserDataToRedisUserData = function (userData) {
    let redisUserData = {};
    for (let key in userData){
        if (key === '_id') continue;
        if (userData.hasOwnProperty(key)){
            if (typeof userData[key] !== 'string' && key !== '$inc'){
                redisUserData[key] = userData[key].toString();
            }else{
                redisUserData[key] = userData[key];
            }
        }
    }
    return redisUserData;
};

service.convertRedisUserDataToMongoUserData = function (userData) {
    let schema = global.mongoClient['userModel'].schema.tree;
    let redisUserData = {};
    for (let key in userData){
        if (userData.hasOwnProperty(key)){
            let schemaKey = schema[key];
            if (!!schemaKey && !!schemaKey.type && schemaKey.type.name === 'Number'){
                redisUserData[key] = parseFloat(userData[key]);
            }else{
                redisUserData[key] = userData[key];
            }
        }
    }
    return redisUserData;
};