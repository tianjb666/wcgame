let dao = require('../dao/commonDao');
let userDao = require('../dao/userDao');
let async = require('async');
let pushAPI = require('../API/pushAPI');
let pomelo = require('pomelo');
let code = require('../constant/code');
let utils = require('../util/utils');
let logger = require('pomelo-logger').getLogger('pomelo');
let spreadServices = require('../services/spreadServices');

let service = module.exports;

service.createUserThenLoad = function (uid, userInfo, cb) {
    let spreaderID = "";
    let safePassword = "";
    let account = "";
    let userData = null;
    async.series([
        function (cb) {
            dao.findOneData("accountModel", {uid: parseInt(uid)}, function (err, result) {
                if (!!err){
                    cb(err);
                }else{
                    spreaderID = result.spreaderID;
                    safePassword = result.password;
                    account = result.phoneAccount || result.account;
                    cb();
                }
            })
        },
        function (cb) {
            // 创建用户数据
            let saveData = {};
            saveData.uid = uid;
            saveData.spreaderID = spreaderID;
            saveData.safePassword = safePassword;
            saveData.gold = parseInt(pomelo.app.get("publicParameter")["startGold"] || '0');
            if (!!userInfo){
                if (!!userInfo.avatar) saveData.avatar = "UserInfo/head_" + utils.getRandomNum(0, 15);
                if (!!userInfo.nickname) saveData.nickname = userInfo.nickname;
                if (!!userInfo.channelID) saveData.channelID = userInfo.channelID;
            }
            saveData.nickname = account;
            saveData.createTime = Date.now();

            if (!!spreaderID){
                spreadServices.addDirectlyMemberCount(spreaderID, function (err) {
                    if (!!err){
                        logger.error("entry", "addDirectlyMember err:" + err);
                    }
                });
            }

            dao.createData('userModel', saveData, function (err, result) {
                if (!!err || !result){
                    cb(code.MYSQL_ERROR);
                }else{
                    cb()
                }
            });
        },
        function (cb) {
            userDao.loadUserDataByUid(uid, function (err, result) {
                if (!!err){
                    cb(err);
                }else{
                    userData = result;
                    cb();
                }
            })
        }
    ], function (err) {
        utils.invokeCallback(cb, err, userData);
    })
};

service.updateUserData = function (user, saveData, cb){
    if (!!user){
        if (user.userDetailData.uid !== saveData.uid){
            logger.error("updateUserData", "user:" + JSON.stringify(user) + ", saveData:" + JSON.stringify(saveData));
            utils.invokeCallback(cb, code.INVALID_UERS);
        }else{
            user.updateUserData(saveData);
            utils.invokeCallback(cb);
        }
    }else{
        dao.updateData("userModel", {uid: saveData.uid}, saveData, function(err){
            if (!!err){
                logger.error("dao.updateData");
                utils.invokeCallback(cb, err);
            }else{
                utils.invokeCallback(cb);
            }
        });
    }
};

service.updateUserDataNotify = function (uid, sid, updateUserData, cb){
    if (!uid){
        utils.invokeCallback(cb, code.FAIL);
        return;
    }
    if (!!sid){
        pushAPI.updateUserInfoPush(updateUserData, [{uid: uid, sid: sid}], function(err){
            if(!!err){
                logger.error('updateUserDataNotify updateUserInfoPush err:' + err);
                utils.invokeCallback(cb, code.FAIL);
            }else{
                utils.invokeCallback(cb);
            }
        });
    }else{
        userDao.getUserDataByUidFromCache(uid, function (err, result) {
            if (!!err){
                logger.error('updateUserDataNotify getUserDataByUidFromCache err:' + err);
                utils.invokeCallback(cb, code.FAIL);
            }else{
                if (!result || !result.frontendId){
                    utils.invokeCallback(cb);
                }else{
                    pushAPI.updateUserInfoPush(updateUserData, [{uid: uid, sid: sid}], function(err){
                        if(!!err){
                            logger.error('updateUserDataNotify updateUserInfoPush err:' + err);
                            utils.invokeCallback(cb, code.FAIL);
                        }else{
                            utils.invokeCallback(cb);
                        }
                    });
                }
            }
        })
    }
};

