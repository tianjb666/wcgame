let scheduler = require('pomelo-scheduler');
let utils = require('../../../util/utils');
let enumeration = require('../../../constant/enumeration');
let dao = require('../../../dao/commonDao');
let userDao = require('../../../dao/userDao');
let pomelo = require('pomelo');
let logger = require('pomelo-logger').getLogger('pomelo');
let spreadServices = require('../../../services/spreadServices');
let userInfoServices = require('../../../services/userInfoServices');
let robotServices = require('../../../services/robotServices');

let exp = module.exports;

let UPDATE_RANK_TIME = 5 * 60 * 1000;
let SYNC_CACHE_USER_DATA = 20 * 60 * 1000;

exp.init = function(){
    this.rankList = [];

    this.updateRankScheduleID = scheduler.scheduleJob({period: UPDATE_RANK_TIME}, exp.updateRank);
    this.syncCacheUserData = scheduler.scheduleJob({start: Date.now() + SYNC_CACHE_USER_DATA, period: SYNC_CACHE_USER_DATA}, exp.syncCacheUserDataScheduler);

    this.dailyTaskSchedulerID = scheduler.scheduleJob('0 0 0 * * *', exp.dailyTaskScheduler);

    // 每周任务（临时改成每日任务）
    this.weekTaskSchedulerID = scheduler.scheduleJob('0 0 0 * * *', exp.weekTaskScheduler);

    // 月任务
    this.monthTaskSchedulerID = scheduler.scheduleJob('0 0 0 1 * *', exp.monthTaskScheduler);
};

exp.beforeShutdown = function(cb){
    scheduler.cancelJob(this.updateRankScheduleID);
    scheduler.cancelJob(this.syncCacheUserData);
    scheduler.cancelJob(this.dailyTaskSchedulerID);
    scheduler.cancelJob(this.weekTaskSchedulerID);
    scheduler.cancelJob(this.monthTaskSchedulerID);

    exp.syncCacheUserDataScheduler(cb);
};

exp.updateRank = function () {
    // 如果排行榜人数为0，则构建假排行榜
    for(let i = 0; i < 200; ++i){
        if (!exp.rankList[i]){
            exp.rankList[i] = {
                avatar: "UserInfo/head_" + utils.getRandomNum(0, 15),
                nickname: robotServices.getRandomNickname(),
                gold: utils.getRandomNum(10, 100000)/100,
            };
        }else{
            exp.rankList[i].gold += (utils.getRandomNum(10, 100000)/100);
        }
    }
    dao.findDataAndCount("userModel", 0, 100, {gold: -1}, {todayWinGoldCount:{$lt: 0}}, function (err, result) {
        if (!!err){
            logger.error('updateRank findDataAndCount err:' + err);
        }
        for(let i = 0; i < result.length; ++i){
            let userData = result[i];
            exp.rankList.push({
                avatar: userData.avatar,
                nickname: userData.nickname,
                gold: userData.gold
            })
        }
        exp.rankList.sort(function (a, b) {
            return b.gold - a.gold
        })
    });
};

exp.getRankListData = function (startIndex, count) {
    return exp.rankList.slice(startIndex, startIndex + count);
};

exp.syncCacheUserDataScheduler = function (cb) {
    logger.debug('syncCacheUserDataScheduler');
    userDao.syncAllCacheUseData(function () {
        logger.debug('syncCacheUserDataScheduler finished');
        utils.invokeCallback(cb);
    });
};

exp.dailyTaskScheduler = function(){
    logger.info('dailyTaskSchedulerClearData');
    // 删除7天前的游戏记录和订单生成记录
    let matchData = {createTime: {"$lte": Date.now() - 3 * 24 * 60 * 60 * 1000}};
    dao.deleteData("rechargeOrderRecordModel", matchData, function(err){
        if (!!err){
            logger.error('dailyTaskSchedulerClearData removeRechargeOrderRecord err:' + err);
        }
    });
    // 删除今日赢金币数量
    dao.updateAllData("userModel", {todayWinGoldCount: 0});
    userDao.updateAllCacheUserData({todayWinGoldCount: 0});
    // 清除排行榜
    exp.rankList = [];
};

