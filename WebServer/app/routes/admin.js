let code = require('../constant/code');
let express = require('express');
let router = express.Router();
let async = require('async');
let commonDao = require('../dao/commonDao');
let recordDao = require('../dao/recordDao');
let enumeration = require('../constant/enumeration');
let userDao = require('../dao/userDao');
let utils = require('../util/utils');
let gameServerInterfaceServices = require('../services/gameServerInterfaceServices');

// -------------------------------------公用相关-----------------------------------
router.post('/retransmissionToGameServer', function (req, res, next) {
    if (!req.session.uid){
        res.send({code: code.INVALID_UERS});
        return;
    }
    if (!req.session.permission){
        res.send({code: code.PERMISSION_NOT_ENOUGH});
        return;
    }

    let route = req.body.route;
    let data = {};
    for (let key in req.body){
        if(key === 'route') continue;
        data[key] = req.body[key];
    }
    data.permission = req.session.permission;
    data.uid = req.session.uid;

    gameServerInterfaceServices.retransmissionToGameServer(route, data, function (err, data) {
        if (!!err){
            res.send({code: code.FAIL});
        }else{
            if (!data){
                res.send({code: code.OK});
            }else{
                res.send(data);
            }
        }
    })
});

// ------------------------------------帐号相关-----------------------------------
router.post('/login', function(req, res, next) {
    let body = req.body;
    if (!body.account || !body.password){
        res.send({code: code.REQUEST_DATA_ERROR});
        return;
    }
    commonDao.findOneData("adminModel", {account: body.account, password: body.password}, function (err, result) {
        if (!!err){
            res.send({code: err});
        }else{
            if (!result){
                // 帐号密码错误
                res.send({code: code.LOGIN.PASSWORD_ERROR});
            }else{
                req.session.uid = result.uid;
                req.session.permission = result.permission;
                res.send({code: code.OK, msg: {userData: result._doc}});
            }
        }
    })
});

router.post('/logout', function (req, res) {
    req.session.uid = "";
    req.session.permission = 0;
    res.send({code: code.OK});
});

router.post('/updateAdminPassword', function (req, res, next) {
    if (!req.session.uid){
        res.send({code: code.INVALID_UERS});
        return;
    }

    let newPassword = req.body.password;
    if (!newPassword || newPassword.length> 20){
        res.end({code: code.REQUEST_DATA_ERROR});
        return;
    }
    commonDao.findOneData('adminModel', {uid: req.session.uid}, function (err, result) {
        if (!!err){
            res.send({code: err});
        }else{
            if (!result){
                res.send({code:code.HALL.NOT_FIND});
            }else{
                commonDao.updateData("adminModel", {uid: req.session.uid}, {password: newPassword}, function (err) {
                    res.send({code: !!err?err:code.OK});
                })
            }
        }
    })
});

// ------------------------------------记录相关-----------------------------------
function checkRecordPermission(model, permission) {
    if (!permission){
        return false;
    }
    // 检查权限
    if(model === 'adminModel' || model === 'accountModel'){
        if(permission !== -1){
            return false;
        }
    }else if (model === "userModel"){
        if((permission & enumeration.userPermissionType.USER_MANAGER) === 0){
            return false;
        }
    }else if (model === "publicParameterModel" || model === "gameTypeModel"){
        if((permission & enumeration.userPermissionType.USER_SYSTEM_MANAGER) === 0){
            return false;
        }
    }else if (model === "adminGrantRecordModel" ||
        model === "inventoryValueExtractRecordModel" ||
        model === "modifyInventoryValueRecordModel" ||
        model === "gameProfitRecordSchemaModel" ||
        model === "rechargeRecordModel" ||
        model === "gameRecordModel" ||
        model === 'userGameRecordModel' ||
            model === 'extractionCommissionRecordModel' ||
            model === 'withdrawCashRecordModel'
    ){
        if((permission & enumeration.userPermissionType.DATA_MANAGER) === 0){
            return false;
        }
    }else if(model === "gameControlDataModel"){
        if((permission & enumeration.userPermissionType.GAME_CONTROL) === 0){
            return false;
        }
    }else{
        return false;
    }
    return true;
}

