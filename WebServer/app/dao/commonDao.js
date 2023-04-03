var logger = console;//require('pomelo-logger').getLogger('pomelo');
var utils = require('../util/utils');
var code = require('../constant/code');

var dao = module.exports;

dao.createData = function (modelKey, saveData, cb) {
    var model = global.mongoClient[modelKey];
    if (!model) {
        logger.error("createData", "not find model:" + modelKey);
        utils.invokeCallback(cb, code.MYSQL_ERROR);
    }else{
        var newData = new model(saveData);
        newData.save(function (err, res) {
            if (!!err) {
                logger.error("createData", " model=" + modelKey + ", saveData=" + JSON.stringify(saveData) + ", err:" + err);
                utils.invokeCallback(cb, code.MYSQL_ERROR);
            } else {
                utils.invokeCallback(cb, null, res);
            }
        });
    }
};

dao.createDataArr = function (modelKey, saveDataArr, cb) {
    var model = global.mongoClient[modelKey];
    if (!model) {
        logger.error("createData", "not find model:" + modelKey);
        utils.invokeCallback(cb, code.MYSQL_ERROR);
    }else{
        model.create(saveDataArr, function (err, res) {
            if (!!err) {
                logger.error("createData", " model=" + modelKey + ", saveData=" + JSON.stringify(saveDataArr) + ", err:" + err);
                utils.invokeCallback(cb, code.MYSQL_ERROR);
            } else {
                utils.invokeCallback(cb, null, res);
            }
        });
    }
};

dao.findOneData = function (modelKey, matchData, cb) {
    var model = global.mongoClient[modelKey];
    if (!model) {
        logger.error("findOneData","not find model:" + modelKey);
        utils.invokeCallback(cb, code.MYSQL_ERROR);
    }else{
        model.findOne(matchData, function (err, result){
            if(!!err) {
                logger.error("findOneData", "model=" + modelKey + ", matchData=" + JSON.stringify(matchData) + ", err:" + err);
                utils.invokeCallback(cb, code.MYSQL_ERROR);
            } else{
                utils.invokeCallback(cb, null, result);
            }
        });
    }
};

dao.findData = function (modelKey, matchData, cb) {
    var model = global.mongoClient[modelKey];
    if (!model) {
        logger.error("findData", "not find model:" + modelKey);
        utils.invokeCallback(cb, code.MYSQL_ERROR);
    }else{
        model.find(matchData, function (err, result){
            if(!!err) {
                logger.error("findData", "model=" + modelKey + ", matchData=" + JSON.stringify(matchData) + ", err:" + err);
                utils.invokeCallback(cb, code.MYSQL_ERROR);
            } else{
                utils.invokeCallback(cb, null, result);
            }
        });
    }
};

dao.findDataAndCount = function (modelKey, startIndex, count, sortData, matchData, cb) {
    var model = global.mongoClient[modelKey];
    if (!model) {
        logger.error("findDataAndCount", "not find model:" + modelKey);
        utils.invokeCallback(cb, code.MYSQL_ERROR);
    }else{
        model.find(matchData).sort(sortData).skip(startIndex).limit(Number(count)).exec(function (err, result){
            if(!!err) {
                logger.error("findDataAndCount", "model=" + modelKey + ", matchData=" + JSON.stringify(matchData) + ", err:" + err);
                utils.invokeCallback(cb, code.MYSQL_ERROR);
            } else{
                dao.getDataCount(modelKey, matchData, function (err, count) {
                    if (!!err){
                        utils.invokeCallback(cb, err);
                    }else {
                        utils.invokeCallback(cb, null, result, count);
                    }
                });
            }
        });
    }
};

dao.getDataCount = function (modelKey, matchData, cb) {
    var model = global.mongoClient[modelKey];
    if (!model) {
        logger.error("getDataCount", "not find model:" + modelKey);
        utils.invokeCallback(cb, code.MYSQL_ERROR);
    }else{
        model.find(matchData).count().exec(function (err, res) {
            if (!!err){
                logger.error("getDataCount", "model=" + modelKey + ", matchData=" + JSON.stringify(matchData) + ", err:" + err);
                utils.invokeCallback(cb, code.MYSQL_ERROR);
            }else{
                utils.invokeCallback(cb, null, res);
            }
        })
    }
};

dao.findOneAndUpdate = function (modelKey, matchData, saveData, cb) {
    var model = global.mongoClient[modelKey];
    if (!model) {
        logger.error("findOneAndUpdate", "not find model:" + modelKey);
        utils.invokeCallback(cb, code.MYSQL_ERROR);
    }else{
        model.findOneAndUpdate(matchData, saveData, function(err, res){
            if (!!err){
                logger.error("findOneAndUpdate", "model=" + modelKey + ", matchData=" + JSON.stringify(matchData) + ", saveData=" + saveData + ", err:" + err);
                utils.invokeCallback(cb, code.MYSQL_ERROR);
            }else{
                utils.invokeCallback(cb, null, res);
            }
        });
    }
};

