var pomelo = require('pomelo');
var utils = require('../util/utils');
var code = require('../constant/code');
var enumeration = require('../constant/enumeration');
var async = require('async');
var commonDao = require('./commonDao');
var logger = require('pomelo-logger').getLogger('pomelo');
let userInfoServices = require('../services/userInfoServices');

var dao = module.exports;

let USER_CACHE_DATA_HEAD = "USER_MODEL";

dao.getUserDataByUid = function (uid, cb) {
    // 查询缓存中是否存在
    let redisClient = pomelo.app.get('redisClient');
    redisClient.hgetall(USER_CACHE_DATA_HEAD + uid, function (err, result) {
        if (err){
            utils.invokeCallback(cb, err);
        }else{
            if (!result){
                commonDao.findOneData("userModel", {uid: uid}, function (err, result) {
                    if (err){
                        utils.invokeCallback(cb, err);
                    }else{
                        utils.invokeCallback(cb, null, !!result?result._doc:null);
                    }
                })
            }else{
                utils.invokeCallback(cb, null, userInfoServices.convertRedisUserDataToMongoUserData(result));
            }

        }
    });
};

dao.getUserDataByUidFromCache = function (uid, cb) {
    let redisClient = pomelo.app.get('redisClient');
    redisClient.hgetall(USER_CACHE_DATA_HEAD + uid, function (err, result) {
        utils.invokeCallback(cb, err, !!result?userInfoServices.convertRedisUserDataToMongoUserData(result):null);
    });
};

dao.loadUserDataByUid = function (uid, cb) {
    // 查询缓存中是否存在
    let redisClient = pomelo.app.get('redisClient');
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

// 获取未加锁的用户信息，并且加锁
dao.getUnlockedUserDataWithLock = function (uid, cb) {
    dao.updateUserData(uid, {$inc:{dataLock: 1}}, function (err, result) {
        if (!!err){
            dao.unlockUserData(uid);
            utils.invokeCallback(cb, err);
        }else{
            if (!result){
                dao.unlockUserData(uid);
                utils.invokeCallback(cb, code.HALL.NOT_FIND);
            }else{
                if (result.dataLock <= 1){
                    utils.invokeCallback(cb, null, result);
                }else{
                    dao.unlockUserData(uid);
                    utils.invokeCallback(cb, code.HALL.GOLD_LOCKED);
                }
            }
        }
    });
};

// 解锁用户信息
dao.unlockUserData = function (uid, cb){
    dao.updateUserData(uid, {$inc:{dataLock: -1}}, function (err) {
        if (err){
            console.error(err);
            utils.invokeCallback(cb, code.MYSQL_ERROR);
        }else{
            utils.invokeCallback(cb);
        }
    });
};

// 更新用户信息并解锁
dao.updateUserDataWithUnlock = function (uid, saveData, cb) {
    let redisClient = pomelo.app.get('redisClient');
    redisClient.exists(USER_CACHE_DATA_HEAD + uid, function (err, result) {
        if (!!err){
            utils.invokeCallback(cb, err);
        }else{
            if (result === 1){
                if (!saveData) saveData = {};
                saveData.isUpdate = "true";
                !!saveData.$inc?(saveData.$inc.dataLock = -1):(saveData.$inc = {dataLock: -1});
                redisClient.hsetWithObjThenGet(USER_CACHE_DATA_HEAD + uid, userInfoServices.convertMongoUserDataToRedisUserData(saveData), function (err, res) {
                    utils.invokeCallback(cb, err, !!res?userInfoServices.convertRedisUserDataToMongoUserData(res):null);
                })
            }else{
                commonDao.findOneAndUpdateEx('userModel', {uid: uid}, saveData, {new: true}, function (err, res) {
                    utils.invokeCallback(cb, err, res._doc);
                });
            }
        }

    })
};

dao.updateUserData = function (uid, saveData, cb) {
    let redisClient = pomelo.app.get('redisClient');
    redisClient.exists(USER_CACHE_DATA_HEAD + uid, function (err, result) {
        if (!!err){
            utils.invokeCallback(cb, err);
        }else{
            if (result === 1){
                saveData.isUpdate = "true";
                redisClient.hsetWithObjThenGet(USER_CACHE_DATA_HEAD + uid, userInfoServices.convertMongoUserDataToRedisUserData(saveData), function (err, res) {
                    utils.invokeCallback(cb, err, !!res?userInfoServices.convertRedisUserDataToMongoUserData(res):null);
                })
            }else{
                commonDao.findOneAndUpdateEx('userModel', {uid: uid}, saveData, {new: true}, function (err, res) {
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

dao.getUserDataArr = function (uidArr, cb) {
    let tasks = [];
    let addTack = function(uid){
        tasks.push(function (cb) {
            dao.getUserDataByUid(uid, cb);
        });
    };
    for (let i = 0; i < uidArr.length; ++i){
        addTack(uidArr[i]);
    }
    async.parallel(tasks, function(err, result){
        if (!!err){
            logger.error('getUserDataArr err:' + err);
        }
        cb(null, result);
    })
};

dao.updateCacheUserData = function (uid, saveData, cb) {
    let redisClient = pomelo.app.get('redisClient');
    saveData.isUpdate = "true";
    redisClient.hsetWithObjThenGet(USER_CACHE_DATA_HEAD + uid, userInfoServices.convertMongoUserDataToRedisUserData(saveData), function (err, res) {
        utils.invokeCallback(cb, err, res);
    })
};

dao.updateAllCacheUserData = function (saveData, cb) {
    let redisClient = pomelo.app.get('redisClient');
    redisClient.hsetWithObjThenGet(USER_CACHE_DATA_HEAD + "*", userInfoServices.convertMongoUserDataToRedisUserData(saveData), function (err, res) {
        utils.invokeCallback(cb, err, res);
    })
};

dao.syncAllCacheUseData = function (cb) {
    let redisClient = pomelo.app.get('redisClient');
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
                            if (res.isUpdate === "true"){
                                let userData = userInfoServices.convertRedisUserDataToMongoUserData(res);
                                commonDao.updateData('userModel', {uid: userData.uid}, userData);
                            }
                            if (res.frontendId === ""){
                                redisClient.del(result[i]);
                            }else{
                                if (res.isUpdate === "true"){
                                    redisClient.hset(result[i], "isUpdate", "false");
                                }
                            }
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
    let redisClient = pomelo.app.get('redisClient');
    redisClient.hgetall(USER_CACHE_DATA_HEAD + uid, function (err, result) {
        if (!!err){
            logger.error(err);
            utils.invokeCallback(cb, err);
        }else{
            if (!!result){
                let userData = userInfoServices.convertRedisUserDataToMongoUserData(result);
                if (userData.isUpdate === 'true'){
                    commonDao.updateData('userModel', {uid: userData.uid}, userData);
                }
            }else{
                logger.error("syncCacheUserData error: cache not exist uid=" + uid);
            }
            utils.invokeCallback(cb);
        }
    })
};

dao.getOnlineUserData = function (startIndex, count, cb) {
    let redisClient = pomelo.app.get('redisClient');
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
                        utils.invokeCallback(cb, null, onlineUserDataArr.slice(startIndex, count), onlineUserDataArr.length);
                    }
                })
            }
        }
    })
};