var code = require('../../../constant/code');
var controllerManager = require('../domain/controllerManager');
var commonDao = require('../../../dao/commonDao');
var logger = require('pomelo-logger').getLogger('pomelo');

module.exports = function (app) {
    return new controllerRemote(app);
};

var controllerRemote = function (app) {
    this.app = app;
};
var pro = controllerRemote.prototype;

pro.getCurRobotWinRate = function(kind, cb){
    cb(null, controllerManager.getCurRobotWinRate(kind));
};

pro.robotGoldChanged = function (kind, count, cb) {
    controllerManager.robotGoldChanged(kind, count);
    cb();
};

pro.getGameControllerData = function (kindID, cb){
    cb(null, controllerManager.getGameControllerData(kindID));
};

pro.updateGameControllerData = function (kind, data, cb) {
    controllerManager.updateGameControllerData(kind, data, function (err) {
        cb(err);
    })
};

pro.modifyInventoryValue = function (uid, kind, count, cb) {
    if (!kind || (typeof count !== 'number')){
        cb(code.REQUEST_DATA_ERROR);
    }else{
        let gameControllerData = controllerManager.getGameControllerData(kind);
        if (!!gameControllerData){
            controllerManager.robotGoldChanged(kind, count);
            let saveData = {
                uid: uid,
                kind: kind,
                count: count,
                leftCount: gameControllerData.curInventoryValue,
                createTime: Date.now()
            };
            commonDao.createData("modifyInventoryValueRecordModel", saveData, function (err) {
                if(!!err){
                    logger.error("modifyInventoryValue err:" + err);
                }
            });
            cb(code.OK);
        }else{
            cb(code.REQUEST_DATA_ERROR);
        }
    }
};
