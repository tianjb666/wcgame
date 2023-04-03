var rpcPI = require('../../../API/rpcAPI');
var code = require('../../../constant/code');
var userInfoServices = require('../../../services/userInfoServices');
var authServices = require('../../../services/authServices');
var async = require('async');
var logger = require('pomelo-logger').getLogger('pomelo');
var dao = require('../../../dao/commonDao');
var userDao = require('../../../dao/userDao');

module.exports = function(app) {
    return new Handler(app);
};

var Handler = function(app) {
    this.app = app;
};

Handler.prototype.updateBankCardInfo = function(msg, session, next){
    if (!session.uid){
        next(null, {code:code.INVALID_UERS});
        return;
    }
    if (!msg.bankCardInfo){
        next(null, {code: code.REQUEST_DATA_ERROR});
        return;
    }

    let updateUserData = {
        bankCardInfo: JSON.stringify(msg.bankCardInfo)
    };
    userDao.updateUserData(session.uid, updateUserData, function (err, result) {
       if (!!err){
           next(null, {code: err});
       }else{
           userInfoServices.updateUserDataNotify(session.uid, result.frontendId, {bankCardInfo: result.bankCardInfo});
           next(null, {code: code.OK});
       }
    });
};

Handler.prototype.updateAliPayInfoRequest = function (msg, session, next) {
    if (!session.uid){
        next(null, {code:code.INVALID_UERS});
        return;
    }
    if (!msg.aliPayInfo){
        next(null, {code: code.REQUEST_DATA_ERROR});
        return;
    }

    let updateUserData = {
        aliPayInfo: JSON.stringify(msg.aliPayInfo)
    };
    userDao.updateUserData(session.uid, updateUserData, function (err, result) {
       if (!!err){
           next(null, {code: err});
       }else{
           userInfoServices.updateUserDataNotify(session.uid, result.frontendId, {aliPayInfo: result.aliPayInfo});
           next(null, {code: code.OK});
       }
    });
};

Handler.prototype.safeBoxOperation = function (msg, session, next) {
    if (!session.uid){
        next(null, {code: code.INVALID_UERS});
        return;
    }
    if (!msg.count || typeof msg.count !== 'number'){
        next(null, {code: code.REQUEST_DATA_ERROR});
        return;
    }
    let userData = null;
    async.series([
        function (cb) {
            // 获取用户信息，并加锁
            userDao.getUnlockedUserDataWithLock(session.uid, function (err, result) {
                if (!!err){
                    logger.error('safeBoxOperation error:' + err);
                    cb(err);
                }else{
                    if (!result){
                        cb(code.HALL.NOT_FIND);
                    }else{
                        if (result.isLockGold !== false && result.isLockGold !== "false"){
                            userDao.unlockUserData(session.uid);
                            cb(code.HALL.GOLD_LOCKED);
                        }else{
                            userData = result;
                            cb();
                        }
                    }
                }
            })
        },
        function (cb) {
            // 存入
            if (msg.count > 0){
                // 验证金币数量
                if(userData.gold < msg.count){
                    userDao.unlockUserData(session.uid);
                    cb(code.HALL.NOT_ENOUGH_GOLD);
                    return;
                }
            }
            // 取出
            else{
                if (userData.safeGold < msg.count * -1){
                    userDao.unlockUserData(session.uid);
                    cb(code.HALL.NOT_ENOUGH_GOLD);
                    return;
                }
            }
            let updateUserData = {
                $inc: {
                    gold: -msg.count,
                    safeGold: msg.count
                }
            };
            userDao.updateUserDataWithUnlock(session.uid, updateUserData, function (err, result) {
                if (!!err){
                    logger.error('safeBoxOperation error:' + err);
                    cb(err);
                } else{
                    userInfoServices.updateUserDataNotify(session.uid, result.frontendId, {gold: result.gold, safeGold: result.safeGold});
                    cb();
                }
            });
        }

    ], function (err) {
        if(!!err){
            logger.error("safeBoxOperation", "err:" + err);
        }
        next(null, {code: err || code.OK});
    });
};

Handler.prototype.updateAvatar = function (msg, session, next) {
    if (!session.uid){
        next(null, {code: code.INVALID_UERS});
        return;
    }
    if (!msg.avatar){
        next(null, {code: code.REQUEST_DATA_ERROR});
        return;
    }

    userDao.updateUserData(session.uid, {avatar: msg.avatar}, function (err, res) {
        if (!!err){
            logger.error("updateAvatar", "err:" + err);
            next(null, {code: err});
        }else{
            userInfoServices.updateUserDataNotify(res.uid, res.frontendId, {avatar: msg.avatar});
            next(null, {code: code.OK});
        }
    });
};

Handler.prototype.bindPhone = function (msg, session, next) {
    if (!session.uid){
        next(null, {code: code.INVALID_UERS});
        return;
    }
    if (!msg.phone || !msg.verificationCode){
        next(null, {code: code.REQUEST_DATA_ERROR});
        return;
    }

    async.series([
        function (cb) {
            authServices.authSmsCode(msg.phone, msg.verificationCode, function (err) {
                cb(err);
            })
        },
        function (cb) {
            userDao.updateUserData(session.uid, {phone: msg.phone}, function (err) {
                cb(err)
            });
        }
    ], function (err) {
        if(!!err){
            logger.error("bindPhone", "err:" + err);
        }
        next(null, {code: err || code.OK});
    })

};

