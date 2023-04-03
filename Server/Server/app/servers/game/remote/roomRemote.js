/**
 * Created by zjgame on 2017/2/22.
 */
var code = require('../../../constant/code');

module.exports = function (app) {
    return new roomRemote(app);
};

var roomRemote = function (app) {
    this.app = app;
    this.mgr = app.roomManager;
};
var pro = roomRemote.prototype;

pro.createRoom = function(userInfo, frontendId, gameRule, gameTypeInfo, cb){
    this.mgr.createRoom(userInfo, frontendId, gameRule, gameTypeInfo, cb);
};

pro.createMatchRoom = function (userInfoArr, gameTypeInfo, cb) {
    this.mgr.createMatchRoom(userInfoArr, gameTypeInfo, cb);
};

pro.joinRoom = function (userInfo, frontendId, roomID, cb) {
    this.mgr.joinRoom(userInfo, frontendId, roomID, cb);
};

pro.leaveRoom = function(roomID, uid, cb){
    this.mgr.leaveRoom(roomID, uid, cb);
};

pro.isUserInRoom = function(uid, roomId, cb) {
	this.mgr.isUserInRoom(uid, roomId, cb);
};

pro.searchRoomByUid = function(uid, cb){
    this.mgr.searchRoomByUid(uid, cb);
};

pro.getRoomGameDataByKind = function(kindID, cb){
    this.mgr.getRoomGameDataByKind(kindID, cb);
};

pro.getRoomGameDataByRoomID = function (roomID, cb) {
    this.mgr.getRoomGameDataByRoomID(roomID, cb);
};

/*
pro.exitRoom = function (roomID, uid, cb){
    this.mgr.exitRoom(roomID, uid, cb);
};
*/

pro.onUserOffLine = function (uid, roomID, cb){
    this.mgr.onUserOffLine(uid, roomID, cb);
};

pro.userRoomMessage = function (uid, roomID, msg, cb) {
    var roomFrame = this.mgr.getRoomFrameByID(roomID);

    if (!roomFrame){
        cb(code.REQUEST_DATA_ERROR);
    }
    else {
        roomFrame.receiveRoomMessage(uid, msg);
        cb();
    }
};

pro.userGameMessage = function (uid, roomID, msg, cb){
    var roomFrame = this.mgr.getRoomFrameByID(roomID);

    if (!roomFrame){
        cb(code.REQUEST_DATA_ERROR);
    }
    else {
        roomFrame.receiveGameMessage(uid, msg);
        cb();
    }
};

pro.updateRoomUserInfo = function (newUserInfo, roomID, cb){
    var roomFrame = this.mgr.getRoomFrameByID(roomID);
    if (!roomFrame){
        cb(code.REQUEST_DATA_ERROR);
    }
    else {
        roomFrame.updateRoomUserInfo(newUserInfo, false, cb);
    }
};

pro.updatePublicParameter = function(newParameters, cb){
    this.app.set('publicParameter', newParameters);
    cb();
};

pro.superControllerRequest = function(type, roomID, zuoBaoID, cb){
    var roomFrame = this.mgr.getRoomFrameByID(roomID);

    if (!roomFrame){
        cb(code.GAME_CENTER.ROOM_NOT_EXIST);
    }else{
        if (type === "get"){
            cb(null, roomFrame.getBankDirection());
        }else if (type === "set"){
            cb(null, roomFrame.setBankDirection(zuoBaoID));
        }else{
            cb(code.REQUEST_DATA_ERROR);
        }
    }
};

pro.getMatchRoomList = function (gameTypeID, cb) {
    cb(null, this.mgr.getMatchRoomList(gameTypeID));
};

