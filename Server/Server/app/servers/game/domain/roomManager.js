/**
 * Created by zjgame on 2017/2/22.
 */
let code = require('../../../constant/code');
let scheduler = require('pomelo-scheduler');
let logger = require('pomelo-logger').getLogger('pomelo');
let RoomFrame = require('../../../gameComponent/roomFrame');
let async = require('async');
let utils = require('../../../util/utils');
let enumeration = require('../../../constant/enumeration');

let Manager = module.exports;

let ROOM_MAX_DELAY_DELETE_TIME = 60 * 60 * 1000;
Manager.init = function (app) {
    this.app = app;
    this.roomList = {};

    this.scheduleJobID = -1;
    this.startScheduler();
};

let scheduleTask = function(data){
    let self = data.manager;
    let timeNow = new Date().toLocaleString();
    logger.info(self.app.curServer.id + ':room manager schedule task');
    logger.info(timeNow);
    // 输出现有房间的数量
    let count = 0;
    for (let key in self.roomList){
        if (self.roomList.hasOwnProperty(key)){
            let room = self.roomList[key];
            logger.info('room id: ' + key);
            if (room.isShouldDelete(ROOM_MAX_DELAY_DELETE_TIME)){
                room.destroyRoom();
                delete self.roomList[key];
                logger.info('delete room id:' + key);
            }else{
                count++;
            }
        }
    }
    logger.info('room count:'+ count);
};

Manager.startScheduler = function(){
    this.scheduleJobID = scheduler.scheduleJob({period : ROOM_MAX_DELAY_DELETE_TIME}, scheduleTask, {manager: this});
};

Manager.stopScheduler = function(){
    scheduler.cancelJob(this.scheduleJobID);
};

Manager.beforeShutdown = function(cb){
    this.stopScheduler();
    cb();
};

Manager.createRoom = function(userInfo, frontendId, gameRule, gameTypeInfo, cb) {
    let roomID = this.createNewRoomID();
    let roomFrame = new RoomFrame(this.app, roomID, userInfo.uid, gameRule, gameTypeInfo);
    this.roomList[roomID] = roomFrame;
	roomFrame.userEntryRoom(userInfo, frontendId, function(err){
		if (!!err){
			logger.error('createRoom userEntryRoom err:' + err );
		}
		cb(err, roomID);
	});
};

Manager.createMatchRoom = function (userInfoArr, gameTypeInfo, cb) {
    let roomID = this.createNewRoomID();
    let roomFrame = new RoomFrame(this.app, roomID, null, null, gameTypeInfo);
    this.roomList[roomID] = roomFrame;
    for (let i = 0; i < userInfoArr.length; ++i){
        roomFrame.userEntryRoom(userInfoArr[i], userInfoArr[i].frontendId, function(err){
            if (!!err){
                logger.error('createMatchRoom userEntryRoom err:' + err );
            }
        });
    }
    cb(null, roomID);
};

Manager.joinRoom = function (userInfo, frontendId, roomID, cb) {
    let roomFrame = this.roomList[roomID];
    if (!!roomFrame){
		if(!roomFrame.canEnterRoom(userInfo)) {
			cb(code.GAME_CENTER.ROOM_PLAYER_COUNT_FULL);
		} else {
			roomFrame.userEntryRoom(userInfo, frontendId, function(err){
				if (!!err){
					logger.error('join userEntryRoom err:' + err );
				}
				cb(err);
			});
		}
    }else{
		cb(code.GAME_CENTER.ROOM_NOT_EXIST);
		/*
        let gameRoomData = null;
        let self = this;
        async.waterfall([
            function(cb){
                gameRoomDao.getGameRoomData(roomID, function(err, res){
                    if (!!err){
                        cb(err);
                    }else{
                        if (!!res){
                            gameRoomData = res._doc;
                            cb();
                        }else{
                            cb(code.GAME_CENTER.ROOM_NOT_EXIST);
                        }
                    }
                })
            },
            function(cb){
                roomFrame = self.roomList[roomID];
                let bankerInfo = JSON.parse(gameRoomData.bankerInfo);
                if (!roomFrame){
                    roomFrame = new RoomFrame(self.app, roomID, bankerInfo.uid);
                    self.roomList[roomID] = roomFrame;
                    roomFrame.setRoomData(gameRoomData);
                }
                roomFrame.userEntryRoom(userInfo, frontendId, cb);
            }
        ], function(err){
            if (!!err){
                logger.error('joinRoom userEntryRoom err:' + err );
            }
            cb(err);
        });
		*/
    }
};