function recordChangeNotify(model) {
    if (model === "gameTypeModel"){
        gameServerInterfaceServices.reloadParameterNotify([model], function (err) {
            if (!!err){
                console.error(err);
            }
        })
    } else if (model === "publicParameterModel"){
        gameServerInterfaceServices.reloadParameterNotify([model], function (err) {
            if (!!err){
                console.error(err);
            }
        })
    }
}
router.post('/getRecord', function (req, res, next) {
    if (!req.session.uid){
        res.send({code: code.INVALID_UERS});
        return;
    }
    if (!checkRecordPermission(req.body.model, req.session.permission)){
        res.send({code: code.PERMISSION_NOT_ENOUGH});
        return;
    }
    let body = req.body;
    commonDao.findDataAndCount(body.model, body.startIndex, body.count, {createTime: -1}, JSON.parse(body.matchData), function (err, result, totalCount) {
        if (!!err){
            res.send({code: err});
        }else{
            let arr = [];
            for (let i = 0; i < result.length; ++i){
                arr.push(result[i]._doc);
            }

            // 如果是获取用户数据则，查询缓存
            if(body.model === 'userModel'){
                let uidArr = [];
                for (let i = 0; i < arr.length; ++i){
                    uidArr.push(arr[i].uid);
                }
                userDao.getUserDataArrByUidArrFromCache(uidArr, function (err, result) {
                    if (!result){
                        result = [];
                    }
                    if (result.length> 0){
                        for (let i = 0; i < result.length; ++i){
                            for (let j = 0; j < arr.length; ++j){
                                if (result[i].uid === arr[j].uid){
                                    arr[j] = result[i];
                                }
                            }
                        }
                    }
                    res.send({code: code.OK, msg:{recordArr: arr, totalCount: totalCount}});
                })
            }else{
                res.send({code: code.OK, msg:{recordArr: arr, totalCount: totalCount}});
            }
        }
    })
});

router.post('/updateRecord', function (req, res, next) {
    if (!req.session.uid){
        res.send({code: code.INVALID_UERS});
        return;
    }
    if (!checkRecordPermission(req.body.model, req.session.permission)){
        res.send({code: code.PERMISSION_NOT_ENOUGH});
        return;
    }

    let body = req.body;
    commonDao.updateData(body.model, JSON.parse(body.matchData), JSON.parse(body.saveData), function (err) {
        res.send({code: !!err?err:code.OK});

        recordChangeNotify(body.model);
    });
});

router.post('/addRecord', function (req, res, next) {
    if (!req.session.uid){
        res.send({code: code.INVALID_UERS});
        return;
    }
    if (!checkRecordPermission(req.body.model, req.session.permission)){
        res.send({code: code.PERMISSION_NOT_ENOUGH});
        return;
    }

    let body = req.body;
    commonDao.createData(body.model, JSON.parse(body.saveData), function (err) {
        res.send({code: !!err?err:code.OK});

        recordChangeNotify(body.model);
    });
});

router.post('/deleteRecord', function (req, res, next) {
    if (!req.session.uid){
        res.send({code: code.INVALID_UERS});
        return;
    }
    if (!checkRecordPermission(req.body.model, req.session.permission)){
        res.send({code: code.PERMISSION_NOT_ENOUGH});
        return;
    }

    let body = req.body;
    commonDao.deleteData(body.model, JSON.parse(body.matchData), function (err) {
        res.send({code: !!err?err:code.OK});

        recordChangeNotify(body.model);
    });
});

