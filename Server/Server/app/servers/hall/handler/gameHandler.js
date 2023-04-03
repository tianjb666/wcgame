var code = require('../../../constant/code');
var async = require('async');
var rpcAPI = require('../../../API/rpcAPI');
var dispatch = require('../../../util/dispatcher');
var userInfoServices = require('../../../services/userInfoServices');
var parameterServices = require('../../../services/parameterServices');
var matchServices = require('../../../services/matchServices');
var enumeration = require('../../../constant/enumeration');
var utils = require('../../../util/utils');
var logger = require('pomelo-logger').getLogger('pomelo');
var matchDomain = require("../domain/matchDomain");
let userDao = require('../../../dao/userDao');

module.exports = function(app) {
    return new Handler(app);
};

var Handler = function(app) {
    this.app = app;
};

Handler.prototype.joinRoom = function(msg, session, next) {
    if (!session.uid){
        next(null, {code: code.INVALID_UERS});
        return;
    }
    var roomId = parseInt(msg.roomId);
    if (!roomId){
        next(null, {code: code.REQUEST_DATA_ERROR});
        return;
    }
	var oldRoomId = session.get('roomID');
    var self = this;
    let userData = null;
    async.series([
        function (cb) {
            userDao.loadUserDataByUid(session.uid, function (err, result) {
                if (!!err){
                    cb(err);
                }else{
                    if (!result){
                        cb(code.HALL.NOT_FIND);
                    } else{
                        userData = result;
                        cb();
                    }
                }
            })
        },
        function(cb) { /* 验证数据 */
            if(!!oldRoomId && roomId !== oldRoomId) { /* 原来的房间存在,加入原来的房间中 */
				let gameServer = dispatch.dispatch(oldRoomId, self.app.getServersByType('game'));
				rpcAPI.isUserInRoom(gameServer.id, session.uid, oldRoomId, function(err, isIn) {
                    if (!!err){
                        logger.error('join room isUserIn room:' + err);
                        cb(err);
                    }else{
                        if(!!isIn) {
                            roomId = oldRoomId;
                        }
                        cb();
                    }
				})
            }
			else {
                cb();
			}
        },
        function(cb) { // 加入房间
            var gameServer = dispatch.dispatch(roomId, self.app.getServersByType('game'));
            rpcAPI.joinRoom(gameServer.id, userInfoServices.buildGameRoomUserInfo(userData), userData.frontendId, roomId,
				function(err) {
                    if (!!err){
                        logger.error('joinRoom err:' + err);
                        cb(err);
                    }else{
                        /*userDao.updateUserData(session.uid, {isLockGold: "true", roomID: roomId});
                        userInfoServices.updateUserDataNotify(session.uid, userData.frontendId, {roomID: roomId});
                        session.set('roomID', roomId);
                        session.push('roomID', cb);*/
                        cb();
                    }
				});
        }
    ], function(err) {
        if(!!err) {
            logger.error('room handler joinRoom error:' + err);
            next(null, {code: err});
        }else{
            next(null, {code:code.OK});
        }
    });
};