Manager.dismissRoom = function(roomID, cb) {
    let roomFrame = this.roomList[roomID];
	if(!! roomFrame) {
		cb();
		delete this.roomList[roomID];
	} else {
		cb(1);
	}
};

Manager.leaveRoom = function(roomID, uid, cb){
    let roomFrame = this.roomList[roomID];
    if (!!roomFrame){
        roomFrame.userOffLine(uid, cb);
    }else{
        cb(code.GAME_CENTER.ROOM_NOT_EXIST);
    }
};

Manager.exitRoom = function(roomID, uid, cb){
    let roomFrame = this.roomList[roomID];
    if (!!roomFrame){
        roomFrame.userExitRoom(uid, cb);
    }else{
        cb(code.GAME_CENTER.ROOM_NOT_EXIST);
    }
};

Manager.onUserOffLine = function (uid, roomID, cb) {
    let roomFrame = this.roomList[roomID];
    if (!roomFrame){
        logger.error(new Error('room not exist roomID:' + roomID));
        cb(code.GAME_CENTER.ROOM_NOT_EXIST);
    }
    else {
        roomFrame.userOffLine(uid, cb);
    }
};

Manager.getRoomFrameByID = function(roomID){
    return this.roomList[roomID] || null;
};

Manager.isUserInRoom = function(uid, roomId, cb) {
	let room = this.roomList[roomId];
	let isIn = room && room.ownUser(uid);
	cb(null, isIn);
};

Manager.searchRoomByUid = function(uid, cb){
    let roomID = 0;
    for (let key in this.roomList){
        if (this.roomList.hasOwnProperty(key)){
            let room = this.roomList[key];
            if (room.ownUser(uid)){
                roomID = room.roomId;
                break;
            }
        }
    }
    cb(null, roomID);
};

Manager.getRoomGameDataByKind = function(kindID, cb){
    let gameDataArr = [];
    for (let key in this.roomList){
        if (this.roomList.hasOwnProperty(key)){
            let room = this.roomList[key];
            if (room.getGameTypeInfo().kind === kindID){
                gameDataArr.push(room.getCurGameData());
            }
        }
    }
    cb(null, gameDataArr);
};

Manager.getRoomGameDataByRoomID = function(roomID, cb){
    let gameData = null;
    for (let key in this.roomList){
        if (this.roomList.hasOwnProperty(key)){
            let room = this.roomList[key];
            if (room.roomId === roomID){
                gameData = room.getCurGameData();
                break;
            }
        }
    }
    cb(null, gameData);
};

Manager.createNewRoomID = function(){
    let gameServers = this.app.getServersByType('game');
    let curServerIndex = 0;
    for (let i = 0; i < gameServers.length; ++i){
        if (gameServers[i].id === this.app.curServer.id){
            curServerIndex = i;
            break;
        }
    }
    let roomID = -1;
    let min = Math.floor(100000/gameServers.length) + 1;
    let max = Math.floor(1000000/gameServers.length) - 1;
    do{
        roomID = utils.getRandomNum(min, max) * gameServers.length + curServerIndex;
    }while(!!this.roomList[roomID] && !!roomID);
    return roomID;
};

Manager.getMatchRoomList = function (gameTypeID) {
    let roomArr = [];
    for (let key in this.roomList){
        if (this.roomList.hasOwnProperty(key)){
            let room = this.roomList[key];
            if (!room.hasEmptyChair()) continue;
            if (room.roomType !== enumeration.roomType.PRIVATE && room.gameTypeInfo.gameTypeID === gameTypeID){
                roomArr.push(key);
            }
        }
    }
    return roomArr;
};