// 根据需求添加，每天将0点将user中a字段更新到b字段中
exp.dailyTaskSchedulerTemp = function () {
    // 每周一零点，结算佣金
    let updateTotalCount = 0;
    let startTime = Date.now();
    function doLotsWork(cache, cb) {
        updateTotalCount++;
        for(let i = 0; i < cache.length; ++i){
            let data = cache[i];
            // 查询数据是否在redis缓存中
            userDao.getUserDataByUidFromCache(data.uid, function (err, result) {
                if (!!err){
                    cb(err);
                }else{
                    // 如果在缓存中则对缓存数据进行修改
                    if (!!result){
                        userDao.updateUserData(data.uid, {b: result.a}, function (err) {
                            if (!!err){
                                logger.error("weekTaskScheduler", "updateData err:" + err );
                            }
                        })
                    }
                    // 如果不在缓存中,则对mongo进行数据修改
                    else{
                        dao.updateData("userModel", {uid: data.uid}, {b: data.a}, function (err) {
                            if (!!err){
                                logger.error("TaskScheduler", "updateData err:" + err );
                            }
                        })
                    }
                }
            })
        }
        utils.invokeCallback(cb);
    }
    // 用户数据可能过大，采用流获取的方式，分批获取用户数据进行处理
    let model = pomelo.app.get('dbClient')["userModel"];
    let stream = model.find({}).stream();
    let cache = [];
    stream.on('data',function(item){
        cache.push(item);
        if(cache.length === 100){
            /** signal mongo to pause reading **/
            stream.pause();
            doLotsWork(cache,function(){
                cache=[];
                /** signal mongo to continue, fetch next record **/
                stream.resume();
            });
        }
    });
    stream.on('end',function(){
        if (cache.length !== 0){
            doLotsWork(cache,function(){
                cache=[];
            });
        }
        logger.info("TaskScheduler time:" + (Date.now() - startTime) + "ms");
        logger.info('TaskScheduler end, updateTotalCount:' + updateTotalCount);
    });
    stream.on('close',function(){
        logger.info('TaskScheduler close');
    });
};