// -------------------------------------用户管理相关-----------------------------------
router.post('/grant', function (req, res, next) {
    if (!req.session.uid){
        res.send({code: code.INVALID_UERS});
        return;
    }
    if (!req.session.permission || (req.session.permission & enumeration.userPermissionType.USER_MANAGER) === 0){
        res.send({code: code.PERMISSION_NOT_ENOUGH});
        return;
    }

    let updateData = {};
    updateData[req.body.field] = (parseInt(req.body.count) || 0);
    updateData = {$inc: updateData};
    userDao.getUserDataByUid(req.body.uid, function (err, result) {
        if (!!err){
            res.send({code: err});
        }else{
            if (!res){
                res.send({code: code.HALL.NOT_FIND});
            }else{
                if (result.isLockGold === 'true' || result.isLockGold === true){
                    res.send({code: code.HALL.GOLD_LOCKED});
                }else{
                    userDao.updateUserData(req.body.uid, updateData, function (err) {
                        if (!!err){
                            res.send({code: code.REQUEST_DATA_ERROR});
                        }else{
                            res.send({code: code.OK});
                        }

                        // 更新用户信息
                        gameServerInterfaceServices.updateUserDataNotify(req.body.uid, [req.body.field], function (err) {
                            if (!!err){
                                console.error(err);
                            }
                        });

                        // 创建赠送记录
                        let saveData = {
                            uid: req.session.uid,
                            gainUid: req.body.uid,
                            type: req.body.field,
                            count: req.body.count,
                            createTime: Date.now()
                        };
                        commonDao.createData("adminGrantRecordModel", saveData);
                    });
                }
            }
        }
    });
});

router.post('/getOnlineUserData', function (req, res, next) {
    if (!req.session.uid){
        res.send({code: code.INVALID_UERS});
        return;
    }
    if (!req.session.permission || (req.session.permission & enumeration.userPermissionType.USER_MANAGER) === 0){
        res.send({code: code.PERMISSION_NOT_ENOUGH});
        return;
    }

    let startIndex = req.body.startIndex || 0;
    let count = req.body.count || 10;
    let uid =req.body.uid;

    if (!!uid){
        userDao.getUserDataByUidFromCache(uid, function (err, result) {
            if (!!err){
                res.send({code: err});
            }else{
                res.send({code: code, msg: {recordArr: [result], totalCount: 1}});
            }
        })
    }else{
        userDao.getOnlineUserData(startIndex, count, function (err, recordArr, totalCount) {
            if (!!err){
                res.send({code: err});
            }else{
                res.send({code: code.OK, msg: {recordArr: recordArr, totalCount: totalCount}});
            }
        })
    }
});

router.post('/updateUserData', function (req, res, next) {
    if (!req.session.uid){
        res.send({code: code.INVALID_UERS});
        return;
    }
    if (!req.session.permission || (req.session.permission & enumeration.userPermissionType.USER_MANAGER) === 0){
        res.send({code: code.PERMISSION_NOT_ENOUGH});
        return;
    }

    userDao.updateUserData(req.body.uid, JSON.parse(req.body.saveData), function (err) {
        res.send({code: !!err?err: code.OK});

        // 更新用户信息
        let updateKeys = [];
        for (let key in req.body.saveData){
            if (req.body.saveData.hasOwnProperty(key)){
                updateKeys.push(key);
            }
        }
        gameServerInterfaceServices.updateUserDataNotify(req.body.uid, updateKeys, function (err) {
            if (!!err){
                console.error(err);
            }
        })
    })
});

// -------------------------------------系统维护相关-----------------------------------
router.post('/sendSingleEmail', function (req, res, next) {
    if (!req.session.uid){
        res.send({code: code.INVALID_UERS});
        return;
    }
    if (!req.session.permission || (req.session.permission & enumeration.userPermissionType.USER_SYSTEM_MANAGER) === 0){
        res.send({code: code.PERMISSION_NOT_ENOUGH});
        return;
    }
    let uid = req.body.uid;
    let title = req.body.title;
    let content = req.body.content;
    if (!uid || !title || !content){
        res.send({code: code.REQUEST_DATA_ERROR});
        return;
    }
    
    userDao.getUserDataByUid(uid, function (err, userData) {
        if (!!err){
            res.send({code: err});
        }else{
            if (!userData){
                res.send({code: code.HALL.NOT_FIND});
            }else{
                let emailArr = [];
                if (userData.emailArr.length > 0) emailArr = JSON.parse(userData.emailArr);
                emailArr.push({
                    id: Date.now().toString() + utils.getRandomNum(1000, 9999),
                    title: title,
                    content: content,
                    isRead: false,
                    status: enumeration.emailStatus.NOT_RECEIVE,
                    createTime: Date.now(),
                });
                userDao.updateUserData(uid, {emailArr: JSON.stringify(emailArr)}, function (err) {
                    if (!!err) {
                        console.error(err);
                    }else{
                        gameServerInterfaceServices.updateUserDataNotify(req.body.uid, ['emailArr'])
                    }
                });
                res.send({code: code.OK});
            }
        }
    })
});

