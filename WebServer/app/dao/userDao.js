var utils = require('../util/utils');
var code = require('../constant/code');
var enumeration = require('../constant/enumeration');
var async = require('async');
var commonDao = require('./commonDao');
var logger = console;//require('pomelo-logger').getLogger('pomelo');
let userInfoServices = require('../services/userInfoServices');

var dao = module.exports;

let USER_CACHE_DATA_HEAD = "USER_MODEL";

dao.getUserDataByUid = function (uid, cb) {
    // 查询缓存中是否存在
    let redisClient = global.redisClient;
    redisClient.hgetall(USER_CACHE_DATA_HEAD + uid, function (err, result) {
        if (err){
            utils.invokeCallback(cb, err);
        }else{
            if (!result){
                commonDao.findOneData("userModel", {uid: uid}, function (err, result) {
                    if (err){
                        utils.invokeCallback(cb, err);
                    }else{
                        utils.invokeCallback(cb, null, result);
                    }
                })
            }else{
                utils.invokeCallback(cb, null, userInfoServices.convertRedisUserDataToMongoUserData(result));
            }

        }
    });
};

dao.getUserDataByUidFromCache = function (uid, cb) {
    let redisClient = global.redisClient;
    redisClient.hgetall(USER_CACHE_DATA_HEAD + uid, function (err, result) {
        utils.invokeCallback(cb, err, !!result?userInfoServices.convertRedisUserDataToMongoUserData(result):null);
    });
};

dao.getUserDataArrByUidArrFromCache = function (uidArr, cb) {
    let redisClient = global.redisClient;
    let multi = [];
    for (let i = 0; i < uidArr.length; ++i){
        multi.push(['hgetall', USER_CACHE_DATA_HEAD + uidArr[i]]);
    }
    redisClient.multi(multi, function (err, result) {
        if (err){
            utils.invokeCallback(cb, err);
        }else{
            let arr = [];
            for(let i = 0; i < result.length; ++i){
                if (!!result[i]){
                    arr.push(userInfoServices.convertRedisUserDataToMongoUserData(result[i]));
                }
            }
            utils.invokeCallback(cb, null, arr);
        }
    })
};

dao.loadUserDataByUid = function (uid, cb) {
    // 查询缓存中是否存在
    let redisClient = global.redisClient;
    redisClient.hgetall(USER_CACHE_DATA_HEAD + uid, function (err, result) {
        if (err){
            cb(err);
        }else{
            if (!result){
                commonDao.findOneData("userModel", {uid: uid}, function (err, result) {
                    if (err){
                        utils.invokeCallback(cb, err);
                    }else{
                        if (!result){
                            utils.invokeCallback(cb);
                        }else{
                            redisClient.hmset(USER_CACHE_DATA_HEAD + uid, userInfoServices.convertMongoUserDataToRedisUserData(result._doc), function (err) {
                                utils.invokeCallback(cb, err, result._doc);
                            })
                        }
                    }
                })
            }else{
                utils.invokeCallback(cb, null, userInfoServices.convertRedisUserDataToMongoUserData(result));
            }
        }
    });
};

dao.updateUserData = function (uid, saveData, cb) {
    let redisClient = global.redisClient;
    redisClient.exists(USER_CACHE_DATA_HEAD + uid, function (err, result) {
        if (!!err){
            utils.invokeCallback(cb, err);
        }else{
            if (result === 1){
                redisClient.hsetWithObjThenGet(USER_CACHE_DATA_HEAD + uid, userInfoServices.convertMongoUserDataToRedisUserData(saveData), function (err, res) {
                    utils.invokeCallback(cb, err, !!res?userInfoServices.convertRedisUserDataToMongoUserData(res):null);
                })
            }else{
                commonDao.updateData('userModel', {uid: uid}, saveData, function (err, res) {
                    utils.invokeCallback(cb, err, res._doc);
                });
            }
        }

    })
};

dao.updateUserDataArr = function (saveDataArr, cb) {
    let tasks = [];
    let addTack = function(changeUserData){
        tasks.push(function (cb) {
            let uid = changeUserData.uid;
            delete changeUserData[uid];
            dao.updateUserData(uid, changeUserData, cb);
        });
    };
    for (let i = 0; i < saveDataArr.length; ++i){
        addTack(saveDataArr[i]);
    }

    async.parallel(tasks, function(err, result){
        if (!!err){
            logger.error('batchChangeCurrencyRequest err:' + err);
        }
        cb(null, result);
    })
};

dao.updateCacheUserData = function (uid, saveData, cb) {
    let redisClient = global.redisClient;
    redisClient.hsetWithObjThenGet(USER_CACHE_DATA_HEAD + uid, userInfoServices.convertMongoUserDataToRedisUserData(saveData), function (err, res) {
        utils.invokeCallback(cb, err, res);
    })
};

dao.syncAllCacheUseData = function (cb) {
    let redisClient = global.redisClient;
    redisClient.keys(USER_CACHE_DATA_HEAD + "*", function (err, result) {
        if (!!err){
            logger.error('getAllUserCacheData err:' + JSON.stringify(err));
            utils.invokeCallback(cb, err);
        }else{
            let count = 0;
            for (let i = 0; i < result.length; ++i){
                redisClient.hgetall(result[i], function (err, res) {
                    if (!!err){
                        logger.error(err);
                    }else{
                        if (!!res){
                            let userData = userInfoServices.convertRedisUserDataToMongoUserData(res);
                            commonDao.updateData('userModel', {uid: userData.uid}, userData);
                        }
                    }
                    count++;
                    if (count === result.length){
                        utils.invokeCallback(cb);
                    }
                })
            }
        }
    })
};

dao.syncCacheUserData = function (uid, cb) {
    let redisClient = global.redisClient;
    redisClient.hgetall(USER_CACHE_DATA_HEAD + uid, function (err, result) {
        if (!!err){
            logger.error(err);
            utils.invokeCallback(cb, err);
        }else{
            if (!!result){
                let userData = userInfoServices.convertRedisUserDataToMongoUserData(result);
                commonDao.updateData('userModel', {uid: userData.uid}, userData);
            }else{
                logger.error("syncCacheUserData error: cache not exist uid=" + uid);
            }
            utils.invokeCallback(cb);
        }
    })
};

dao.getOnlineUserData = function (startIndex, count, cb) {
    let redisClient = global.redisClient;
    redisClient.keys(USER_CACHE_DATA_HEAD + "*", function (err, result) {
        if (!!err){
            logger.error(err);
            utils.invokeCallback(cb, err);
        }else{
            if (!result || result.length === 0){
                utils.invokeCallback(cb, null, []);
            }else{
                let multiArr = [];
                for (let i = 0; i< result.length; ++i){
                    multiArr.push(['hgetall', result[i]]);
                }
                redisClient.multi(multiArr, function (err, userDtaArr) {
                    if (!!err){
                        logger.error(err);
                        utils.invokeCallback(cb, err);
                    }else{
                        let onlineUserDataArr = [];
                        for (let i = 0; i < userDtaArr.length; ++i){
                            let userData = userDtaArr[i];
                            if (userData.userOnlineStatus !== enumeration.userOnlineStatus.ON_LINE.toString()) continue;
                            onlineUserDataArr.push(userData);
                        }
                        let arr = onlineUserDataArr.slice(startIndex, count);
                        for (let i = 0; i < arr.length; ++i){
                            arr[i] = userInfoServices.convertRedisUserDataToMongoUserData(arr[i]);
                        }
                        utils.invokeCallback(cb, null, arr, onlineUserDataArr.length);
                    }
                })
            }
        }
    })
};