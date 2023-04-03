var pomelo = require('pomelo');
var utils = require('../util/utils');
var logger = require('pomelo-logger').getLogger('pomelo');
var code = require('../constant/code');

var dao = module.exports;

dao.getRechargeStatisticsInfo = function(matchData, cb){
    var rechargeRecordModel = pomelo.app.get('dbClient').rechargeRecordModel;
    rechargeRecordModel.aggregate([
        {$match: matchData},
        {$group: {_id: "$uid",count: {$sum: 1}, total:{$sum: "$rechargeMoney"}, maxCount: {$max: "$rechargeMoney"}}}
    ]).exec(function(err,result){
        if (!!err){
            logger.err('getRechargeStatisticsInfo', "error:" +  err);
            utils.invokeCallback(cb, code.MYSQL_ERROR);
        }else{
            utils.invokeCallback(cb, null, result);
        }
    });
};

dao.getRechargeStatisticsInfoGroupByDay = function(matchData, cb){
    var rechargeRecordModel = pomelo.app.get('dbClient').rechargeRecordModel;
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
            logger.err('getRechargeStatisticsInfoGroupByDay', "error:" +  err);
            cb(code.MYSQL_ERROR);
        }else{
            cb(null, result);
        }
    });
};

dao.getGameProfitStatisticsInfo = function (matchData, cb) {
    let gameProfitRecordSchemaModel = pomelo.app.get('dbClient').gameProfitRecordSchemaModel;
    gameProfitRecordSchemaModel.aggregate([
        {$match: matchData},
        {$group: {_id: null, total:{$sum: "$count"}}}
    ]).exec(function(err,result){
        if (!!err){
            logger.err('getGameProfitStatisticsInfo', "error:" +  err);
            utils.invokeCallback(cb, code.MYSQL_ERROR);
        }else{
            utils.invokeCallback(cb, null, result);
        }
    });
};

dao.getInventoryExtractStatisticsInfo = function (matchData, cb) {
    let inventoryValueExtractRecordModel = pomelo.app.get('dbClient').inventoryValueExtractRecordModel;
    inventoryValueExtractRecordModel.aggregate([
        {$match: matchData},
        {$group: {_id: null, total:{$sum: "$count"}}}
    ]).exec(function(err,result){
        if (!!err){
            logger.err('getInventoryExtractStatisticsInfo', "error:" +  err);
            utils.invokeCallback(cb, code.MYSQL_ERROR);
        }else{
            utils.invokeCallback(cb, null, result);
        }
    });
};

dao.getInventoryModifyStatisticsInfo = function (matchData, cb) {
    let modifyInventoryValueRecordModel = pomelo.app.get('dbClient').modifyInventoryValueRecordModel;
    modifyInventoryValueRecordModel.aggregate([
        {$match: matchData},
        {$group: {_id: null, total:{$sum: "$count"}}}
    ]).exec(function(err,result){
        if (!!err){
            logger.err('getInventoryModifyStatisticsInfo', "error:" +  err);
            utils.invokeCallback(cb, code.MYSQL_ERROR);
        }else{
            utils.invokeCallback(cb, null, result);
        }
    });
};

dao.getCommissionExtractStatisticsInfo = function (matchData, cb) {
    let extractionCommissionRecordModel = pomelo.app.get('dbClient').extractionCommissionRecordModel;
    extractionCommissionRecordModel.aggregate([
        {$match: matchData},
        {$group: {_id: null, total:{$sum: "$count"}}}
    ]).exec(function(err,result){
        if (!!err){
            logger.err('getCommissionExtractStatisticsInfo', "error:" +  err);
            utils.invokeCallback(cb, code.MYSQL_ERROR);
        }else{
            utils.invokeCallback(cb, null, result);
        }
    });
};

dao.getWithdrawCashStatisticsInfo = function (matchData, cb) {
    let withdrawCashRecordModel = pomelo.app.get('dbClient').withdrawCashRecordModel;
    withdrawCashRecordModel.aggregate([
        {$match: matchData},
        {$group: {_id: null, total:{$sum: "$count"}}}
    ]).exec(function(err,result){
        if (!!err){
            logger.err('getWithdrawCashStatisticsInfo', "error:" +  err);
            utils.invokeCallback(cb, code.MYSQL_ERROR);
        }else{
            utils.invokeCallback(cb, null, result);
        }
    });
};

dao.getUserGoldStatisticsInfo = function (matchData, cb) {
    let userModel = pomelo.app.get('dbClient').userModel;
    userModel.aggregate([
        {$match: matchData},
        {$group: {_id: null, total:{$sum: "$gold"}}}
    ]).exec(function(err,result){
        if (!!err){
            logger.err('getUserGoldStatisticsInfo', "error:" +  err);
            utils.invokeCallback(cb, code.MYSQL_ERROR);
        }else{
            utils.invokeCallback(cb, null, result);
        }
    });
};