router.post('/sendAllServerEmail', function (req, res, next) {
    if (!req.session.uid){
        res.send({code: code.INVALID_UERS});
        return;
    }
    if (!req.session.permission || (req.session.permission & enumeration.userPermissionType.USER_SYSTEM_MANAGER) === 0){
        res.send({code: code.PERMISSION_NOT_ENOUGH});
        return;
    }
    let title = req.body.title;
    let content = req.body.content;
    if (!title || !content){
        res.send({code: code.REQUEST_DATA_ERROR});
        return;
    }

    commonDao.findData("publicParameterModel", function (err, result) {
        if (!!err){
            res.send({code: err});
        }else{
            let systemEmail = null;
            for (let i = 0; i < result.length; ++i){
                let record = result[i];
                if (record.key === 'systemEmail'){
                    systemEmail = record.value;
                    break;
                }
            }
            systemEmail = (!!systemEmail && systemEmail.length > 0)?JSON.parse(systemEmail):[];
            systemEmail.push({
                id: Date.now().toString() + utils.getRandomNum(1000, 9999),
                title: title,
                content: content,
                isRead: false,
                status: enumeration.emailStatus.NOT_RECEIVE,
                createTime: Date.now()
            });
            async.parallel([
                function (cb) {
                    commonDao.updateDataEx('publicParameterModel', {key: 'systemEmail'}, {value: JSON.stringify(systemEmail)}, {upsert: true}, function (err) {
                        cb(err);
                    });
                },
                function (cb) {
                    commonDao.updateDataEx('publicParameterModel', {key: 'lastUpdateSystemEmailTime'}, {value: Date.now()}, {upsert: true}, function (err) {
                        cb(err);
                    });
                }
            ], function (err) {
                res.send({code: !!err?err: code.OK});

                gameServerInterfaceServices.reloadParameterNotify(['publicParameter']);
            });
        }
    })
});

// -------------------------------------数据统计相关-----------------------------------
router.post('/getRechargeStatisticsInfoGroupByDay', function (req, res, next) {
    if (!req.session.uid){
        res.send({code: code.INVALID_UERS});
        return;
    }
    if (!req.session.permission || (req.session.permission & enumeration.userPermissionType.DATA_MANAGER) === 0){
        res.send({code: code.PERMISSION_NOT_ENOUGH});
        return;
    }

    recordDao.getRechargeStatisticsInfoGroupByDay(JSON.parse(req.body.matchData), function(err, result){
        if (!!err){
            res.send({code: code.FAIL});
        }else{
            res.send({code: code.OK, msg: {recordArr: result}});
        }
    });
});

