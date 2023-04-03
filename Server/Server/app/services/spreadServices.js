let utils = require('../util/utils');
let async = require('async');
let code = require('../constant/code');
let dao = require('../dao/commonDao');
let userDao = require('../dao/userDao');
let logger = require('pomelo-logger').getLogger('pomelo');
let userInfoServices = require('./userInfoServices');
let pomelo = require("pomelo");

let services = module.exports;

services.updateMemberAchievement = function (uid, count, cb) {
    services.addDirectlyMemberAchievement(uid, count, cb);
};

services.addDirectlyMemberAchievement = function(uid, count, cb) {
    if (typeof count !== 'number' || count <= 0){
        logger.error("addDirectlyMemberAchievement count err, count:" + count);
        utils.invokeCallback(cb);
        return;
    }
    if (!uid){
        logger.error("addDirectlyMemberAchievement uid err, uid:" + uid);
        utils.invokeCallback(cb, code.INVALID_PARAM);
    }
    let userData = null;
    async.series([
        function (cb) {
            userDao.getUserDataByUid(uid, function (err, result) {
                if (!!err){
                    cb(err);
                }else{
                    if (!result){
                        cb(code.HALL.NOT_FIND);
                    }else{
                        userData = result;
                        cb();
                    }
                }
            })
        },
        function (cb) {
            let updateUserData = {
                $inc: {
                    directlyMemberAchievement: count
                }
            };
            userDao.updateUserData(uid, updateUserData, function (err, res) {
                if (!!err){
                    cb(err);
                }else{
                    if (!!res.frontendId){
                        userInfoServices.updateUserDataNotify(uid, res.frontendId, {directlyMemberAchievement: res.directlyMemberAchievement});
                    }
                    if (!!res.spreaderID && res.spreaderID.length > 0){
                        let achievement = res.directlyMemberAchievement + res.agentMemberAchievement;
                        let lowerAgentCommisionChange = services.getCommisionChangeValue(achievement - count, achievement);
                        services.addAgentMemberAchievement(res.spreaderID, count, lowerAgentCommisionChange, function (err) {
                            if (!!err){
                                logger.error("addDirectlyMemberAchievement addAgentMemberAchievement err, count:" + count);
                            }
                            utils.invokeCallback(cb, err);
                        })
                    }
                }
            })
        }
    ], function (err) {
        utils.invokeCallback(cb, err);
    });
    /*
    let user = pomelo.app.hallManager.getUserByUid(uid);
    if (!!user){
        let updateUserData = {
            uid: uid,
            "directlyMemberAchievement": user.userDetailData.directlyMemberAchievement + count,
        };
        user.updateUserData(updateUserData);
        userInfoServices.updateUserDataNotify(user, updateUserData);
        if (!!user.userDetailData.spreaderID){
            let achievement = user.userDetailData.directlyMemberAchievement + user.userDetailData.agentMemberAchievement;
            let lowerAgentCommisionChange = this.getCommisionChangeValue(achievement - count, achievement);
            services.addAgentMemberAchievement(user.userDetailData.spreaderID, count, lowerAgentCommisionChange, function (err) {
                if (!!err){
                    logger.error("addDirectlyMemberAchievement addAgentMemberAchievement err, count:" + count);
                }
                utils.invokeCallback(cb, err);
            })
        }
    }else{
        dao.findOneAndUpdateEx("userModel", {uid: uid}, {$inc: {"directlyMemberAchievement": count}},{new: true}, function (err, result) {
            if (!!err){
                logger.error("addDirectlyMemberAchievement updateData err, count:" + count);
                utils.invokeCallback(cb, err);
            }else{
                if (!!result && !!result.spreaderID){
                    let achievement = result.directlyMemberAchievement + result.agentMemberAchievement;
                    let lowerAgentCommisionChange = services.getCommisionChangeValue(achievement - count, achievement);
                    services.addAgentMemberAchievement(result.spreaderID, count, lowerAgentCommisionChange, function (err1) {
                        if (!!err){
                            logger.error("addDirectlyMemberAchievement addAgentMemberAchievement err, count:" + count);
                        }
                        utils.invokeCallback(cb, err1);
                    })
                }else{
                    utils.invokeCallback(cb);
                }
            }
        });
    }
    */
};

