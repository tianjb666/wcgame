/**
 * Created by 1718841401 on 2017/6/22.
 */

var async = require('async');
var code = require('../../../constant/code');
var enumeration = require('../../../constant/enumeration');
var userInfoServices = require('../../../services/userInfoServices');
var dao = require('../../../dao/commonDao');
var userDao = require('../../../dao/userDao');
var logger = require('pomelo-logger').getLogger('pomelo');

module.exports = function(app) {
    return new Handler(app);
};

var Handler = function(app) {
    this.app = app;
};

Handler.prototype.withdrawCashRequest = function(msg, session, next){
    if(!session.uid){
        next(null, {code: code.INVALID_UERS});
        return;
    }
    if (!msg.count || typeof msg.count !== 'number' || msg.count <= 0){
        next(null, {code: code.REQUEST_DATA_ERROR});
        return;
    }
    let userData = null;
    var count = msg.count || 0;
    var updateUserData = null;
    async.series([
        function (cb) {
            userDao.getUnlockedUserDataWithLock(session.uid, function (err, result) {
                if (!!err){
                    cb(err);
                }else{
                    if (!result){
                        cb(code.HALL.NOT_FIND);
                    }else{
                        userData = result;
                        if (userData.isLockGold !== 'false' && userData.isLockGold !== false){
                            userDao.unlockUserData(session.uid);
                            cb(code.HALL.GOLD_LOCKED);
                        }else{
                            cb();
                        }
                    }
                }
            })
        },
        // 验证数据
        function(cb){
            if (msg.withdrawCashType === enumeration.withdrawCashType.ALI_PAY){
                if (!userData.aliPayInfo || userData.aliPayInfo.length === 0){
                    userDao.unlockUserData(session.uid);
                    cb(code.HALL.NOT_BIND_ALI_PAY);
                }else{
                    cb();
                }
            }else if (msg.withdrawCashType === enumeration.withdrawCashType.BANK_CARD){
                if (!userData.bankCardInfo || userData.bankCardInfo.length === 0){
                    userDao.unlockUserData(session.uid);
                    cb(code.HALL.NOT_BIND_BANK_CARD);
                }else{
                    cb();
                }
            } else{
                cb(code.REQUEST_DATA_ERROR);
            }
        },
        function(cb){
			if (count > userData.gold){
                userDao.unlockUserData(session.uid);
				cb(code.HALL.NOT_ENOUGH_GOLD);
				return;
			}
            updateUserData = {
                $inc: {gold: -count}
            };
            userDao.updateUserDataWithUnlock(session.uid, updateUserData, function (err, result) {
                if (!err){
                    if (result.frontendId) {
                        userInfoServices.updateUserDataNotify(session.uid, result.frontendId, {gold: result.gold});
                    }
                    let saveData = {
                        uid: session.uid,
                        count: count,
                        curGold: result.gold,
                        channelID: result.channelID,
                        type: msg.withdrawCashType,
                        status: 0,
                        createTime: Date.now()
                    };
                    if (msg.withdrawCashType === enumeration.withdrawCashType.ALI_PAY){
                        let aliPayInfo = JSON.parse(result.aliPayInfo);
                        saveData.account = aliPayInfo.aliPayAccount;
                        saveData.ownerName = aliPayInfo.ownerName
                    }else if (msg.withdrawCashType === enumeration.withdrawCashType.BANK_CARD){
                        let bankCardInfo = JSON.parse(result.bankCardInfo);
                        saveData.account = bankCardInfo.cardNumber;
                        saveData.ownerName = bankCardInfo.ownerName
                    }
                    dao.createData("withdrawCashRecordModel", saveData, function(err){
                        if (!!err){
                            logger.error('withdrawCashRequest', 'createBillRecordData err:' + err);
                        }
                    })
                }
            });
            cb();
        }
    ], function(err){
        if (!!err){
            logger.error("withdrawCashRequest", "msg:" + JSON.stringify(msg) +" ,err:" + code[err]);
            next(null, {code: err});
        }else{
            next(null, {code: code.OK});
        }
    })
};

Handler.prototype.extractionCommission = function (msg, session, next) {
    if (!session.uid){
        next(null, {code: code.INVALID_UERS});
        return;
    }
    let userData = null;
    async.series([
        function (cb) {
            userDao.getUnlockedUserDataWithLock(session.uid, function (err, result) {
                if (!!err){
                    cb(err);
                }else{
                    if (!result){
                        cb(code.HALL.NOT_FIND);
                    }else{
                        userData = result;
                        if (userData.isLockGold !== 'false' && userData.isLockGold !== false){
                            userDao.unlockUserData(session.uid);
                            cb(code.HALL.GOLD_LOCKED);
                        }else{
                            cb();
                        }
                    }
                }
            })
        },
        function (cb) {
            let updateUserData = {
                $inc: {
                    gold: userData.realCommision
                },
                realCommision: 0
            };
            userDao.updateUserDataWithUnlock(session.uid, updateUserData, function (err, result) {
                if (!!err){
                    cb(err);
                }else{
                    let saveData = {
                        uid: session.uid,
                        count: userData.realCommision,
                        remainderCount: 0,
                        gold: result.gold,
                        createTime: Date.now()
                    };
                    saveData.curGold = updateUserData.gold;
                    dao.createData("extractionCommissionRecordModel", saveData);

                    userInfoServices.updateUserDataNotify(session.uid, result.frontendId, {gold: result.gold, realCommision: result.realCommision});

                    cb();
                }
            });
        }
    ], function (err) {
        if (!!err){
            logger.error("extractionCommission", "msg:" + JSON.stringify(msg) +" ,err:" + code[err]);
        }
        next(null, {code: !!err?err: code.OK});
    })
};