Handler.prototype.matchRoom = function(msg, session, next) {
    if (!session.uid){
        next(null, {code: code.INVALID_UERS});
        return;
    }else if (!msg.gameTypeID){
        next(null, {code: code.REQUEST_DATA_ERROR});
        return;
    }
    var oldRoomId = session.get('roomID');
    var gameTypeID = msg.gameTypeID;
    let gameTypeInfo = parameterServices.getGameTypeInfo(gameTypeID);
    if (!gameTypeInfo){
        next(null, {code: code.REQUEST_DATA_ERROR});
        return;
    }
    var userData = null;
    var self = this;
    async.series([
        function (cb) {
            userDao.getUserDataByUidFromCache(session.uid, function (err, result) {
                if (!!err){
                    cb(err);
                }else{
                    if (!result){
                        cb(code.INVALID_UERS);
                    }else{
                        userData = result;
                        cb();
                    }
                }
            })
        },
        function(cb) {
            if(!!oldRoomId) {
                var gameServer = dispatch.dispatch(oldRoomId, self.app.getServersByType('game'));
                rpcAPI.isUserInRoom(gameServer.id, session.uid, oldRoomId, function(err, isIn) {
                    if (!!err){
                        logger.error("matchRoom", 'isUserInRoom err:' + err);
                        cb();
                    }else{
                        if(!!isIn) {
                            cb(code.GAME_CENTER.ALREADY_IN_ROOM);
                        } else {
                            cb();
                        }
                    }
                })
            } else {
                cb();
            }
        },
        function(cb) {
            // 非匹配制，直接查询加入房间
            if (!gameTypeInfo.matchRoom){
                matchDomain.startMatch(userData, gameTypeID, function (err, roomID) {
                    if (!!err){
                        logger.error("matchRoom", "startMatch err:" + err);
                        cb(err);
                    }else{
                        /*logger.info("matchRoom", "roomID" + roomID);
                        // 锁定金币
                        userDao.updateUserData(session.uid, {isLockGold: "true", roomID: roomID});
                        userInfoServices.updateUserDataNotify(session.uid, userData.frontendId, {roomID: roomID});
                        session.set("roomID", roomID);
                        session.push("roomID", cb);*/
                        cb();
                    }
                })
            }else{
                // 匹配制房间，则加入匹配列表
                if (matchServices.entryMatchList(session.uid, gameTypeID)){
                    cb();
                }else{
                    cb(code.GAME_CENTER.ALREADY_IN_MATCH_LIST);
                }
            }
        }
    ], function(err) {
        if(!!err) {
            logger.error("matchRoom", "game handler matchRoom error:" + err + "，msg:" + JSON.stringify(msg));
            next(null, {code: err});
        }else{
            next(null, {code:code.OK});
        }
    });
};

Handler.prototype.stopMatchRoom = function(msg, session, next) {
    if (!session.uid){
        next(null, {code: code.INVALID_UERS});
        return;
    }
    matchServices.exitMatchList(session.uid);
    next(null, {code:code.OK});
};

Handler.prototype.getAllRoomGameDataByKind = function (msg, session, next) {
    if(!session.uid){
        next(null, {code: code.INVALID_UERS});
        return;
    }
    if (!msg.kindID){
        next(null, {code: code.REQUEST_DATA_ERROR});
        return;
    }

    let index = 0;
    let gameServers = this.app.getServersByType('game');
    let tasks = [];
    for (let i = 0; i < gameServers.length; ++i){
        tasks.push(function(cb){
            rpcAPI.getRoomGameDataByKind(gameServers[index++].id, msg.kindID, cb);
        })
    }
    async.parallel(tasks, function(err, result){
        if (!!err){
            console.error("getAllRoomGameDataByKind err:" + err);
            next(null, {code: code.REQUEST_DATA_ERROR});
        }else{
            let gameDataArr = [];
            for (let i = 0; i < result.length; ++i){
                if (!!result[i]){
                    gameDataArr = gameDataArr.concat(result[i]);
                }
            }
            next(null, {code: code.OK, msg:{gameDataArr: gameDataArr}});
        }
    });
};

Handler.prototype.getRoomGameDataByRoomID = function (msg, session, next) {
    if (!session.uid) {
        next(null, {code: code.INVALID_UERS});
        return;
    }
    if (!msg.roomID) {
        next(null, {code: code.REQUEST_DATA_ERROR});
        return;
    }

    let server = dispatch.dispatch(msg.roomID, this.app.getServersByType("game"));
    rpcAPI.getRoomGameDataByRoomID(server.id, msg.roomID, function (err, result) {
        if (!!err){
            next(null, {code: err});
        }else{
            next(null, {code: code.OK, msg: {gameData: result}});
        }
    });
};
