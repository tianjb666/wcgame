var code = require('../../../constant/code');
var scheduler = require('pomelo-scheduler');
var logger = require('pomelo-logger').getLogger('pomelo');
var async = require('async');
var utils = require('../../../util/utils');
var enumeration = require('../../../constant/enumeration');
var pomelo= require('pomelo');
var rpcAPI = require('../../../API/rpcAPI');
var dispatch = require('../../../util/dispatcher');
var dao = require('../../../dao/commonDao');
var controllerManager = require('./controllerManager');

var exp = module.exports;

// 机器人匹配游戏间隔
let ROBOT_MATCH_GAME_INTERVAL_TIME = 10000;

exp.init = function () {
    this.curRobotCountList = {};
    this.phoneTitleArr = ["134","135","136", "137", "138", "139", "150", "151","157", "158", "159", "152","136","151","156","185","181","170", "186", "187", "188", "130", "131", "132", "155", "156", "189"];
    this.robotUidList = {};
};

exp.afterStartAll = function () {
    this.init();
    this.loadRobot();
};

exp.beforeShutdown = function(cb){
    scheduler.cancelJob(this.scheduleTaskRobotMatchID);
    cb();
};

exp.loadRobot = function () {
    // 开启机器人自动匹配的定时器
    this.scheduleTaskRobotMatchID = scheduler.scheduleJob({start: Date.now() + ROBOT_MATCH_GAME_INTERVAL_TIME, period: ROBOT_MATCH_GAME_INTERVAL_TIME}, exp.scheduleTaskRobotMatch);
};

exp.scheduleTaskRobotMatch = function () {
    return;
    let gameTypes = pomelo.app.get('gameTypes');
    if (!gameTypes) return;
    let tasks = [];
    function robotMatch(gameTypeInfo) {
        tasks.push(function (cb) {
            exp.startRoom(gameTypeInfo, function (err) {
                if (!!err){
                    logger.error("scheduleTaskRobotMatch startRoom err:" + err);
                }
                cb();
            });
        })
    }

    for (let i = 0; i < gameTypes.length; ++i){
        let gameTypeInfo = gameTypes[i];
        // 匹配房间无机器人
        if (!!gameTypeInfo.matchRoom) continue;
        let controllerData = controllerManager.getGameControllerData(gameTypeInfo.kind);
        if (!controllerData || !controllerData.robotEnable || !controllerData.robotMatchEnable) continue;
        let curRobotCount = exp.curRobotCountList[gameTypeInfo.kind]||0;
        if (controllerData.maxRobotCount <= curRobotCount) continue;
        robotMatch(gameTypeInfo);
    }
    async.series(tasks, function (err) {
        if(!!err){
            logger.error("scheduleTaskRobotMatch err:" + err);
        }
    })
};

exp.createRoom = function (userInfo, gameTypeInfo, gameRule, cb) {
    let self = this;
    var gameServer = dispatch.dispatch(utils.getRandomNum(0, pomelo.app.getServersByType('game').length - 1), pomelo.app.getServersByType('game'));
    rpcAPI.createRoom(gameServer.id, userInfo, "", gameRule, gameTypeInfo,
        function(err, roomID) {
            if (!!err){
                logger.error("createRoom", 'createRoom err:' + err);
                utils.invokeCallback(cb, err);
            }else{
                self.robotUidList[userInfo.uid] = true;
                if(!!self.curRobotCountList[gameTypeInfo.kind]){
                    self.curRobotCountList[gameTypeInfo.kind] = self.curRobotCountList[gameTypeInfo.kind] + 1;
                }else{
                    self.curRobotCountList[gameTypeInfo.kind] = 1;
                }
                utils.invokeCallback(cb, null, roomID);
            }
        });
};

exp.joinRoom = function (userInfo, roomID, gameTypeInfo, cb) {
    var gameServers = pomelo.app.getServersByType('game');
    var server = dispatch.dispatch(roomID, gameServers);
    let self = this;
    rpcAPI.joinRoom(server.id, userInfo, "", roomID, function (err) {
        if (!!err){
            utils.invokeCallback(cb, err);
        }else{
            self.robotUidList[userInfo.uid] = true;
            if(!!self.curRobotCountList[gameTypeInfo.kind]){
                self.curRobotCountList[gameTypeInfo.kind] = self.curRobotCountList[gameTypeInfo.kind] + 1;
            }else{
                self.curRobotCountList[gameTypeInfo.kind] = 1;
            }
            utils.invokeCallback(cb, null, roomID);
        }
    });
};

