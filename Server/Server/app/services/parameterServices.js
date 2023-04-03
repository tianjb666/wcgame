var enumeration = require('../constant/enumeration');
var rpcAPI = require('../API/rpcAPI');
var dao = require('../dao/commonDao');
var async = require('async');
var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger('pomelo');
let utils = require('../util/utils');

var pro = module.exports;

pro.loadPublicParameter = function (cb) {
    let defaultPublicParameters = require(pomelo.app.getBase() + '/config/publicParameter.json');
    let shouldSave = pomelo.app.getServerId() === 'center';
    dao.findData("publicParameterModel", {}, function (err, result) {
        if (!!err){
            logger.error("loadPublicParameter", "err:" + err);
            utils.invokeCallback(cb, err);
        }else{
            let publicParameters = {};
            for (let key in defaultPublicParameters){
                if(defaultPublicParameters.hasOwnProperty(key)){
                    let isExist = false;
                    for (let i = 0; i < result.length; ++i){
                        if (result[i].key === key){
                            isExist = true;
                            publicParameters[key] = result[i].value;
                            break;
                        }
                    }
                    if (!isExist){
                        let value = defaultPublicParameters[key].value;
                        if (typeof value !== 'string'){
                            value = JSON.stringify(value);
                        }
                        if (shouldSave){
                            let saveData = {};
                            saveData.key = key;
                            saveData.value = value;
                            saveData.describe = defaultPublicParameters[key].describe;
                            dao.createData("publicParameterModel", saveData, function(err){
                                if (!!err){
                                    logger.error("loadPublicParameter", "defaultPublicParameters err:" + err);
                                }
                            });
                        }
                        publicParameters[key] = value
                    }
                }
            }
            for (let j = 0; j < result.length; ++j){
                if (publicParameters.hasOwnProperty(result[j].key)) continue;
                publicParameters[result[j].key] = result[j].value;
            }
            pomelo.app.set('publicParameter', publicParameters);
            utils.invokeCallback(cb, err);
        }
    });
};

pro.loadGameTypes = function (cb) {
    let defaultGameTypes = require(pomelo.app.getBase() + '/config/gameTypes.json');
    let shouldSave = pomelo.app.getServerId() === 'center';
    dao.findData("gameTypeModel", {}, function (err, result) {
        if (!!err){
            logger.error("loadGameTypes", "err:" + err);
            utils.invokeCallback(cb, err);
        }else{
            let gameTypes = [];
            if (result.length === 0){
                for(let i = 0; i < defaultGameTypes.length; ++i){
                    let gameType = defaultGameTypes[i];
                    gameType.gameTypeID = utils.getUniqueIndex();
                    gameType.parameters = JSON.stringify(gameType.parameters || {});
                    gameTypes.push(gameType);
                }
                if(shouldSave){
                    dao.createDataArr("gameTypeModel", gameTypes, function (err) {
                        if (!!err){
                            logger.error("loadGameTypes", "err:" + err);
                        }
                    });
                }
            }else{
                for (let j = 0; j < result.length; ++j){
                    gameTypes.push(result[j]._doc);
                }
            }
            pomelo.app.set('gameTypes', gameTypes);
            utils.invokeCallback(cb);
        }
    });
};

pro.loadAgentProfitConfig = function (cb) {
    let defaultProfit = require(pomelo.app.getBase() + '/config/profit.json');
    let shouldSave = pomelo.app.getServerId() === 'center';
    dao.findData("agentProfitModel", {}, function (err, result) {
        if (!!err){
            logger.error("loadAgentProfitConfig", "err:" + err);
            utils.invokeCallback(cb, err);
        }else{
            let agentProfit = [];
            if (result.length === 0){
                for(let i = 0; i < defaultProfit.length; ++i){
                    let profit = defaultProfit[i];
                    profit.index = utils.getUniqueIndex();
                    if(shouldSave){
                        dao.createData("agentProfitModel", profit, function (err) {
                            if (!!err){
                                logger.error("loadAgentProfitConfig", "err:" + err);
                            }
                        });
                    }
                    agentProfit.push(profit);
                }
            }else{
                for (let j = 0; j < result.length; ++j){
                    agentProfit.push(result[j]._doc);
                }
            }
            pomelo.app.set('agentProfit', agentProfit);
            utils.invokeCallback(cb);
        }
    });
};

pro.updatePublicParameter = function(app, newParameter, cb){
    app.set('publicParameter', newParameter);
    var gameServerArr = app.getServersByType('game');
    for(var i = 0; i < gameServerArr.length; ++i){
        rpcAPI.updatePublicParameterToGame(app, gameServerArr[i].id, newParameter, function(err){
            if (!!err){
                logger.error("updatePublicParameter", "updatePublicParameterToGame err:" + err);
            }
        });
    }
    var hallServerArr = app.getServersByType('hall');
    for(var i = 0; i < hallServerArr.length; ++i){
        rpcAPI.updatePublicParameterToHall(app, hallServerArr[i].id, newParameter, function(err){
            if (!!err){
                logger.error("updatePublicParameter", "updatePublicParameterToHall err:" + err);
            }
        });
    }
    rpcAPI.updatePublicParameterToGameHttp(app, newParameter, function (err){
        if (!!err){
            logger.error("updatePublicParameter", "updatePublicParameterToGameHttp err:" + err);
        }
    });
    cb();
};

pro.updatePublicParameterByKey = function(app, operationType, key, value, cb){
    var publicParameter = app.get('publicParameter');
    var dataValue = publicParameter[key];
    async.waterfall([
        function(cb){
            if (operationType === enumeration.updateDataType.ADD || operationType === enumeration.updateDataType.UPDATE){
                if (!!dataValue){
                    dao.updateData("publicParameterModel", {key: key}, {value: value}, function(err){
                        if (!err){
                            publicParameter[key] = value;
                        }
                        cb(err);
                    });
                }else{
                    dao.createData("publicParameterModel", {key: key, value: value}, function(err){
                        if (!err){
                            publicParameter[key] = value;
                        }
                        cb(err);
                    });
                }
            } else if(operationType === enumeration.updateDataType.REMOVE){
                dao.deleteData({key: key}, function(err){
                    if (!err){
                        delete publicParameter[key];
                    }
                    cb(err);
                });
            } else{
                cb(code.REQUEST_DATA_ERROR);
            }
        }
    ], function(err){
        if (!!err){
            logger.error("updatePublicParameterByKey err:" + err);
        }else{
            app.set('publicParameter', publicParameter);
        }
        cb(err);
    });
};

pro.buildClientParameter = function(publicParameter){
    var showKeyArr = {
        platformTip: true,
        loopBroadcastContent: true,
        minKeepGold: true,
        minWithdrawCash: true,
        minRechargeCount: true,
        oneRMBToGold: true,
        offlineRechargeOwnerName: true,
        offlineRechargeBankName: true,
        offlineRechargeBankCardNum: true,
        rechargeService: true,
        shopItems: true,
        withdrawCashBillPercentage: true,
        rechargeConfig: true
    };
    var clientParameter = {};
    for (var key in publicParameter){
        if (publicParameter.hasOwnProperty(key)){
            if (!!showKeyArr[key]) {
                clientParameter[key] = publicParameter[key];
            }
        }
    }
    return clientParameter;
};

pro.getGameTypeInfo = function (gameTypeID) {
    let gameTypes = pomelo.app.get("gameTypes");
    if (!gameTypes) return null;
    for (let i = 0; i < gameTypes.length; ++i){
        if (gameTypes[i].gameTypeID === gameTypeID){
            return gameTypes[i];
        }
    }
    return null;
};

