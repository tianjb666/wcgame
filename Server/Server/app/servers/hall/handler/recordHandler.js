var code = require('../../../constant/code');
var enumeration = require('../../../constant/enumeration');
var dao = require('../../../dao/commonDao');
var logger = require('pomelo-logger').getLogger('pomelo');
var userInfoServices = require('../../../services/userInfoServices');
var DAY_MS = 24 * 60 * 60 * 100;
var WEEK_MS = 7 * DAY_MS;

module.exports = function(app) {
    return new Handler(app);
};

var Handler = function(app) {
    this.app = app;
};

Handler.prototype.getRecordData = function(msg, session, next){
    if (!session.uid){
        next(null, {code: code.INVALID_UERS});
        return;
    }
    var recordType = msg.recordType;
    var startIndex = msg.startIndex || 0;
    var count = msg.count || 20;
    var modelKey = "";
    if (recordType === enumeration.recordType.RECHARGE){
        modelKey = "rechargeRecordModel";
    }else if (recordType === enumeration.recordType.WITHDRAWALS){
        modelKey = "withdrawCashRecordModel";
    }else if (recordType === enumeration.recordType.GAME){
        modelKey = "userGameRecordModel";
    }else if (recordType === enumeration.recordType.LOGIN){
        modelKey = "loginRecordModel";
    }else if (recordType === enumeration.recordType.EXTRACT_COMMISSION){
        modelKey = "extractionCommissionRecordModel";
    }
    var matchData = {
        uid: session.uid,
        createTime: {$gte: Date.now() - WEEK_MS}
    };
    dao.findDataAndCount(modelKey, startIndex, count, {createTime: -1}, matchData, function (err, result, totalCount) {
        if (!!err){
            logger.error("getRecordData", "msg:" + msg + ",err:" + err);
            next(null, {code: err});
        }else{
            var recordArr = [];
            for (var i = 0; i < result.length; ++i){
                recordArr.push(result[i]._doc);
            }
            next(null, {code: code.OK, msg: {recordArr: recordArr, totalCount: totalCount}});
        }
    });
};

Handler.prototype.getGameRecordDataRequest = function (msg, session, next) {
    if (!session.uid){
        next(null, {code: code.INVALID_UERS});
        return;
    }

    let startIndex = msg.startIndex || 0;
    let count = msg.count || 10;
    let modelKey = "userGameRecordModel";
    dao.findDataAndCount(modelKey, startIndex, count, msg.sortData, msg.matchData, function (err, result, totalCount) {
        if (!!err){
            logger.error("getGameRecordDataRequest", "msg:" + msg + ",err:" + err);
            next(null, {code: err});
        }else{
            let recordArr = [];
            for (let i = 0; i < result.length; ++i){
                recordArr.push(result[i]._doc);
            }
            next(null, {code: code.OK, msg: {recordArr: recordArr, totalCount: totalCount}});
        }
    });
};

Handler.prototype.getDirectlyMemberRecordData = function(msg, session, next){
    if (!session.uid){
        next(null, {code: code.INVALID_UERS});
        return;
    }
    var startIndex = msg.startIndex || 0;
    var count = msg.count || 20;
    var matchData = {
        spreaderID: session.uid
    };
    dao.findDataAndCount("userModel", startIndex, count, {createTime: -1}, matchData, function (err, result, totalCount) {
        if (!!err){
            logger.error("getDirectlyMemberRecordData", "msg:" + msg + ",err:" + err);
            next(null, {code: err});
        }else{
            var recordArr = [];
            for (var i = 0; i < result.length; ++i){
                recordArr.push(userInfoServices.buildShortMemberInfo(result[i]._doc));
            }
            next(null, {code: code.OK, msg: {recordArr: recordArr, totalCount: totalCount}});
        }
    });
};

Handler.prototype.getAgentMemberRecordData = function(msg, session, next){
    if (!session.uid){
        next(null, {code: code.INVALID_UERS});
        return;
    }
    var startIndex = msg.startIndex || 0;
    var count = msg.count || 20;
    var matchData = {
        spreaderID: session.uid,
        "directlyMemberCount": {$gte: 1}
    };
    dao.findDataAndCount("userModel", startIndex, count, {createTime: -1}, matchData, function (err, result, totalCount) {
        if (!!err){
            logger.error("getAgentMemberRecordData", "msg:" + msg + ",err:" + err);
            next(null, {code: err});
        }else{
            var recordArr = [];
            for (var i = 0; i < result.length; ++i){
                recordArr.push(userInfoServices.buildShortAgentInfo(result[i]._doc));
            }
            next(null, {code: code.OK, msg: {recordArr: recordArr, totalCount: totalCount}});
        }
    });
};