var code = require('../../../constant/code');
var robotManager = require('../domain/robotManager');

module.exports = function (app) {
    return new robotRemote(app);
};

var robotRemote = function (app) {
    this.app = app;
};
var pro = robotRemote.prototype;

pro.requestRobotNotify = function(roomID, gameTypeInfo, robotCount, cb){
    cb();
    robotManager.requestRobotNotify(roomID, gameTypeInfo, robotCount);
};

pro.robotLeaveRoomNotify = function (kind, uidArr, cb) {
    cb();
    robotManager.robotLeaveRoomNotify(kind, uidArr);
};

pro.gameTypesUpdateNotify = function (gameTypes, cb) {
    robotManager.gameTypes = gameTypes;
    cb();
};

