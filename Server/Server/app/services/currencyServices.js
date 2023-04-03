var utils = require('../util/utils');
var enumeration = require('../constant/enumeration');
var pomelo = require('pomelo');
var async = require('async');
var code = require('../constant/code');
var userInfoServices = require('./userInfoServices');
var spreadServices = require('./spreadServices');
var logger = require('pomelo-logger').getLogger('pomelo');

var services = module.exports;

services.changeCurrency = function (changeUserData, isForce, cb) {
    // 校验数据
    var user = pomelo.app.hallManager.getUserByUid(changeUserData.uid);
    if (!user){
        utils.invokeCallback(cb, code.INVALID_UERS);
        return;
    }

    var updateUserData = {};
    updateUserData.uid = changeUserData.uid;
    // 校验是否能修改
    for (var key in changeUserData){
        if (changeUserData.hasOwnProperty(key) && user.userDetailData.hasOwnProperty(key) && key !== 'uid'){
            if((user.userDetailData[key] + changeUserData[key] < 0) && !isForce){
                utils.invokeCallback(cb, code.FAIL);
                return;
            }else{
                updateUserData[key] = user.userDetailData[key] + changeUserData[key];
                if (updateUserData[key] < 0) updateUserData[key] = 0;
            }
        }
    }
    var gold = changeUserData["gold"];
    // 记录今日赢金币数量
    if (!!gold && gold > 0){
        updateUserData.todayWinGoldCount = user.userDetailData.todayWinGoldCount + gold;
    }
    // 如果修改了金币，则更新业绩
    if(!!gold){
        updateUserData.achievement = user.userDetailData.achievement + (gold > 0?gold:(gold * -1));
    }
    // 修改数据
    user.updateUserData(updateUserData);
    utils.invokeCallback(cb, null, userInfoServices.buildGameRoomUserInfo(updateUserData));


    if(!!gold && user.userDetailData.spreaderID.length > 0){
        spreadServices.updateMemberAchievement(user.userDetailData.spreaderID, gold > 0?gold:(gold * -1), function (err) {
            if(!!err){
                logger.error("changeCurrency", "addDirectlyMemberAchievement err:" + err);
            }
        })
    }

    // 数据更新通知
    userInfoServices.updateUserDataNotify(user, updateUserData, function(err){
        if (!!err){
            logger.error('changeCurrencyRequest updateUserDataNotify err:' + err);
        }
    });
};