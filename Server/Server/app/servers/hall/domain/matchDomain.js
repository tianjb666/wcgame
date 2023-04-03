var domain = module.exports;
var pomelo= require('pomelo');
var logger = require('pomelo-logger').getLogger('pomelo');
var async = require('async');
var rpcAPI = require('../../../API/rpcAPI');
var userInfoServices = require('../../../services/userInfoServices');
var utils = require('../../../util/utils');
var dispatch = require('../../../util/dispatcher');
var code = require('../../../constant/code');

domain.init = function () {
    
};

domain.matchRoom = function (userData, roomArr, gameTypeInfo, cb) {
    // 判断进入条件
    if(userData.gold < gameTypeInfo.goldLowerLimit){
        utils.invokeCallback(cb, code.GAME.LEAVE_ROOM_GOLD_NOT_ENOUGH_LIMIT);
        return;
    }

    if (roomArr.length === 0){
        domain.createRoom(userData, gameTypeInfo, null, cb);
    }else{
        var index = utils.getRandomNum(0, roomArr.length - 1);
        domain.joinRoom(userData, roomArr[index], function (err) {
            if (!!err){
                logger.error("matchRoom", "joinRoom err:" + err);
                roomArr.splice(index, 1);
                domain.matchRoom(userData, roomArr, gameTypeInfo, cb);
            }else{
                utils.invokeCallback(cb, null, roomArr[index]);
            }
        });
    }
};

domain.createRoom = function (userData, gameTypeInfo, gameRule, cb) {
    var gameServer = dispatch.dispatch(utils.getRandomNum(0, pomelo.app.getServersByType('game').length - 1), pomelo.app.getServersByType('game'));
    rpcAPI.createRoom(gameServer.id, userInfoServices.buildGameRoomUserInfo(userData), userData.frontendId, gameRule, gameTypeInfo,
        function(err, roomID) {
            if (!!err){
                logger.error("createRoom", 'createRoom err:' + err);
                utils.invokeCallback(cb, err);
            }else{
                utils.invokeCallback(cb, null, roomID);
            }
        });
};

domain.joinRoom = function (userData, roomID, cb) {
    var gameServers = pomelo.app.getServersByType('game');
    var server = dispatch.dispatch(roomID, gameServers);
    rpcAPI.joinRoom(server.id, userInfoServices.buildGameRoomUserInfo(userData), userData.frontendId, roomID, function (err) {
        if (!!err){
            utils.invokeCallback(cb, err);
        }else{
            utils.invokeCallback(cb, null, roomID);
        }
    });
};

function getGameInfoByGameTypeID(gameTypeID) {
    var gameTypes = pomelo.app.get("gameTypes");
    for (var i = 0; i < gameTypes.length; ++i){
        if (gameTypes[i].gameTypeID === gameTypeID){
            return gameTypes[i];
        }
    }
    return null;
}

domain.startMatch = function (userData, gameTypeID, cb) {
    var gameTypeInfo = getGameInfoByGameTypeID(gameTypeID);
    if (!gameTypeInfo){
        utils.invokeCallback(cb, code.REQUEST_DATA_ERROR);
        return;
    }
    var roomArr = [];
    var roomID = null;
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
            domain.matchRoom(userData, roomArr, gameTypeInfo, function (err, roomID1) {
                if (!!err){
                    logger.error("matchRoom", "err:" + err);
                    cb(err);
                }else{
                    roomID = roomID1;
                    cb();
                }
            });
        }
    ], function (err) {
        if (!!err){
            logger.error("startMatch", "err:" + err);
        }
        utils.invokeCallback(cb, err, roomID);
    })
};