dao.findOneAndUpdateEx = function (modelKey, matchData, saveData, options, cb) {
    var model = global.mongoClient[modelKey];
    if (!model) {
        logger.error("findDataAndUpdateEx", "not find model:" + modelKey);
        utils.invokeCallback(cb, code.MYSQL_ERROR);
    }else{
        model.findOneAndUpdate(matchData, saveData, options, function(err, res){
            if (!!err){
                logger.error("findDataAndUpdateEx", "model=" + modelKey + ", matchData=" + JSON.stringify(matchData) + ", saveData=" + saveData + ", err:" + err);
                utils.invokeCallback(cb, code.MYSQL_ERROR);
            }else{
                utils.invokeCallback(cb, null, res);
            }
        });
    }
};


dao.updateData = function (modelKey, matchData, saveData, cb){
    var model = global.mongoClient[modelKey];
    if (!model) {
        logger.error("updateData", "not find model:" + modelKey);
        utils.invokeCallback(cb, code.MYSQL_ERROR);
    }else{
        model.update(matchData, saveData).exec(function(err, res){
            if (!!err){
                logger.error("updateData", "model=" + modelKey + ", matchData=" + JSON.stringify(matchData) + ", saveData=" + saveData + ", err:" + err);
                utils.invokeCallback(cb, code.MYSQL_ERROR);
            }else{
                utils.invokeCallback(cb, null, res);
            }
        });
    }
};

dao.updateDataEx = function (modelKey, matchData, saveData, options, cb){
    var model = global.mongoClient[modelKey];
    if (!model) {
        logger.error("updateData", "not find model:" + modelKey);
        utils.invokeCallback(cb, code.MYSQL_ERROR);
    }else{
        model.update(matchData, saveData, options, function(err, res){
            if (!!err){
                logger.error("updateData", "model=" + modelKey + ", matchData=" + JSON.stringify(matchData) + ", saveData=" + saveData + ", err:" + err);
                utils.invokeCallback(cb, code.MYSQL_ERROR);
            }else{
                utils.invokeCallback(cb, null, res);
            }
        });
    }
};

dao.updateAllData = function (modelKey, matchData, saveData, cb) {
    var model = global.mongoClient[modelKey];
    if (!model) {
        logger.error("updateAllData", "not find model:" + modelKey);
        utils.invokeCallback(cb, code.MYSQL_ERROR);
    }else{
        model.update(matchData, saveData, {multi: true}, function(err, res){
            if (!!err){
                logger.error("updateData", "model=" + modelKey + ", matchData=" + JSON.stringify(matchData) + ", saveData=" + saveData + ", err:" + err);
                utils.invokeCallback(cb, code.MYSQL_ERROR);
            }else{
                utils.invokeCallback(cb, null, res);
            }
        });
    }
};

dao.deleteData = function (modelKey, matchData, cb){
    var model = global.mongoClient[modelKey];
    if (!model) {
        logger.error("updateAllData", "not find model:" + modelKey);
        utils.invokeCallback(cb, code.MYSQL_ERROR);
    }else{
        model.remove(matchData, function(err, res){
            if (!!err){
                logger.error("updateData", "model=" + modelKey + ", matchData=" + JSON.stringify(matchData)  + ", err:" + err);
                utils.invokeCallback(cb, code.MYSQL_ERROR);
            }else{
                utils.invokeCallback(cb, null, res);
            }
        })
    }
};

dao.getRecordData = function(data, cb){
    var model = global.mongoClient[data.model];
    if (!!data["saveData"]){
        var record = new model(data["saveData"]);
        record.save(function(err){
            if (!!err){
                utils.invokeCallback(cb, code.MYSQL_ERROR);
            } else{
                utils.invokeCallback(cb);
            }
        });
    }else if (!!data["findData"]){
        model.find(data["findData"], function(err,result){
            if (!!err){
                utils.invokeCallback(cb, code.MYSQL_ERROR);
            }else{
                utils.invokeCallback(cb, null, result);
            }
        })
    }else if (!!data["matchData"]){
        model.update(data["matchData"], data.updateData, function(err){
            if (!!err){
                utils.invokeCallback(cb, code.MYSQL_ERROR);
            }else{
                utils.invokeCallback(cb);
            }
        })
    }else{
        utils.invokeCallback(cb);
    }
};