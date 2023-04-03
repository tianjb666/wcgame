var code = require('../../../constant/code');
var scheduler = require('pomelo-scheduler');
var logger = require('pomelo-logger').getLogger('pomelo');
var async = require('async');
var utils = require('../../../util/utils');
var enumeration = require('../../../constant/enumeration');
var pomelo= require('pomelo');
var dao = require('../../../dao/commonDao');

// 库存值衰减间隔
let EXTRACT_PROFIT_INTERVAL_TIME = 60 * 60 * 1000;

var exp = module.exports;

exp.init = function () {
    this.gameControllerDataArr = [];
    this.curRobotWinRateList = {};
};

exp.afterStartAll = function () {
    this.init();
    this.loadControllerConfig();
};

exp.beforeShutdown = function(cb){
    scheduler.cancelJob(this.scheduleTaskExtractProfitID);
    exp.saveAllGameControllerData(cb);
};

exp.loadControllerConfig = function () {
    let self =this;
    dao.findData("gameControlDataModel", {}, function (err, resultArr) {
        if (!!err){
            logger.error("loadControllerConfig", "err:" + err);
        }else{
            if (!resultArr || resultArr.length === 0){
                self.gameControllerDataArr = require(pomelo.app.getBase() + '/config/gameController.json');
                dao.createDataArr("gameControlDataModel", self.gameControllerDataArr, function (err) {
                    if(!!err){
                        logger.error(err);
                    }
                });
                for (let i = 0; i < self.gameControllerDataArr.length; ++i){
                    self.updateRobotWinRate(self.gameControllerDataArr[i].kind);
                }
            }else{
                for(let i = 0; i < resultArr.length; ++i){
                    self.gameControllerDataArr.push(resultArr[i]._doc);
                    self.updateRobotWinRate(resultArr[i].kind);
                }
            }
            // 库存值衰减定时器
            this.scheduleTaskExtractProfitID = scheduler.scheduleJob({start: Date.now() + EXTRACT_PROFIT_INTERVAL_TIME, period: EXTRACT_PROFIT_INTERVAL_TIME}, exp.scheduleTaskExtractProfit);
        }
    });
};

exp.scheduleTaskExtractProfit = function () {
    for(let i = 0; i < exp.gameControllerDataArr.length; ++i){
        let gameControllerData = exp.gameControllerDataArr[i];
        let rate = gameControllerData.extractionRatio;
        if (rate <= 0) continue;
        let inventoryValue = gameControllerData.curInventoryValue;
        if(inventoryValue <= gameControllerData.minInventoryValue) continue;
        let count = 0;
        if (inventoryValue > 0){
            count = gameControllerData.curInventoryValue * (rate/10000)
        }else{
            count = 0;
        }
        if (count > 0){
            exp.robotGoldChanged(gameControllerData.kind, count * -1, gameControllerData.kind);
        }
        // 创建抽水记录
        let saveData = {
            kind: gameControllerData.kind,
            count: count,
            leftCount: gameControllerData.curInventoryValue,
            createTime: Date.now()
        };
        dao.createData("inventoryValueExtractRecordModel", saveData, function (err) {
            if(!!err){
                logger.error("scheduleTaskExtractProfit createData err:" + err);
            }
        });

        // 存储库存值
        exp.updateGameControllerData(gameControllerData.kind, gameControllerData, function (err) {
            if (!!err){
                logger.error("scheduleTaskExtractProfit updateGameControllerData err:" + err);
            }
        })
    }
};

exp.getCurRobotWinRate = function (kind) {
    return this.curRobotWinRateList[kind]||0;
};

exp.robotGoldChanged = function (kind, count) {
    if (typeof count === 'number'){
        let gameControllerData = this.getGameControllerData(kind);
        if(!gameControllerData) {
            logger.error("gameControllerData not find, kind:" + kind);
            return;
        }
        gameControllerData.curInventoryValue += count;
        exp.updateRobotWinRate(kind);
    }else{
        logger.error("robotGoldChanged err count:" + count);
    }
};

exp.updateRobotWinRate = function (kind) {
    let gameControllerData = this.getGameControllerData(kind);
    if (!gameControllerData) return;
    let robotWinRateInfo = null;
    let robotWinRateArr = gameControllerData.robotWinRateArr;
    if(!robotWinRateArr || robotWinRateArr.length === 0) this.curRobotWinRateList[kind] = 0;
    let index = robotWinRateArr.length - 1;
    for (let i = 0; i < robotWinRateArr.length; ++i){
        if (!!robotWinRateInfo && robotWinRateInfo.inventoryValue <= robotWinRateArr[i].inventoryValue) continue;
        if(robotWinRateArr[i].inventoryValue >= gameControllerData.curInventoryValue){
            robotWinRateInfo = robotWinRateArr[i];
            index = i;
        }
    }
    if (index === 0){
        this.curRobotWinRateList[kind] = robotWinRateArr[0].winRate;
    }else if (index === robotWinRateArr.length - 1){
        this.curRobotWinRateList[kind] = robotWinRateArr[robotWinRateArr.length - 1].winRate;
    }else{
        let min = robotWinRateArr[index - 1];
        let max = robotWinRateArr[index];
        if (max.inventoryValue - min.inventoryValue === 0){
            this.curRobotWinRateList[kind] = min.winRate;
        }else{
            this.curRobotWinRateList[kind] = (max.winRate - min.winRate)/(max.inventoryValue - min.inventoryValue) * (gameControllerData.curInventoryValue - min.inventoryValue) + min.winRate;
        }
    }

    logger.debug("robotGoldChanged curInventoryValue:" + gameControllerData.curInventoryValue);
    logger.debug("robotGoldChanged curRobotWinRate:" + this.curRobotWinRateList[kind] + "，kind:" + kind);
};

exp.getGameControllerData = function (kind) {
    for(let key in this.gameControllerDataArr){
        if (this.gameControllerDataArr.hasOwnProperty(key)){
            if (this.gameControllerDataArr[key].kind === kind){
                return this.gameControllerDataArr[key];
            }
        }
    }
    return null;
};

exp.updateGameControllerData = function (kind, data, cb) {
    let self =this;
    dao.updateData("gameControlDataModel", {kind: kind}, data, function (err) {
        if (!!err){
            utils.invokeCallback(cb, err);
        }else{
            for (let i = 0; i < self.gameControllerDataArr.length; ++i){
                if (self.gameControllerDataArr[i].kind === kind){
                    self.gameControllerDataArr[i] = data;
                    break;
                }
            }
            utils.invokeCallback(cb);

            self.updateRobotWinRate(kind);
        }

    });
};

exp.addInventoryValue = function (kind, data) {
    
}

exp.saveAllGameControllerData = function (cb) {
    let tasks = [];
    function saveGameControllerData(data) {
        tasks.push(function (cb) {
            dao.updateData("gameControlDataModel", {kind: data.kind}, data, function (err) {
                if (!!err){
                    utils.invokeCallback(cb, err);
                }else{
                    utils.invokeCallback(cb);
                }
            });
        })
    }
    for(let key in this.gameControllerDataArr){
        if(this.gameControllerDataArr.hasOwnProperty(key)){
            saveGameControllerData(this.gameControllerDataArr[key]);
        }
    }
    async.parallel(tasks, function (err) {
        if (!!err){
            logger.error("saveAllGameControllerData err:" + err);
        }
        utils.invokeCallback(cb);
    })
};