router.post('/getRecordStatisticsInfo', function (req, res, next) {
    if (!req.session.uid){
        res.send({code: code.INVALID_UERS});
        return;
    }
    if (!req.session.permission || (req.session.permission & enumeration.userPermissionType.DATA_MANAGER) === 0){
        res.send({code: code.PERMISSION_NOT_ENOUGH});
        return;
    }

    let startTime = parseInt(req.body.startTime);
    let endTime = parseInt(req.body.endTime);
    let allUserCount = 0;
    let rechargeCount = 0;
    let totalRechargeNumber = 0;
    let gameProfitSum = 0;
    let inventoryExtractSum = 0;
    let inventoryModifySum = 0;
    let commissionExtractSum = 0;
    let withdrawCashSum = 0;
    let userGoldSum = 0;
    async.series([
        function(cb){
            var findData = {
                createTime : {$gte: startTime, $lte: endTime}
            };
            // 获取注册总人数
            commonDao.getDataCount('userModel', findData, function(err, totalCount){
                allUserCount = totalCount;
                cb(err);
            });
        },
        function(cb){
            // 获取充值统计信息
            var findData = {
                createTime : {$gte: startTime, $lte: endTime}
            };
            recordDao.getRechargeStatisticsInfo(findData, function(err, resultArr){
                if (!!err){
                    cb(err);
                }else{
                    rechargeCount = resultArr.length;
                    for (var i = 0; i < resultArr.length; ++i){
                        var result = resultArr[i];
                        totalRechargeNumber += result.total;
                    }
                    cb();
                }
            })
        },
        function (cb) {
            var findData = {
                day : {$gte: utils.getTimeDay(startTime), $lte: utils.getTimeDay(endTime)}
            };
            // 获取游戏抽水总额
            recordDao.getGameProfitStatisticsInfo(findData, function(err, resultArr){
                if (!!err){
                    cb(err);
                }else{
                    for (var i = 0; i < resultArr.length; ++i){
                        var result = resultArr[i];
                        gameProfitSum += result.total;
                    }
                    cb();
                }
            })
        },
        function (cb) {
            // 获取库存抽取总额
            var findData = {
                createTime : {$gte: startTime, $lte: endTime}
            };
            recordDao.getInventoryExtractStatisticsInfo(findData, function(err, resultArr){
                if (!!err){
                    cb(err);
                }else{
                    for (var i = 0; i < resultArr.length; ++i){
                        var result = resultArr[i];
                        inventoryExtractSum += result.total;
                    }
                    cb();
                }
            })
        },
        function (cb) {
            // 获取库存抽取总额
            var findData = {
                createTime : {$gte: startTime, $lte: endTime}
            };
            recordDao.getInventoryModifyStatisticsInfo(findData, function(err, resultArr){
                if (!!err){
                    cb(err);
                }else{
                    for (var i = 0; i < resultArr.length; ++i){
                        var result = resultArr[i];
                        inventoryModifySum += result.total;
                    }
                    cb();
                }
            })
        },
        function (cb) {
            // 获取佣金提取总额
            var findData = {
                createTime : {$gte: startTime, $lte: endTime}
            };
            recordDao.getCommissionExtractStatisticsInfo(findData, function(err, resultArr){
                if (!!err){
                    cb(err);
                }else{
                    for (var i = 0; i < resultArr.length; ++i){
                        var result = resultArr[i];
                        commissionExtractSum += result.total;
                    }
                    cb();
                }
            })
        },
        function (cb) {
            // 获取提现总额
            var findData = {
                createTime : {$gte: startTime, $lte: endTime}
            };
            recordDao.getWithdrawCashStatisticsInfo(findData, function(err, resultArr){
                if (!!err){
                    cb(err);
                }else{
                    for (var i = 0; i < resultArr.length; ++i){
                        var result = resultArr[i];
                        withdrawCashSum += result.total;
                    }
                    cb();
                }
            })
        },
        function (cb) {
            // 玩家手头金币总额
            var findData = {
                createTime : {$gte: startTime, $lte: endTime}
            };
            recordDao.getUserGoldStatisticsInfo(findData, function(err, resultArr){
                if (!!err){
                    cb(err);
                }else{
                    for (var i = 0; i < resultArr.length; ++i){
                        var result = resultArr[i];
                        userGoldSum += result.total;
                    }
                    cb();
                }
            })
        }
    ], function(err){
        if (!!err){
            console.error('getRecordStatisticsInfo err:' + err);
            res.send({code: err});
        }else{
            res.send({code: code.OK, msg: {
                allUserCount: allUserCount,
                rechargeCount: rechargeCount,
                totalRechargeNumber: totalRechargeNumber,
                gameProfitSum: gameProfitSum,
                inventoryExtractSum: inventoryExtractSum,
                inventoryModifySum: inventoryModifySum,
                commissionExtractSum: commissionExtractSum,
                withdrawCashSum: withdrawCashSum,
                userGoldSum: userGoldSum
            }});
        }
    });
});

module.exports = router;
