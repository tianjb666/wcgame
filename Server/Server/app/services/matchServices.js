var exp = module.exports;
var pomelo= require('pomelo');
var logger = require('pomelo-logger').getLogger('pomelo');
let userDao = require('../dao/userDao');
var async = require('async');
var rpcAPI = require('../API/rpcAPI');
var userInfoServices = require('../services/userInfoServices');
var utils = require('../util/utils');
var dispatch = require('../util/dispatcher');
var code = require('../constant/code');
let scheduler = require('pomelo-scheduler');

// 匹配间隔
let MATCH_GAME_INTERVAL_TIME = 10000;

exp.init = function () {
    exp.matchUserLists = {};                // 所有游戏的匹配队列

    // 开启定时任务
    this.matchTaskScheduer = scheduler.scheduleJob({start: Date.now() + MATCH_GAME_INTERVAL_TIME, period: MATCH_GAME_INTERVAL_TIME}, exp.matchUserTask);
};

exp.deInit = function () {
    scheduler.cancelJob(this.matchTaskScheduer);
};

exp.entryMatchList = function (uid, gameTypeID) {
    logger.info("entryMatchList uid=" + uid + ", gameTypeID=" + gameTypeID );
    // 检查用户是否在匹配列表中，则不能重复匹配
    for (let key in exp.matchUserLists){
        if (exp.matchUserLists.hasOwnProperty(key)){
            let list = exp.matchUserLists[key];
            if (list.indexOf(uid) !== -1){
                logger.error("already in match list");
                return false;
            }
        }
    }
    // 添加到匹配队列中
    let matchUserList = exp.matchUserLists[gameTypeID];
    // 队列不存在则创建新的队列
    if (!matchUserList){
        exp.matchUserLists[gameTypeID] = [];
        matchUserList = exp.matchUserLists[gameTypeID];
    }
    matchUserList.push(uid);
    logger.info("entryMatchList", "success");
    return true;
};

exp.exitMatchList = function (uid) {
    logger.info("exitMatchList", uid);
    // 查询所有列表，并移除
    for (let key in exp.matchUserLists){
        if (exp.matchUserLists.hasOwnProperty(key)){
            let list = exp.matchUserLists[key];
            let index = list.indexOf(uid);
            if (index !== -1){
                list.splice(index, 1);
                logger.info("exitMatchList success");
            }
        }
    }
};

// 每五秒钟，进行一次匹配
exp.matchUserTask = function () {
    logger.info("matchUserTask");
    for (let key in exp.matchUserLists){
        if (exp.matchUserLists.hasOwnProperty(key)){
            let matchUserList = exp.matchUserLists[key];
            let gameTypeInfo = exp.getGameTypeInfo(key);
            // 如果游戏类型不存在，则直接删除匹配列表
            if (!gameTypeInfo){
                delete exp.matchUserLists[key];
            }else{
                exp.execMatch(matchUserList, gameTypeInfo);
            }
        }
    }
};

// 执行匹配
exp.execMatch = function (matchUserList, gameTypeInfo) {
    if (!matchUserList || matchUserList.length === 0) return;
    let maxUserCount = gameTypeInfo.maxPlayerCount - gameTypeInfo.minRobotCount;
    let minUserCount = gameTypeInfo.minPlayerCount - gameTypeInfo.maxRobotCount;
    // 匹配队列中的玩家不够组成一个房间
    if (minUserCount > matchUserList.length){
        logger.warn("execMatch", "not enough user gameTypeID=" + gameTypeInfo.gameTypeID);
        return;
    }
    do{
        if (maxUserCount >= matchUserList.length){
            exp.createRoom(gameTypeInfo, matchUserList);
            // 清除列表
            matchUserList.splice(0, matchUserList.length);
        }else{
            let list = matchUserList.slice(0, maxUserCount);
            exp.createRoom(gameTypeInfo, list);
            // 移除已匹配的用户
            matchUserList.splice(0, maxUserCount);
        }
    }while (minUserCount <= matchUserList.length && matchUserList.length > 0);
};

exp.getGameTypeInfo = function (gameTypeID) {
    let gameTypes = pomelo.app.get('gameTypes');
    for (let i = 0; i < gameTypes.length; ++i){
        if (gameTypes[i].gameTypeID === gameTypeID) return gameTypes[i];
    }
    return null;
};

exp.createRoom = function (gameTypeInfo, uidArr) {
    let roomUserInfoArr = [];
    async.series([
        function (cb) {
            // 获取用户信息
            userDao.getUserDataArr(uidArr, function (err, userDataArr) {
                if (!!err){
                    logger.error("match createRoom err", JSON.stringify(err));
                    cb(err);
                }else{
                    for (let i = 0; i < userDataArr.length; ++i){
                        // 检查用户是否满足进入房间的条件，如果不满足，不加入到列表中
                        let userData = userDataArr[i];
                        if (userData.gold < gameTypeInfo.goldLowerLimit) continue;
                        if (!userData.frontendId) continue;
                        roomUserInfoArr.push(userInfoServices.buildGameRoomUserInfo(userDataArr[i]));
                    }
                    if (roomUserInfoArr.length === 0){
                        cb("not can entry room user");
                    }else{
                        cb();
                    }
                }
            });
        },
        function (cb) {
            // 创建房间
            let gameServer = dispatch.dispatch(utils.getRandomNum(0, pomelo.app.getServersByType('game').length - 1), pomelo.app.getServersByType('game'));
            rpcAPI.createMatchRoom(gameServer.id, roomUserInfoArr, gameTypeInfo,
                function(err, roomID) {
                    if (!!err){
                        logger.error("createRoom", 'createRoom err:' + err);
                        cb(err);
                    }else{
                        /*let localSessionService = pomelo.app.get('localSessionService');
                        for (let i = 0; i < roomUserInfoArr.length; ++i){
                            let userInfo = roomUserInfoArr[i];
                            userDao.updateUserData(userInfo.uid, {isLockGold: "true", roomID: roomID});
                            userInfoServices.updateUserDataNotify(userInfo.uid, userInfo.frontendId, {roomID: roomID});
                            localSessionService.getByUid(userInfo.frontendId, userInfo.uid, function(err, result) {
                                if (!!err || !result || !result[0]) {
                                    logger.warn('createRoom: Get session error');
                                }else{
                                    let session = result[0];
                                    session.set ('roomID', roomID);
                                    session.push('roomID');
                                }
                            });
                        }*/
                        cb();
                    }
                });
        }
    ], function (err) {
        if (!!err){
            logger.error("createRoom err", JSON.stringify(err));
        }
    })

};