exp.matchRoom = function(userInfo, roomArr, gameTypeInfo, cb) {
    // 判断进入条件
    if(userInfo.gold < gameTypeInfo.goldLowerLimit){
        utils.invokeCallback(cb, code.GAME.LEAVE_ROOM_GOLD_NOT_ENOUGH_LIMIT);
        return;
    }

    if (roomArr.length === 0){
        exp.createRoom(userInfo, gameTypeInfo, null, cb);
    }else{
        var index = utils.getRandomNum(0, roomArr.length - 1);
        exp.joinRoom(userInfo, roomArr[index], gameTypeInfo, function (err) {
            if (!!err){
                logger.error("matchRoom", "joinRoom err:" + err);
                roomArr.splice(index, 1);
                exp.matchRoom(userInfo, roomArr, gameTypeInfo, cb);
            }else{
                utils.invokeCallback(cb);
            }
        });
    }
};

exp.startRoom = function (gameTypeInfo, cb) {
    var roomArr = [];
    let self = this;
    async.series([
        function (cb) {
            // 查询可加入房间列表
            var servers = pomelo.app.getServersByType('game');
            var tasks = [];
            var index = 0;
            function task(cb) {
                var server = servers[index++];
                rpcAPI.getMatchRoomList(server.id, gameTypeInfo.gameTypeID, cb);
            }
            for (var i = 0; i < servers.length; ++i){
                tasks.push(task);
            }
            async.parallel(tasks, function (err, resultArr) {
                if (!!err){
                    logger.error("startMatch", "matchRoom err:" + err);
                    cb(err);
                }else{
                    for (var i = 0; i < resultArr.length; ++i){
                        if (!!resultArr[i]){
                            roomArr = roomArr.concat(resultArr[i]);
                        }
                    }
                    cb();
                }
            })
        },
        function (cb) {
            var robotInfo = exp.getIdleRobot(gameTypeInfo);
            if (!robotInfo){
                cb();
                return;
            }
            exp.matchRoom(exp.getIdleRobot(gameTypeInfo), roomArr, gameTypeInfo, function (err) {
                if (!!err){
                    logger.error("matchRoom", "err:" + err);
                    cb(err);
                }else{
                    cb();
                }
            });
        }
    ], function (err) {
        if (!!err){
            logger.error("startRoom", "err:" + err);
        }
        utils.invokeCallback(cb, err);
    })

};

exp.requestRobotNotify = function (roomID, gameTypeInfo, count, cb) {
    let gameControlData = controllerManager.getGameControllerData(gameTypeInfo.kind);
    if (!gameControlData || !gameControlData.robotMatchEnable){
        utils.invokeCallback(cb);
        return;
    }
    var robotCount = count;
    var task = function (cb) {
        var robotInfo = exp.getIdleRobot(gameTypeInfo);
        if (!robotInfo){
            cb();
        }else{
            exp.joinRoom(robotInfo, roomID, gameTypeInfo, function (err) {
                if (!!err) {
                    cb();
                }
                cb();
            })
        }
    };
    var tasks = [];
    while (robotCount-- > 0){
        tasks.push(task);
    }
    async.series(tasks, function (err) {
        if (!!err){
            logger.error("roomCreatedNotify", "err:" + err);
        }
        utils.invokeCallback(cb, err);
    });
};

exp.robotLeaveRoomNotify = function (kind, uidArr) {
    if (!uidArr) return;
    for (let i = 0; i < uidArr.length; ++i){
        delete this.robotUidList[uidArr[i]];

        this.curRobotCountList[kind]--;
    }
    logger.debug("robotLeaveRoomNotify", "curRobotCount:" + this.curRobotCountList[kind]);
};

exp.getIdleRobot = function (gameTypeInfo) {
    let gameControlData = controllerManager.getGameControllerData(gameTypeInfo.kind);
    // 匹配制房间不受机器人数量限制
    if (!gameTypeInfo.matchRoom){
        if (!gameControlData || gameControlData.maxRobotCount <= this.curRobotCountList[gameTypeInfo.kind]) return null;
    }
    let uid = null;
    do {
        uid = (10000 + utils.getRandomNum(0, 9999)).toString();
    }while (this.robotUidList[uid]);
    let userInfo = {
        uid: uid,
        nickname: this.phoneTitleArr[utils.getRandomNum(0, this.phoneTitleArr.length-1)] + utils.getRandomNum(10000000, 99999999),
        avatar: "UserInfo/head_" + utils.getRandomNum(0, 15),
        robot: true,
    };
    if (gameTypeInfo.goldLowerLimit <= 0){
        userInfo.gold = utils.getRandomNum(10000, 10000000)/100;
    }else{
        let temp = gameTypeInfo.goldLowerLimit > 100?gameTypeInfo.goldLowerLimit * 100: 10000;
        userInfo.gold = (temp + utils.getRandomNum(temp, temp * 4))/100;
    }
    return userInfo;
};