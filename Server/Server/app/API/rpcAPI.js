var exp = module.exports = {};
var pomelo = require('pomelo');

exp.rpc = function () {
    let routeArr = arguments[0].split('.');
    let args = [];
    for (let key in arguments){
        if (key === '0') continue;
        if (arguments.hasOwnProperty(key)){
            args.push(arguments[key]);
        }
    }
    pomelo.app.rpc[routeArr[0]][routeArr[1]][routeArr[2]].toServer.apply(null, args);
};

// ------------------------------用户相关-----------------------------
exp.userLeave = function(app, serverID, uid, roomID, cb){
    pomelo.app.rpc.hall.entryRemote.leave.toServer(serverID, uid, roomID, cb);
};

// ------------------------------大厅业务相关-----------------------------
exp.updatePublicParameterToHall = function(app, serverID, newParameter, cb){
    pomelo.app.rpc.hall.notifyRemote.updatePublicParameter.toServer(serverID, newParameter, cb);
};

exp.updatePublicParameterToGame = function(app, serverID, newParameter, cb){
    pomelo.app.rpc.game.roomRemote.updatePublicParameter.toServer(serverID, newParameter, cb);
};

exp.updatePublicParameterToGameHttp = function(app, newParameter, cb){
    pomelo.app.rpc.http.notifyRemote.updatePublicParameter.toServer('http', newParameter, cb);
};

exp.exitMatchList = function (app, uid, cb) {
    pomelo.app.rpc.hall.notifyRemote.exitMatchList.toServer('hall', uid, cb);
};

// ------------------------------房间相关-----------------------------
exp.joinRoom = function(serverID, userInfo, frontendId, roomID, cb){
    pomelo.app.rpc.game.roomRemote.joinRoom.toServer(serverID, userInfo, frontendId, roomID, cb);
};

exp.createRoom = function(serverID, userInfo, frontendId, gameRule, gameTypeInfo, cb){
    pomelo.app.rpc.game.roomRemote.createRoom.toServer(serverID, userInfo, frontendId, gameRule, gameTypeInfo, cb);
};

exp.createMatchRoom = function (serverID, userInfoArr, gameTypeInfo, cb) {
    pomelo.app.rpc.game.roomRemote.createMatchRoom.toServer(serverID, userInfoArr, gameTypeInfo, cb);
};

exp.getMatchRoomList = function (serverID, gameTypeID, cb) {
    pomelo.app.rpc.game.roomRemote.getMatchRoomList.toServer(serverID, gameTypeID, cb);
};

exp.matchRoom = function(serverID, userInfo, frontendId, cb){
    pomelo.app.rpc.game.roomRemote.matchRoom.toServer(serverID, userInfo, frontendId, cb);
};

exp.leaveRoom = function(app, serverID, roomID, uid, cb){
    pomelo.app.rpc.game.roomRemote.leaveRoom.toServer(serverID, roomID, uid, cb);
};

exp.isUserInRoom = function(serverID, uid, roomId, cb) {
    pomelo.app.rpc.game.roomRemote.isUserInRoom.toServer(serverID, uid, roomId, cb);
};

exp.searchRoomByUid = function(serverID, uid, cb){
    pomelo.app.rpc.game.roomRemote.searchRoomByUid.toServer(serverID, uid, cb);
};

exp.getRoomGameDataByKind = function(serverID, kindID, cb){
    pomelo.app.rpc.game.roomRemote.getRoomGameDataByKind.toServer(serverID, kindID, cb);
};

exp.getRoomGameDataByRoomID = function (serverID, roomID, cb) {
    pomelo.app.rpc.game.roomRemote.getRoomGameDataByRoomID.toServer(serverID, roomID, cb);
};

exp.updateRoomUserInfo = function (app, serverID, newUserInfo, roomID, cb){
    pomelo.app.rpc.game.roomRemote.updateRoomUserInfo.toServer(serverID, newUserInfo, roomID, cb);
};

exp.recharge = function(serverID, rechargePlatform, rechargeData, cb){
    pomelo.app.rpc.hall.rechargeRemote.recharge.toServer(serverID, rechargePlatform, rechargeData, cb);
};

// ------------------------------机器人相关-------------------------------
exp.requestRobotNotify = function (roomID, gameTypeInfo, robotCount, cb) {
    pomelo.app.rpc.robot.robotRemote.requestRobotNotify.toServer("robot", roomID, gameTypeInfo, robotCount, cb);
};

exp.robotLeaveRoomNotify = function (kind, uidArr, cb) {
    pomelo.app.rpc.robot.robotRemote.robotLeaveRoomNotify.toServer("robot", kind, uidArr, cb);
};

exp.getCurRobotWinRate = function (kind, cb) {
    pomelo.app.rpc.robot.controllerRemote.getCurRobotWinRate.toServer("robot", kind, cb);
};

exp.robotGoldChanged = function (kind, count, cb) {
    pomelo.app.rpc.robot.controllerRemote.robotGoldChanged.toServer("robot", kind, count, cb);
};