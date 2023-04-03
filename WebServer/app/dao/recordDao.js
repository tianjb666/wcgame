var utils = require('../util/utils');
var logger = console;
var code = require('../constant/code');

var dao = module.exports;

dao.getRechargeStatisticsInfo = function(matchData, cb){
    var rechargeRecordModel = global.mongoClient.rechargeRecordModel;
    rechargeRecordModel.aggregate([
        {$match: matchData},
        {$group: {_id: "$uid",count: {$sum: 1}, total:{$sum: "$rechargeMoney"}, maxCount: {$max: "$rechargeMoney"}}}
    ]).exec(function(err,result){
        if (!!err){
            logger.error('getRechargeStatisticsInfo', "error:" +  err);
            utils.invokeCallback(cb, code.MYSQL_ERROR);
        }else{
            utils.invokeCallback(cb, null, result);
        }
    });
};

dao.getRechargeStatisticsInfoGroupByDay = function(matchData, cb){
    var rechargeRecordModel = global.mongoClient.rechargeRecordModel;
    var DAY_MS = 24 * 60 * 60 * 1000;
    var offMS = 8 * 60 * 60 * 1000;
    rechargeRecordModel.aggregate([
        {$match: matchData},
        {$project: {
            day: {$floor:{$divide: [{$add: ["$createTime", offMS]}, DAY_MS]}},
            rechargeMoney: "$rechargeMoney",
            diamondCount: "$diamondCount",
            couponCount: "$couponCount"
        }},
        {$group: {_id: "$day", totalCount:{$sum: "$rechargeMoney"}, totalDiamondCount:{$sum: "$diamondCount"}, totalCouponCount:{$sum: "$couponCount"}}}
    ]).exec(function(err,result){
        if (!!err){
            logger.error('getRechargeStatisticsInfoGroupByDay', "error:" +  err);
            cb(code.MYSQL_ERROR);
        }else{
            cb(null, result);
        }
    });
};

dao.getGameProfitStatisticsInfo = function (matchData, cb) {
    let gameProfitRecordSchemaModel = global.mongoClient.gameProfitRecordSchemaModel;
    gameProfitRecordSchemaModel.aggregate([
        {$match: matchData},
        {$group: {_id: null, total:{$sum: "$count"}}}
    ]).exec(function(err,result){
        if (!!err){
            logger.error('getGameProfitStatisticsInfo', "error:" +  err);
            utils.invokeCallback(cb, code.MYSQL_ERROR);
        }else{
            utils.invokeCallback(cb, null, result);
        }
    });
};

dao.getInventoryExtractStatisticsInfo = function (matchData, cb) {
    let inventoryValueExtractRecordModel = global.mongoClient.inventoryValueExtractRecordModel;
    inventoryValueExtractRecordModel.aggregate([
        {$match: matchData},
        {$group: {_id: null, total:{$sum: "$count"}}}
    ]).exec(function(err,result){
        if (!!err){
            logger.error('getInventoryExtractStatisticsInfo', "error:" +  err);
            utils.invokeCallback(cb, code.MYSQL_ERROR);
        }else{
            utils.invokeCallback(cb, null, result);
        }
    });
};

dao.getInventoryModifyStatisticsInfo = function (matchData, cb) {
    let modifyInventoryValueRecordModel = global.mongoClient.modifyInventoryValueRecordModel;
    modifyInventoryValueRecordModel.aggregate([
        {$match: matchData},
        {$group: {_id: null, total:{$sum: "$count"}}}
    ]).exec(function(err,result){
        if (!!err){
            logger.error('getInventoryModifyStatisticsInfo', "error:" +  err);
            utils.invokeCallback(cb, code.MYSQL_ERROR);
        }else{
            utils.invokeCallback(cb, null, result);
        }
    });
};

dao.getCommissionExtractStatisticsInfo = function (matchData, cb) {
    let extractionCommissionRecordModel = global.mongoClient.extractionCommissionRecordModel;
    extractionCommissionRecordModel.aggregate([
        {$match: matchData},
        {$group: {_id: null, total:{$sum: "$count"}}}
    ]).exec(function(err,result){
        if (!!err){
            logger.error('getCommissionExtractStatisticsInfo', "error:" +  err);
            utils.invokeCallback(cb, code.MYSQL_ERROR);
        }else{
            utils.invokeCallback(cb, null, result);
        }
    });
};

dao.getWithdrawCashStatisticsInfo = function (matchData, cb) {
    let withdrawCashRecordModel = global.mongoClient.withdrawCashRecordModel;
    withdrawCashRecordModel.aggregate([
        {$match: matchData},
        {$group: {_id: null, total:{$sum: "$count"}}}
    ]).exec(function(err,result){
        if (!!err){
            logger.error('getWithdrawCashStatisticsInfo', "error:" +  err);
            utils.invokeCallback(cb, code.MYSQL_ERROR);
        }else{
            utils.invokeCallback(cb, null, result);
        }
    });
};

dao.getUserGoldStatisticsInfo = function (matchData, cb) {
    let userModel = global.mongoClient.userModel;
    userModel.aggregate([
        {$match: matchData},
        {$group: {_id: null, total:{$sum: "$gold"}}}
    ]).exec(function(err,result){
        if (!!err){
            logger.error('getUserGoldStatisticsInfo', "error:" +  err);
            utils.invokeCallback(cb, code.MYSQL_ERROR);
        }else{
            utils.invokeCallback(cb, null, result);
        }
    });
};