service.getNewUserEmail = function (userEmail, lastLoginTime) {
    let emailArr = userEmail.length > 0?JSON.parse(userEmail):[];
    let publicParameter = pomelo.app.get('publicParameter');
    // 删除过期邮件
    let isEmailUpdate = false;
    let newEmailArr = [];
    for (let i = 0; i < emailArr.length; ++i){
        let emailInfo = emailArr[i];
        if (utils.getIntervalDay(emailInfo.createTime, Date.now()) < 7){
            newEmailArr.push(emailArr[i]);
        }else{
            isEmailUpdate = true;
        }
    }
    let lastUpdateSystemEmailTime = parseInt(publicParameter["lastUpdateSystemEmailTime"]);
    // 检查是否有新的系统邮件
    if(lastLoginTime > 0 && lastUpdateSystemEmailTime > 0 && lastUpdateSystemEmailTime > lastLoginTime){
        if(!!publicParameter["systemEmail"]){
            let systemEmailArr = JSON.parse(publicParameter["systemEmail"]);
            for (let i = 0; i < systemEmailArr.length; ++i){
                let systemEmailInfo = systemEmailArr[i];
                let isExist = false;
                for (let j = 0; j < emailArr.length; ++j){
                    if (emailArr[j].id === systemEmailInfo.id){
                        isExist = true;
                        break;
                    }
                }
                if (!isExist){
                    newEmailArr.push(systemEmailInfo);
                    isEmailUpdate = true;
                }
            }

        }
    }
    return isEmailUpdate?JSON.stringify(newEmailArr):null;
};

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
    let schema = pomelo.app.get('dbClient')['userModel'].schema.tree;
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

service.buildShortUserInfo = function (userInfo){
    var shortUserInfo = {};
    if ('nickname' in userInfo) shortUserInfo.nickname = userInfo.nickname;
    if ('avatar' in userInfo) shortUserInfo.avatar = userInfo.avatar;
    if ('uid' in userInfo) shortUserInfo.uid = userInfo.uid;
    if ('sex' in userInfo) shortUserInfo.sex = userInfo.sex;
    return shortUserInfo;
};

service.buildShortMemberInfo = function (userInfo) {
    return{
        uid: userInfo.uid,
        nickname: userInfo.nickname,
        avatar: userInfo.avatar,
        achievement: userInfo.achievement,
        lastLoginTime: userInfo.lastLoginTime
    };
};

service.buildShortAgentInfo = function (userInfo) {
    return{
        uid: userInfo.uid,
        nickname: userInfo.nickname,
        avatar: userInfo.avatar,
        directlyMemberAchievement: userInfo.directlyMemberAchievement,
        agentMemberAchievement: userInfo.agentMemberAchievement,
        directlyMemberCount: userInfo.directlyMemberCount,
        agentMemberCount: userInfo.agentMemberCount,
        lastLoginTime: userInfo.lastLoginTime
    };
};

service.buildGameRoomUserInfo = function(userInfo){
    var buildUserInfo = {};
    if ('uid' in userInfo) buildUserInfo.uid = userInfo.uid;
    if ('nickname' in userInfo) buildUserInfo.nickname = userInfo.nickname;
    if ('avatar' in userInfo) buildUserInfo.avatar = userInfo.avatar;
    if ('gold' in userInfo) buildUserInfo.gold = userInfo.gold;
    if ('frontendId' in userInfo) buildUserInfo.frontendId = userInfo.frontendId;
    if ('spreaderID' in userInfo) buildUserInfo.spreaderID = userInfo.spreaderID;
    for (var key in buildUserInfo){
        if (buildUserInfo.hasOwnProperty(key)){
            return buildUserInfo;
        }
    }
    return null;
};