exp.weekTaskScheduler = function () {
    logger.info('weekTaskScheduler');
    let startTime = Date.now();
    // 每周一零点，结算佣金
    let updateTotalCount = 0;
    function doLotsWork(cache, cb) {
        updateTotalCount++;
        for(let i = 0; i < cache.length; ++i){
            let data = cache[i];
            userDao.getUserDataByUidFromCache(data.uid, function (err, result) {
                if (!!err){
                    cb(err);
                }else{
                    if (!result){
                        let achievement1 = data.agentMemberAchievement + data.directlyMemberAchievement;
                        let thisWeekCommision1 = spreadServices.getCommision(achievement1);
                        let saveData = {
                            "directlyMemberAchievement": 0,
                            "agentMemberAchievement": 0,
                            "thisWeekLowerAgentCommision": 0,
                            "$inc": {
                                "realCommision": (thisWeekCommision1 - data.thisWeekLowerAgentCommision),
                                "totalCommision": thisWeekCommision1,
                                "lowerAgentCommision": data.thisWeekLowerAgentCommision
                            }
                        };
                        dao.updateData("userModel", {uid: data.uid}, saveData, function (err) {
                            if (!!err){
                                logger.error("weekTaskScheduler", "updateData err:" + err );
                            }
                        })
                    }else{
                        let achievement = result.agentMemberAchievement + result.directlyMemberAchievement;
                        let thisWeekCommision = spreadServices.getCommision(achievement);
                        let updateUserData = {
                            "directlyMemberAchievement": 0,
                            "agentMemberAchievement": 0,
                            "thisWeekLowerAgentCommision": 0,
                            "$inc": {
                                "realCommision": (thisWeekCommision - result.thisWeekLowerAgentCommision),
                                "totalCommision": thisWeekCommision,
                                "lowerAgentCommision": result.thisWeekLowerAgentCommision
                            }
                        };
                        userDao.updateUserData(data.uid, updateUserData, function (err, res) {
                            if (!!err){
                                logger.error("weekTaskScheduler", "updateData err:" + err );
                            }else{
                                if (!!res){
                                    userInfoServices.updateUserDataNotify(data.uid, res.frontendId, {
                                        directlyMemberAchievement: res.directlyMemberAchievement,
                                        agentMemberAchievement: res.agentMemberAchievement,
                                        thisWeekLowerAgentCommision: res.thisWeekLowerAgentCommision,
                                        realCommision: res.realCommision,
                                        totalCommision: res.totalCommision,
                                        lowerAgentCommision: res.lowerAgentCommision,
                                    });
                                }
                            }
                        });
                    }
                }
            })
            // let user = exp.userList[data.uid];
            // if (!!user){
            //     let achievement = user.userDetailData.agentMemberAchievement + user.userDetailData.directlyMemberAchievement;
            //     let thisWeekCommision = spreadServices.getCommision(achievement);
            //     let updateUserData = {
            //         uid: data.uid,
            //         "directlyMemberAchievement": 0,
            //         "agentMemberAchievement": 0,
            //         "thisWeekLowerAgentCommision": 0,
            //         "realCommision": user.userDetailData.realCommision + (thisWeekCommision - user.userDetailData.thisWeekLowerAgentCommision),
            //         "totalCommision": user.userDetailData.totalCommision + thisWeekCommision,
            //         "lowerAgentCommision": user.userDetailData.lowerAgentCommision + user.userDetailData.thisWeekLowerAgentCommision
            //     };
            //     user.updateUserData(updateUserData);
            //     userInfoServices.updateUserDataNotify(user, updateUserData);
            // }else{
            //     let achievement1 = data.agentMemberAchievement + data.directlyMemberAchievement;
            //     let thisWeekCommision1 = spreadServices.getCommision(achievement1);
            //     let saveData = {
            //         "directlyMemberAchievement": 0,
            //         "agentMemberAchievement": 0,
            //         "thisWeekLowerAgentCommision": 0,
            //         "$inc": {
            //             "realCommision": (thisWeekCommision1 - data.thisWeekLowerAgentCommision),
            //             "totalCommision": thisWeekCommision1,
            //             "lowerAgentCommision": data.thisWeekLowerAgentCommision
            //         }
            //     };
            //     dao.updateData("userModel", {uid: data.uid}, saveData, function (err) {
            //         if (!!err){
            //             logger.error("weekTaskScheduler", "updateData err:" + err );
            //         }
            //     })
            // }
        }
        utils.invokeCallback(cb);
    }
    
    let model = pomelo.app.get('dbClient')["userModel"];
    let stream = model.find({"$or": [{"directlyMemberAchievement":{$gt: 0}}, {"agentMemberAchievement":{$gt: 0}}]}).stream();
    let cache = [];
    stream.on('data',function(item){
        cache.push(item);
        if(cache.length === 100){
            /** signal mongo to pause reading **/
            stream.pause();
            doLotsWork(cache,function(){
                cache=[];
                /** signal mongo to continue, fetch next record **/
                stream.resume();
            });
        }
    });
    stream.on('end',function(){
        if (cache.length !== 0){
            doLotsWork(cache,function(){
                cache=[];
            });
        }
        logger.info("weekTaskScheduler time:" + (Date.now() - startTime) + "ms");
        logger.info('weekTaskScheduler end, updateTotalCount:' + updateTotalCount);
    });
    stream.on('close',function(){
        logger.info('weekTaskScheduler close');
    });

    // 修改数据数据
    dao.updateDataEx("userModel", {"$or": [{"weekAddedDirectlyMemberCount":{$gt: 0}}, {"weekAddedAgentMemberCount":{$gt: 0}}]}, {"weekAddedDirectlyMemberCount": 0, "weekAddedAgentMemberCount": 0}, {multi : true}, function (err) {
        if (!!err){
            logger.error("weekTaskScheduler", "updateData err");
        }
    });
    // 修改在线用户数据
    userDao.updateAllCacheUserData({weekAddedDirectlyMemberCount: 0, weekAddedAgentMemberCount: 0});
};

exp.monthTaskScheduler = function () {
    logger.info('monthTaskScheduler');
    // 修改数据库数据
    dao.updateDataEx("userModel", {"$or": [{"monthAddedDirectlyMemberCount":{$gt: 0}}, {"monthAddedAgentMemberCount":{$gt: 0}}]}, {"monthAddedDirectlyMemberCount": 0, "monthAddedAgentMemberCount": 0}, {multi : true}, function (err) {
        if (!!err){
            logger.error("weekTaskScheduler", "updateData err");
        }
    });
    // 修改在线用户数据
    userDao.updateAllCacheUserData({monthAddedDirectlyMemberCount: 0, monthAddedAgentMemberCount: 0});
};