services.addAgentMemberAchievement = function (uid, count, lowerAgentCommisionChange, cb) {
    if (typeof count !== 'number' || count <= 0){
        logger.error("addAgentMemberAchievement count err, count:" + count);
        utils.invokeCallback(cb);
        return;
    }
    if (!uid){
        logger.error("addAgentMemberAchievement uid err, uid:" + uid);
        utils.invokeCallback(cb, code.INVALID_PARAM);
    }
    let userData = null;
    async.series([
        function (cb) {
            userDao.getUserDataByUid(uid, function (err, result) {
                if (!!err){
                    cb(err);
                }else{
                    if (!result){
                        cb(code.HALL.NOT_FIND);
                    }else{
                        userData = result;
                        cb();
                    }
                }
            })
        },
        function (cb) {
            let updateUserData = {
                $inc: {
                    agentMemberAchievement: count,
                    thisWeekLowerAgentCommision: lowerAgentCommisionChange
                }
            };
            userDao.updateUserData(uid, updateUserData, function (err, res) {
                if (!!err){
                    cb(err);
                }else{
                    if (!!res.frontendId){
                        userInfoServices.updateUserDataNotify(uid, res.frontendId, {agentMemberAchievement: res.agentMemberAchievement, thisWeekLowerAgentCommision: res.thisWeekLowerAgentCommision});
                    }
                    if (!!res.spreaderID && res.spreaderID.length > 0){
                        let achievement = res.directlyMemberAchievement + res.agentMemberAchievement;
                        let lowerAgentCommisionChange1 = services.getCommisionChangeValue(achievement - count, achievement);
                        services.addAgentMemberAchievement(res.spreaderID, count, lowerAgentCommisionChange1, function (err) {
                            if (!!err){
                                logger.error("addAgentMemberAchievement addAgentMemberAchievement err, count:" + count);
                            }
                            utils.invokeCallback(cb, err);
                        })
                    }
                }
            })
        }
    ], function (err) {
        utils.invokeCallback(cb, err);
    });
    /*
    let user = pomelo.app.hallManager.getUserByUid(uid);
    if (!!user){
        let updateUserData = {
            uid: uid,
            "agentMemberAchievement": user.userDetailData.agentMemberAchievement + count,
            "thisWeekLowerAgentCommision": user.userDetailData.thisWeekLowerAgentCommision + lowerAgentCommisionChange
        };
        user.updateUserData(updateUserData);
        userInfoServices.updateUserDataNotify(user, updateUserData);
        if (!!user.userDetailData.spreaderID){
            let achievement = user.userDetailData.directlyMemberAchievement + user.userDetailData.agentMemberAchievement;
            let lowerAgentCommisionChange1 = this.getCommisionChangeValue(achievement - count, achievement);
            services.addAgentMemberAchievement(user.userDetailData.spreaderID, count, lowerAgentCommisionChange1, function (err) {
                if (!!err){
                    logger.error("addAgentMemberAchievement addAgentMemberAchievement err, count:" + count);
                }
                utils.invokeCallback(cb, err);
            })
        }
    }else{
        dao.findOneAndUpdateEx("userModel", {uid: uid}, {$inc: {"agentMemberAchievement": count, "thisWeekLowerAgentCommision": lowerAgentCommisionChange}}, {new: true}, function (err, result) {
            if (!!err){
                logger.error("addAgentMemberAchievement findOneAndUpdate err, count:" + count);
                utils.invokeCallback(cb, err);
            }else{
                if (!!result && !!result.spreaderID){
                    let achievement = result.directlyMemberAchievement + result.agentMemberAchievement;
                    let lowerAgentCommisionChange2 = services.getCommisionChangeValue(achievement - count, achievement);
                    services.addAgentMemberAchievement(result.spreaderID, count, lowerAgentCommisionChange2, function (err1) {
                        if (!!err){
                            logger.error("addAgentMemberAchievement addAgentMemberAchievement err, count:" + count);
                        }
                        utils.invokeCallback(cb, err1);
                    })
                }else{
                    utils.invokeCallback(cb);
                }
            }
        });
    }
    */
};

services.getCommision = function (achievement) {
    let profitConfig = pomelo.app.get("agentProfit");
    for (let i = 0; i < profitConfig.length; ++i){
        let temp = profitConfig[i];
        if (temp.min <= achievement && (temp.max > achievement || temp.max === -1)){
            return temp.proportion * achievement;
        }
    }
    return 0;
};

services.getCommisionChangeValue = function (oldAchievement, newAchievement) {
    return this.getCommision(newAchievement) - this.getCommision(oldAchievement);
};

services.addDirectlyMemberCount = function (uid, cb) {
    let userData = null;
    async.series([
        function (cb) {
            userDao.getUserDataByUid(uid, function (err, result) {
                if (!!err){
                    cb(err);
                }else{
                    if (!result){
                        cb(code.HALL.NOT_FIND);
                    }else{
                        userData = result;
                        cb();
                    }
                }
            })
        },
        function (cb) {
            if (userData.directlyMemberCount === 0 && userData.spreaderID.length > 0){
                services.addAgentMemberCount(userData.spreaderID);
            }
            let updateUserData = {
                $inc: {
                    directlyMemberCount: 1,
                    weekAddedDirectlyMemberCount: 1,
                    monthAddedDirectlyMemberCount: 1
                }
            };
            userDao.updateUserData(uid, updateUserData, cb);
        }
    ], function (err) {
        if (!!err){
            logger.error("addDirectlyMemberCount err:" + err + ", uid:" + uid);
        }
        utils.invokeCallback(cb, err);
    });
};

services.addAgentMemberCount = function (uid, cb) {
    let userData = null;
    async.series([
        function (cb) {
            userDao.getUserDataByUid(uid, function (err, result) {
                if (!!err){
                    cb(err);
                }else{
                    if (!result){
                        cb(code.HALL.NOT_FIND);
                    }else{
                        userData = result;
                        cb();
                    }
                }
            })
        },
        function (cb) {
            let updateUserData = {
                $inc:{
                    agentMemberCount: 1,
                    weekAddedAgentMemberCount: 1,
                    monthAddedAgentMemberCount: 1
                }
            };
            userDao.updateUserData(uid, updateUserData, cb);
        }
    ], function (err) {
        if (!!err){
            logger.error("addAgentMemberCount err:" + err + ", uid:" + uid);
        }
        utils.invokeCallback(cb, err);
    });
};