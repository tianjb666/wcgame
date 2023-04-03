let code = require('../constant/code');
let roomProto = require('../API/Protos/RoomProto');
let async = require('async');
let dao = require('../dao/commonDao');
let pushAPI = require('../API/pushAPI');
let rpcAPI = require('../API/rpcAPI');
let logger = require('pomelo-logger').getLogger('room');
let dispatch = require('../util/dispatcher');
let utils = require('../util/utils');
let scheduler = require('pomelo-scheduler');
let enumeration = require('../constant/enumeration');
let gameRuleManager = require('./gameRule');
let userDao = require('../dao/userDao');
let userInfoServices = require('../services/userInfoServices');
let spreadServices = require('../services/spreadServices');
let OFFLINE_WAIT_TIME = 10 * 1000;

module.exports = function (app, roomId, roomOwnerID, gameRule, gameTypeInfo){
    return new roomFrame(app, roomId, roomOwnerID, gameRule, gameTypeInfo);
};

let roomFrame = function (app, roomId, roomOwnerID, gameRule, gameTypeInfo){
    this.app = app;

    this.channelService = this.app.get('channelService');
    this.publicParameter = this.app.get('publicParameter');

	this.gameRule = gameRule || gameRuleManager.getDefaultRule(gameTypeInfo);
    this.roomId = roomId;
	this.gameTypeInfo = gameTypeInfo;

	this.drawID = "";

    this.chairCount = this.gameRule.memberCount;
    this.roomOwnerID = roomOwnerID;
    this.roomType = this.gameRule.roomType || enumeration.roomType.NORMAL;													// 房间类型
    this.roomSettlementMethod = enumeration.roomSettlementMethod.GOLD;								// 结算方式
	this.gameRoomStartType = this.gameRule.startType || enumeration.gameRoomStartType.ALL_READY;

    // 房间状态
	this.gameStarted = false;
	this.gameStartedOnce = false;
    this.lastNativeTime = Date.now();
	this.curBureau = 0;
	this.maxBureau = this.gameRule.bureau || this.gameTypeInfo.maxDrawCount || 0;
	this.initAskForExitArr();
    this.roomDismissed = false;

	this.offlineSchedulerIDs = {};

    // 构建用户数据
    this.currentUserCount = 0;
    this.userArr = {};

    // 百人游戏桌面显示玩家信息
    this.shenSuanZiInfo = null;
    this.fuhaoInfoArr = [];
    this.gameRecordDataArr = [];

    // 创建游戏逻辑
    let gameFrame = require(gameRuleManager.getGameFramePath(gameTypeInfo));
    this.gameFrameSink = new gameFrame(this);

    // 机器人操作操作
    this.robotOperationRoomCreated();
    this.robotWinRate = 0.5;

    logger.debug("roomFrame", "create, roomID:" + roomId + ",roomOwnerID:" +roomOwnerID + ",gameRule:" + JSON.stringify(gameRule), ",gameTypeInfo:" + gameTypeInfo);
};

let pro = roomFrame.prototype;

// ----------------------------------消息接收相关----------------------------------
pro.receiveRoomMessage = function (uid, msg){
    logger.debug("receiveRoomMessage");
    logger.debug("mgs:" + JSON.stringify(msg));
    let type = msg.type || null;
    let data = msg.data || null;
    if(!type || !data || !this.userArr[uid]){ // 验证数据
        return;
    }

    if(type === roomProto.USER_READY_NOTIFY){
        this.userReady(uid, data);
    } else if(type === roomProto.USER_LEAVE_ROOM_NOTIFY){
        this.userLeaveRoomRequest(uid);
    } else if(type === roomProto.USER_CHAT_NOTIFY) {
        this.userChat(data.chatData);
    } else if(type === roomProto.GAME_WIN_RATE_NOTIFY) {
		this.setGameWinRate(uid, data.rate);
    } else if(type === roomProto.ASK_FOR_DISMISS_NOTIFY) {
		this.askForDismiss(uid, data.isExit);
    } else if(type === roomProto.USER_RECONNECT_NOTIFY) {
		this.userReconnect(uid);
	} else if(type === roomProto.ASK_FOR_DISMISS_STATUS_NOTIFY) {
		this.askForDismissStatus(uid);
	} else if(type === roomProto.SORRY_I_WILL_WIN_NOTIFY) {
    	this.userWillWin(uid, data);
	} else if (type === roomProto.GET_ROOM_SCENE_INFO_NOTIFY){
        this.getRoomSceneInfo(uid);
    } else if (type === roomProto.GET_ROOM_SHOW_USER_INFO_NOTIFY){
	    this.getRoomShowUserInfo(uid);
    } else if (type === roomProto.GET_ROOM_ONLINE_USER_INFO_NOTIFY){
        this.getRoomOnlineUserInfo(uid);
    } else {
        logger.error("roomFrame", "receiveRoomMessage err: type not find");
    }
};

pro.receiveGameMessage = function (uid, msg){
    let chairId = this.getChairIdByUid(uid);
    if(chairId >= 0 && chairId < this.chairCount) {
        this.gameFrameSink.receivePlayerMessage(chairId, msg);
    }
};

// ----------------------------------消息发送相关----------------------------------
pro.sendData = function (msg, chairIdArr){
    if(!chairIdArr){
        chairIdArr = [];
        for (let key in this.userArr){
            if(this.userArr.hasOwnProperty(key)){
                chairIdArr.push(this.userArr[key].chairId);
            }
        }
    }
    let uidAndFrontendIdArr = [];
    for (let i = 0; i < chairIdArr.length; ++i){
        let user = this.getUserByChairId( chairIdArr[i]);
         if(!!user && (user.userStatus&roomProto.userStatusEnum.OFFLINE) === 0 && !user.userInfo.robot){
            uidAndFrontendIdArr.push({uid: user.userInfo.uid, sid: user.frontendId});
        }
    }
    if(uidAndFrontendIdArr.length === 0) return;
    logger.debug ("roomFrame", 'send game Data:' + JSON.stringify(msg));
    pushAPI.gameMessagePush(msg, uidAndFrontendIdArr, function(err){
        if(!!err){
            logger.warn('send message error');
            logger.warn(err);
        }
    });
};

pro.sendDataToAll = function (msg){
    this.sendData(msg, null);
};

pro.sendDataExceptchairIds = function (msg, exceptchairIds, allchairIds) {

    if (!allchairIds){
        allchairIds = [];
        for(let key in this.userArr){
            if (this.userArr.hasOwnProperty(key)){
                let user = this.userArr[key];
                if (user.userInfo.robot) continue;
                allchairIds.push(user.chairId);
            }
        }
    }

    let newchairIds = allchairIds.slice();
    for (let i = 1; i < exceptchairIds.length; i ++) {
        for (let j = 1; j < newchairIds.length; j ++) {
            if(exceptchairIds[i] === newchairIds[j]) {
                newchairIds.splice(j, 1);
            }
        }
    }

    this.sendData(msg, newchairIds);
};

pro.sendRoomData = function (msg, uidAndFrontendIdArr){
    if(!uidAndFrontendIdArr){
        uidAndFrontendIdArr = [];
        for (let key in this.userArr){
            if(this.userArr.hasOwnProperty(key)){
                let user = this.userArr[key];
                if((user.userStatus&roomProto.userStatusEnum.OFFLINE) === 0 && !user.userInfo.robot) {
                    uidAndFrontendIdArr.push({uid: key, sid: user.frontendId});
                }
            }
        }
    }else{
        let tempArr = [];
        for (let i = 0; i < uidAndFrontendIdArr.length; ++i){
            if (!!uidAndFrontendIdArr[i].sid){
                tempArr.push(uidAndFrontendIdArr[i]);
            }
        }
        uidAndFrontendIdArr = tempArr;
    }
    if(uidAndFrontendIdArr.length === 0) return;
    logger.debug ("roomFrame", 'send room Data:' + JSON.stringify(msg));
    pushAPI.roomMessagePush(msg, uidAndFrontendIdArr, function(err){
        if(!!err){
            logger.warn('roomMessagePush', "err:" + err + ", msg:" + JSON.stringify(msg) + ", uidAndFrontendIdArr:" + JSON.stringify(uidAndFrontendIdArr));
        }
    });
};

pro.sendRoomDataToAll = function (msg){
    this.sendRoomData(msg, null);
};

pro.sendPopDialogContent = function (code, chairIdArr){
	let i;
    if(!chairIdArr){
        chairIdArr = [];
        for(i = 0; i < this.chairCount; ++i){
            chairIdArr.push(i);
        }
    }
    let uidAndFrontendIdArr = [];
    for(i = 0; i < chairIdArr.length; ++i){
        let user = this.getUserByChairId( chairIdArr[i]);
        if(!!user && (user.userStatus&roomProto.userStatusEnum.OFFLINE) === 0 && !user.userInfo.robot){
            uidAndFrontendIdArr.push({uid: user.userInfo.uid, sid: user.frontendId});
        }
    }
    if(uidAndFrontendIdArr.length === 0) return;
    logger.info ('sendPopDialogContent sendData:');
    logger.info (code);
    pushAPI.popDialogContentPush({code: code}, uidAndFrontendIdArr, function(err){
        if(!!err){
            logger.warn('sendPopDialogContent error');
            logger.warn(err);
        }
    });
};

pro.sendPopDialogContentToAll = function (code){
    this.sendPopDialogContent(code, null);
};

pro.sendRoomDataExceptUid = function (msg, uidArr){
    let uidAndFrontendIdArr = [];
	let key;
	for(key in this.userArr) {
        if(this.userArr.hasOwnProperty(key)) {
            let user = this.userArr[key];
            if ((user.userStatus&roomProto.userStatusEnum.OFFLINE) === 0 && uidArr.indexOf(key) === -1 && !user.userInfo.robot)
            uidAndFrontendIdArr.push({uid:key, sid: user.frontendId});
		}
	}
    this.sendRoomData(msg, uidAndFrontendIdArr);
};

pro.updateRoomUserInfo = function (newUserInfo, notify, cb){
    let user = this.userArr[newUserInfo.uid] || null;
    if(!!user){
        // 更新用户信息
        for (let key in newUserInfo){
            if(newUserInfo.hasOwnProperty(key) && user.userInfo.hasOwnProperty(key) && key !== 'uid'){
                user.userInfo[key] = newUserInfo[key];
            }
        }
        if(!!notify){
            this.sendRoomDataToAll(roomProto.userInfoChangePush(user.userInfo));
        }
        utils.invokeCallback(cb);
    }else {
        utils.invokeCallback(cb, code.REQUEST_DATA_ERROR);
    }
};

pro.userSelfEntryRoomPush = function (uid){
    let user = this.userArr[uid];

    if(this.gameFrameSink.onEventUserEntry) {
        this.gameFrameSink.onEventUserEntry(user.chairId);
    }

    if (user.userInfo.robot) return;
    if(!user) return;
    let userInfoArr = [];
    if(this.roomType !== enumeration.roomType.HUNDRED){
        for(let key in this.userArr){
            if(this.userArr.hasOwnProperty(key)){
                let user1 = this.userArr[key];
                userInfoArr.push({
                    userInfo: user1.userInfo,
                    chairId: user1.chairId,
                    userStatus: user1.userStatus
                })
            }
        }
    }else{
        userInfoArr.push({
            userInfo: user.userInfo,
            chairId: user.chairId,
            userStatus: user.userStatus
        })
    }

	let gameData = !this.gameFrameSink.getEnterGameData?{}:this.gameFrameSink.getEnterGameData(user.chairId);	//获取游戏当前数据
    if(this.roomType === enumeration.roomType.PRIVATE){
        gameData.askForExitArr = this.askForExitArr;
    }else{
        gameData.askForExitArr = [];
    }
    pushAPI.selfEntryRoomPush(
        roomProto.selfEntryRoomPush(userInfoArr, gameData, this.gameTypeInfo.kind, this.roomId, this.drawID),
        [{uid:uid, sid:user.frontendId}],
        function (err){
            if(!!err){
                logger.warn('send message error');
                logger.warn(err);
        }
    });
};

// ---------------------------------游戏开始相关----------------------------------
pro.userReady = function (uid){
    logger.debug("roomFrame", "startGame uid:" + uid);
    let user = this.userArr[uid];
    if(!!user) {
        user.userStatus |= roomProto.userStatusEnum.READY;
    }
    let msg = roomProto.userReadyPush(user.chairId);
    this.sendRoomData(msg);
    if(this.efficacyStartGame()) { // 判断游戏是否需要开始
        this.startGame();
    }
};

pro.startGame = function (){
    logger.debug("roomFrame", "startGame roomID:" + this.roomId);
    if(this.gameStarted) { return false; }
    this.gameStarted = true;
	this.gameStartedOnce = true;
    this.lastNativeTime = Date.now();
	this.initAskForExitArr();
	if (!!this.requestRobotTimer) clearTimeout(this.requestRobotTimer);
	let self = this;
	this.drawID = this.gameTypeInfo.kind + "-" + this.roomId + "-" + new Date().format("yyyyMMddhhmmssSSS");
	async.series([
	    function (cb) {
	        rpcAPI.getCurRobotWinRate(self.gameTypeInfo.kind, function (err, rate) {
                if (!!err){
                    logger.error("roomFrame", "getCurRobotWinRate err:" + err);
                    self.robotWinRate = 0.5;
                }
                self.robotWinRate = rate;
                cb();
            })
        },
		function (cb) {
	        // 修改房间中玩家状态
            for (let key in self.userArr){
                if (self.userArr.hasOwnProperty(key)){
                    let user = self.userArr[key];
                    user.userStatus |= roomProto.userStatusEnum.PLAYING;
                }
            }
			self.gameFrameSink.onEventGameStart(cb);
        }
	], function (err) {
		if(!!err){
			logger.error("startGame", "err:" + err);
            self.gameStarted = false;
		}
    });
};

// 扣除费用
pro.deductExpenses = function (cb) {
	if (this.roomType === enumeration.roomType.NORMAL){
		this.deductGoldPay(cb);
	}else if(this.roomType === enumeration.roomType.PRIVATE){
		this.deductRoomPay(cb);
	}else if(this.roomType === enumeration.roomType.HUNDRED){
	    utils.invokeCallback(cb);
    }else{
        logger.error("deductExpenses", "err: room type error");
        utils.invokeCallback(cb, code.INVALID_PARAM);
	}
};

// 扣除金币费用
pro.deductGoldPay = function (cb) {
	let express = parseInt(this.gameTypeInfo["express"] || 0);
	if (express > 0){
        let tasks = [];
        let index = 0;
        let self = this;
        for(let i = 0; i < this.chairCount; ++i) {
            tasks.push(function (cb) {
                self.writeUserGold(index++, express * -1, true, cb);
            });
        }
        async.series(tasks, function (err) {
            if (!!err){
                logger.error("deductRoomPay", "writeUserDiamond err:" + err);
            }
            utils.invokeCallback(cb, err);
        });
	}else{
		utils.invokeCallback(cb);
	}
};

// 扣房卡
pro.deductRoomPay = function(cb) {
	if(this.curBureau === 0) {
		let gameRule = this.gameRule;
		if(gameRule.isOwnerPay) {
			this.writeUserDiamond(0, -gameRule.diamondCost, true, cb);
		} else {
            let cost = Math.floor(gameRule.diamondCost/gameRule.memberCount);
			let tasks = [];
			let index = 0;
			let self = this;
            for(let i = 0; i < gameRule.memberCount; ++i) {
            	tasks.push(function (cb) {
                    self.writeUserDiamond(index++, cost * -1, true, cb);
                });
            }
			async.series(tasks, function (err) {
				if (!!err){
					logger.error("deductRoomPay", "writeUserDiamond err:" + err);
				}
                utils.invokeCallback(cb, err);
            });
		}
	}else{
		utils.invokeCallback(cb);
	}
};

// 判定游戏是否可以开始
pro.efficacyStartGame = function (){
    if(this.roomDismissed) return false;
    let readyCount = 0, key, userCount = 0;
    if(this.gameStarted) {
        return false;
    } else {
        if (this.gameRoomStartType === enumeration.gameRoomStartType.AUTO_START) {
            return true;
        }
        //let existRealUser = false;
        for(key in this.userArr) {
            if(this.userArr.hasOwnProperty(key)) {
                ++ userCount;
                if((this.userArr[key].userStatus & roomProto.userStatusEnum.READY) > 0) {
                    ++ readyCount;
                }
                //if (!existRealUser && !this.userArr[key].userInfo.robot){
                    //existRealUser =  true;
                //}
            }
        }
        //if (!existRealUser) return false;
        if (userCount === readyCount){
            return readyCount >= this.gameTypeInfo.minPlayerCount;
        }else{
            return false;
            //return (userCount === this.chairCount && !this.gameStartedOnce);
        }
    }
};

// ---------------------------------游戏结束相关----------------------------------
pro.concludeGame = function (data){
    logger.debug("roomFrame", "concludeGame roomID:" + this.roomId);
    if(!this.gameStarted) {
		logger.error('concludeGame', "game not started");
		return;
	}
	++ this.curBureau;
    this.gameStarted = false;
    // 修改玩家状态
    for(let key in this.userArr) {
        if(this.userArr.hasOwnProperty(key)) {
            let user = this.userArr[key];
            user.userStatus &= ~roomProto.userStatusEnum.READY;
            user.userStatus &= ~roomProto.userStatusEnum.PLAYING;
        }
    }
    let self = this;
    async.series([
        // 记录数据
        function (cb) {
            logger.debug("concludeGame", "data:" + JSON.stringify(data));
            if (this.roomType === enumeration.roomType.PRIVATE){
                cb();
            }else{
                self.recordGameResult(data, function (err) {
                    if (!!err){
                        cb(err);
                    }else{
                        // 更新游戏内排行信息
                        self.updateRoomRankInfo(data);
                        cb();
                    }
                });
            }
        },
        function (cb) {
            // 判断游戏是否结束
            if(!!self.maxBureau && (self.curBureau >= self.maxBureau)){
                // 游戏结束则直接解散房间
                self.dismissRoom(roomProto.roomDismissReason.RDR_NONE);
            }else{
                // 移除掉线玩家
                if (self.roomType !== enumeration.roomType.PRIVATE){
                    self.clearOfflineUser();
                }
                // 移除不满足条件的玩家
                self.clearNonSatisfiedConditionsUser();
                // 游戏结束时，机器人操作
                self.robotOperationConcludeGame();
                if(self.roomDismissed){
                    cb();
                    return;
                }
                // 游戏准备
                self.gameFrameSink.onEventGamePrepare();
                // 游戏准备时机器人操作
                self.robotOperationGamePrepare();
                // 判定游戏是否开始
                if(self.efficacyStartGame()){
                    self.startGame();
                }
            }
            cb();
        }
    ], function (err) {
        if (!!err){
            logger.error("concludeGame err:" + err);
        }
    });
};

pro.clearOfflineUser = function () {
    for (let key in this.userArr){
        if (this.userArr.hasOwnProperty(key)){
            let user = this.userArr[key];
            if ((user.userStatus & roomProto.userStatusEnum.OFFLINE) !== 0){
                if(this.gameRoomStartType === enumeration.gameRoomStartType.AUTO_START){
                    if (!!this.gameFrameSink.isUserEnableLeave && this.gameFrameSink.isUserEnableLeave(user.chairId)) {
                        this.kickUser(user.userInfo.uid);
                    }
                }else{
                    this.kickUser(user.userInfo.uid);
                }
            }
        }
    }
};

pro.clearNonSatisfiedConditionsUser = function () {
    let kickUidArr = [];
    let notifyArr = [];
    for (let key in this.userArr){
        if (this.userArr.hasOwnProperty(key)){
            let user = this.userArr[key];
            if (user.userInfo.gold < this.gameTypeInfo.goldLowerLimit){
                kickUidArr.push(user.userInfo.uid);
                if (!user.userInfo.robot){
                    notifyArr.push(user.chairId);
                }
            }
        }
    }
    if (notifyArr.length > 0){
        this.sendPopDialogContent(code.GAME.LEAVE_ROOM_GOLD_NOT_ENOUGH_LIMIT, notifyArr);
    }
    if(kickUidArr.length > 0){
        setTimeout(function () {
            for (let i = 0; i < kickUidArr.length; ++i){
                this.kickUser(kickUidArr[i]);
            }
        }.bind(this), 1000);
    }
};

pro.writeUserDiamond = function (chairId, diamondCount, isForce, cb){
    let user = this.getUserByChairId(chairId);
    if(!user) {
        //logger.error("writeUserDiamond", "user not exist chairId：" + chairId);
        utils.invokeCallback(cb);
        return;
    }
    let updateData = {
        $inc: {diamond: diamondCount}
    };
    userDao.updateUserData(user.userInfo.uid, updateData, function (err, newUserInfo) {
        if(!!err) {
            logger.error('write user gold', 'error:' + err);
        }
        this.updateRoomUserInfo(userInfoServices.buildGameRoomUserInfo(newUserInfo), false);
        utils.invokeCallback(cb, err);

    });
    /*let server = dispatch.dispatch(user.userInfo.uid, this.app.getServersByType('hall'));
    rpcAPI.changeCurrencyRequest(server.id, {uid: user.userInfo.uid, diamond: diamondCount}, isForce, function(err, updateUserInfo){
        if(!!err){
            logger.error('writeUserDiamond error:'+ err);
        }
        this.updateRoomUserInfo(updateUserInfo, false);
        utils.invokeCallback(cb, err);
    });*/
};

pro.writeUserGold = function (chairId, goldCount, isForce, cb){
    let user = this.getUserByChairId(chairId);
    if(!user) {
        logger.error("writeUserDiamond", "user not exist chairId：" + chairId);
        utils.invokeCallback(cb);
        return;
    }
    let updateData = {
        $inc: {gold: goldCount}
    };
    userDao.updateUserData(user.userInfo.uid, updateData, function (err, newUserInfo) {
        if(!!err) {
            logger.error('write user gold', 'error:' + err);
        }
        this.updateRoomUserInfo(userInfoServices.buildGameRoomUserInfo(newUserInfo), false);
        userInfoServices.updateUserDataNotify(user.userInfo.uid, user.frontendId, {gold: newUserInfo.gold});
        utils.invokeCallback(cb, err);

    }.bind(this));
    /*let server = dispatch.dispatch(user.userInfo.uid, this.app.getServersByType('hall'));
    rpcAPI.changeCurrencyRequest(server.id, {uid: user.userInfo.uid, gold: goldCount}, isForce, function(err, updateUserInfo){
        if(!!err){
            logger.error('writeUserGold','error:'+ err);
        }
        this.updateRoomUserInfo(updateUserInfo, false);
        utils.invokeCallback(cb, err);
    });*/
};

pro.recordGameResult = function (dataArr, cb) {
    if (!dataArr || dataArr.length === 0){
        utils.invokeCallback(cb);
        return;
    }
    // 计算最终获得金币数量
    let profitPercentage = parseInt(this.publicParameter["profitPercentage"] || 5)/100;
    let saveDataArr = [];
    let systemGoldChange = 0;
    let gameProfitTotal = 0;
    let broadcastContentArr = [];
    for(let i = 0; i < dataArr.length; ++i){
        let data = dataArr[i];
        let tempScore = data.score;
        if (data.score > 0){
            data.score *= (1 - profitPercentage);
        }
        let user = this.userArr[data.uid];
        if (!user) continue;
        if (user.userInfo.robot){
            this.updateRoomUserInfo({uid:user.userInfo.uid, gold: user.userInfo.gold  + data.score}, this.roomType !== enumeration.roomType.HUNDRED, function(err){
                if(!!err){
                    logger.error('recordGameResult', 'updateRoomUserInfo err:' + err);
                }
            });
        }else{
            // 记录抽水总额
            if (tempScore > 0){
                gameProfitTotal += (tempScore * profitPercentage);
            }
            // 记录系统输赢分数
            systemGoldChange -= tempScore;
            saveDataArr.push({
                uid: data.uid,
                $inc: {
                    gold: data.score,
                    achievement: tempScore > 0?tempScore:(tempScore * -1),
                    todayWinGoldCount: data.score
                }
            });

        }
        // 记录广播内容
        if (tempScore >= 1000){
            broadcastContentArr.push({
                nickname: user.userInfo.nickname,
                kind: this.gameTypeInfo.kind,
                gold: tempScore
            })
        }
    }
    // 推送广播
    if (broadcastContentArr.length > 0){
        pushAPI.broadcastPush({type: enumeration.broadcastType.BIG_WIN, broadcastContentArr}, function (err) {
            if (!!err){
                logger.error("broadcastPush", err);
            }
        });
    }
    // 写入分数
    let self = this;
    userDao.updateUserDataArr(saveDataArr, function (err, updateUserDataArr) {
        if(!!err){
            logger.error('updateUserDataArr err:' + err);
        }
        if(!!updateUserDataArr){
            for (let i = 0; i < updateUserDataArr.length; ++i){
                let updateUserData = updateUserDataArr[i];
                if(!!self.userArr[updateUserData.uid]){
                    self.updateRoomUserInfo(userInfoServices.buildGameRoomUserInfo(updateUserData), self.roomType !== enumeration.roomType.HUNDRED, function(err){
                        if(!!err){
                            logger.error('recordGameResult', 'updateUserDataArr  updateRoomUserInfo err:' + err);
                        }
                    });
                }
                if (!!updateUserData.frontendId){
                    userInfoServices.updateUserDataNotify(updateUserData.uid, updateUserData.frontendId, {gold: updateUserData.gold, achievement: updateUserData.achievement, todayWinGoldCount: updateUserData.todayWinGoldCount});
                }
            }
        }
        utils.invokeCallback(cb);
    });
    let userGameRecordArr = [];
    for (let j = 0; j < saveDataArr.length; ++j){
        userGameRecordArr.push({
            drawID: this.drawID,
            roomLevel: this.gameTypeInfo.level,
            uid: saveDataArr[j].uid,
            kind: this.gameTypeInfo.kind,
            changeGold: saveDataArr[j].$inc.gold,
            createTime: Date.now()
        });
    }
    // 记录玩家金币变化
    dao.createDataArr("userGameRecordModel", userGameRecordArr, function (err) {
        if (!!err){
            logger.error("recordGameResult", 'createDataArr err:' + err);
        }
    });
    // 记录抽水比例
    if(gameProfitTotal > 0){
        let curDay = utils.getTimeDay();
        let saveData = {
            day: curDay,
            $inc: {"count": gameProfitTotal}
        };
        dao.updateDataEx("gameProfitRecordSchemaModel", {day: curDay}, saveData, {upsert:true}, function(err){
            if (!!err){
                logger.error("recordGameResult", "updateDataEx err:" + err);
            }
        });
    }
    // 记录库存值变化
    if (systemGoldChange !== 0){
        rpcAPI.robotGoldChanged(this.gameTypeInfo.kind, systemGoldChange, function (err) {
            if (!!err){
                logger.error("recordGameResult", 'robotGoldChanged err:' + err);
            }
        });
    }else{
        logger.debug("recordGameResult", "robotGoldChange === 0");
    }
    // 计算佣金
    for (let i = 0; i < dataArr.length; ++i){
        let data = dataArr[i];
        let tempScore = data.score;
        if (tempScore === 0) continue;
        let user = this.userArr[data.uid];
        if (!user) continue;
        if (user.userInfo.robot) continue;
        if (!user.userInfo.spreaderID) continue;
        spreadServices.updateMemberAchievement(user.userInfo.spreaderID, tempScore > 0?tempScore:tempScore * -1);
    }
};

pro.updateRoomRankInfo = function (dataArr) {
    // 非百人游戏不做记录
    if(this.roomType !== enumeration.roomType.HUNDRED) return;
    this.gameRecordDataArr.push(dataArr);
    if (this.gameRecordDataArr.length > 20) this.gameRecordDataArr.shift();

    let shenSuanZiInfo = null;
    let maxWinCount = 0;
    let recordDataList = {};
    for (let i = 0; i < this.gameRecordDataArr.length; ++i){
        let arr = this.gameRecordDataArr[i];
        for (let j = 0; j < arr.length; ++j){
            let data = arr[j];
            let user = this.userArr[data.uid];
            if (!user) continue;  // 过滤非在线玩家
            let recordData = recordDataList[data.uid];
            if (!!recordData){
                recordData.betCount += data.betCount;
                if (data.score > 0){
                    recordData.winCount ++;
                }
            }else{
                recordData = {
                    userInfo: user.userInfo,
                    betCount: data.betCount,
                    winCount: data.score > 0 ? 1:0
                };
                recordDataList[data.uid] = recordData;
            }
            if (recordData.winCount > maxWinCount){
                shenSuanZiInfo = recordData;
                maxWinCount = recordData.winCount;
            }
        }
    }
    let recordDataArr = [];
    for(let key in recordDataList){
        if (recordDataList.hasOwnProperty(key)){
            recordDataArr.push(recordDataList[key]);
        }
    }
    recordDataArr.sort(function (a, b) {
        return b.betCount - a.betCount;
    });
    this.shenSuanZiInfo = shenSuanZiInfo;
    this.fuhaoInfoArr = recordDataArr.slice(0, 20);
};

pro.writeUserGameResult = function (dataArr, cb) {
    this.recordGameResult(dataArr, cb);
};

// ---------------------------------进入房间相关----------------------------------
pro.userEntryRoom = function (userInfo, frontendId, cb) {
    logger.debug("roomFrame", "userEntryRoom, frontendId:" + frontendId + ",userInfo:" + JSON.stringify(userInfo));
    if (this.roomDismissed){
        utils.invokeCallback(cb, code.GAME.ROOM_HAS_DISMISS);
        return;
    }
    let user = this.userArr[userInfo.uid];
	let chairId = this.getEmptyChairId(userInfo.uid);
	if(chairId < 0){
	    logger.error("userEntryRoom", "not empty chair");
	    utils.invokeCallback(cb, code.HALL.ROOM_PLAYER_COUNT_FULL);
	    return;
    }
    if (!this.checkEntryRoom(userInfo)){
        utils.invokeCallback(cb, code.GAME.ROOM_EXPENSE_NOT_ENOUGH);
        return;
    }
    if(!user) {
        // 构建用户信息
        user = {};
        user.userInfo = userInfo;
        user.frontendId = frontendId;
        user.chairId = chairId;
        user.userStatus = roomProto.userStatusEnum.NONE;
        this.userArr[userInfo.uid] = user;
        this.currentUserCount++;

        if (userInfo.robot && !this.gameStarted){
            this.robotOperationExecReady(userInfo.uid);
        }
    }else{
        user.userInfo = userInfo;
        user.frontendId = frontendId;
		if((user.userStatus&roomProto.userStatusEnum.OFFLINE) > 0) {
			user.userStatus &= ~roomProto.userStatusEnum.OFFLINE;
		}
		// 取消离线倒计时
        if (!!this.offlineSchedulerIDs[userInfo.uid]){
		    scheduler.cancelJob(this.offlineSchedulerIDs[userInfo.uid]);
		    delete this.offlineSchedulerIDs[userInfo.uid];
        }
    }

    async.series([
        function (cb) {
            if (userInfo.robot){
                cb();
                return;
            }
            let localSessionService = this.app.get('localSessionService');
            userDao.updateUserData(userInfo.uid, {isLockGold: "true", roomID: this.roomId});
            userInfoServices.updateUserDataNotify(userInfo.uid, userInfo.frontendId, {roomID: this.roomId});
            localSessionService.getByUid(userInfo.frontendId, userInfo.uid, function(err, result) {
                if (!!err || !result || !result[0]) {
                    logger.warn('createRoom: Get session error');
                }else{
                    let session = result[0];
                    session.set ('roomID', this.roomId);
                    session.push('roomID', cb);
                }
            }.bind(this))
        }.bind(this),
        function (cb) {
            // 推送玩家自己进入房间的消息
            this.userSelfEntryRoomPush(user.userInfo.uid);

            if (this.roomType !== enumeration.roomType.HUNDRED){
                // 向其他玩家推送进入房间的消息(除了百人房间)
                let roomUserInfo = {
                    userInfo: user.userInfo,
                    userStatus: user.userStatus,
                    chairId: user.chairId
                };
                let otherUserEntryRoomPush = roomProto.otherUserEntryRoomPush(roomUserInfo);
                this.sendRoomDataExceptUid(otherUserEntryRoomPush, [user.userInfo.uid]);
            }
            // 非机器人进入房间的操作
            if (!userInfo.robot){
                this.robotOperationUserEntry();
            }
            // 判断游戏是否需要开始
            if(this.efficacyStartGame()) {
                this.startGame();
            }
            cb();
        }.bind(this)
    ], function (err) {
        utils.invokeCallback(cb, err);
    });
};

pro.checkEntryRoom = function (userInfo) {
    if (this.roomType === enumeration.roomType.PRIVATE){
        let diamondCost = this.getRoomDiamondCost(userInfo.uid === this.roomOwnerID, this.gameRule);
        if (userInfo.diamond < diamondCost) {
            if (userInfo.uid === this.roomOwnerID) {
                this.destroyRoom();
            }
            return false;
        }
    }else{
        let express = parseInt(this.gameTypeInfo["express"] || 0);
        if (!express){
            if (userInfo.gold < express){
                return false;
            }
        }
    }
    return true;
};

pro.getEmptyChairId = function (uid){
    if(this.userArr[uid]) {
        return this.userArr[uid].chairId;
    }
    let usedArr = [];
    let key, i;
    for(key in this.userArr) {
        if(this.userArr.hasOwnProperty(key)) {
            usedArr.push(this.userArr[key].chairId);
        }
    }

    logger.debug("getEmptyChairId", "userArr:" + JSON.stringify(usedArr));
    logger.debug("getEmptyChairId", "chairCount:" + this.chairCount);

    for(i = 0; i < this.chairCount; ++i) {
        if(usedArr.indexOf(i) === -1) {
            return i;
        }
    }
    return -1;
};

// 判断能否进入房间
pro.canEnterRoom = function(userInfo) {
    if(this.currentUserCount < this.chairCount) {
        return true;
    } else {
        for(let key in this.userArr) {
            if(this.userArr.hasOwnProperty(key)) {
                if(this.userArr[key].userInfo.uid === userInfo.uid) {
                    return true;
                }
            }
        }
    }
    return false;
};

pro.hasEmptyChair = function () {
    // 匹配房间，游戏开始之后不能在有玩家进入
    if (this.gameTypeInfo.matchRoom && this.gameStarted){
        return false
    }
    return this.currentUserCount < this.chairCount;
};

pro.getRoomDiamondCost = function(chairId, gameRule) {
    if(gameRule.isOwnerPay) {
        if(chairId === 0) {
            return gameRule.diamondCost;
        } else {
            return 0;
        }
    } else {
        return gameRule.diamondCost/gameRule.memberCount;
    }
};

pro.getRoomSceneInfo = function (uid) {
    let user = this.userArr[uid];
    let userInfoArr = [];
    if(this.roomType !== enumeration.roomType.HUNDRED){
        for(let key in this.userArr){
            if(this.userArr.hasOwnProperty(key)){
                let user1 = this.userArr[key];
                userInfoArr.push({
                    userInfo: user1.userInfo,
                    chairId: user1.chairId,
                    userStatus: user1.userStatus
                })
            }
        }
    }
    let gameData = !this.gameFrameSink.getEnterGameData?{}:this.gameFrameSink.getEnterGameData(user.chairId);	//获取游戏当前数据
    if(this.roomType === enumeration.roomType.PRIVATE){
        gameData.askForExitArr = this.askForExitArr;
    }else{
        gameData.askForExitArr = [];
    }
    this.sendRoomData(roomProto.getRoomSceneInfoPush(userInfoArr, gameData, this.roomId, this.drawID, this.gameTypeInfo), [{uid:uid, sid:user.frontendId}]);
};

pro.getRoomShowUserInfo = function (uid) {
    let selfInfo = {
        userInfo: this.userArr[uid].userInfo,
        winCount: 0,
        betCount: 0
    };
    this.sendRoomData(roomProto.getRoomShowUserInfoPush(selfInfo, this.shenSuanZiInfo, this.fuhaoInfoArr.slice(0, 5)), [{uid:uid, sid:this.userArr[uid].frontendId}]);
};

pro.getRoomOnlineUserInfo = function (uid) {
    this.sendRoomData(roomProto.getRoomOnlineUserInfoPush(this.shenSuanZiInfo, this.fuhaoInfoArr), [{uid:uid, sid:this.userArr[uid].frontendId}]);
};

// ---------------------------------离开房间相关----------------------------------
// 玩家断线重连
pro.userReconnect = function(uid) {
	let user = this.userArr[uid];
	if((user.userStatus & roomProto.userStatusEnum.OFFLINE) > 0) {
		user.userStatus &= ~roomProto.userStatusEnum.OFFLINE;
	}
    // 取消离线倒计时
    if (!!this.offlineSchedulerIDs[uid]){
        scheduler.cancelJob(this.offlineSchedulerIDs[uid]);
        delete this.offlineSchedulerIDs[uid];
    }

        // 推送游戏数据
	let gameData = this.gameFrameSink.getEnterGameData(user.chairId);
    if(this.roomType === enumeration.roomType.PRIVATE){
        gameData.askForExitArr = this.askForExitArr;
    }else{
        gameData.askForExitArr = [];
    }
	let msg = roomProto.getUserReconnectPushData(gameData);
	this.sendData(msg, [user.chairId]);
	if(this.roomType !== enumeration.roomType.HUNDRED){
        // 向其他玩家推送进入房间的消息(除百人游戏外)
        let roomUserInfo = {
            userInfo: user.userInfo,
            userStatus: user.userStatus,
            chairId: user.chairId
        };
        let otherUserEntryRoomPush = roomProto.otherUserEntryRoomPush(roomUserInfo);
        this.sendRoomDataExceptUid(otherUserEntryRoomPush, [user.userInfo.uid]);
    }
};

pro.userLeaveRoomRequest = function (uid) {
    logger.debug("roomFrame", "userLeaveRoomRequest uid:" + uid);
    let user = this.userArr[uid] || null;
    if (!!user){
        if (this.gameStarted && (user.userStatus & roomProto.userStatusEnum.PLAYING) !== 0 && !this.gameFrameSink.isUserEnableLeave(user.chairId)){
            this.sendPopDialogContent(code.GAME.CAN_NOT_LEAVE_ROOM, [user.chairId]);
            let response = roomProto.userLeaveRoomResponse(user.chairId);
            if (this.roomType === enumeration.roomType.HUNDRED){
                this.sendRoomData(response, [{uid: uid, sid: user.frontendId}]);
            }else{
                this.sendRoomDataToAll(response);
            }
        }else{
            this.userLeaveRoom(uid);
        }
    }else{
        logger.warn("roomFrame", "userLeaveRoomRequest user not exist uid:" + uid);
    }
};

pro.userLeaveRoom = function (uid){
    logger.debug("roomFrame", "userLeaveRoom uid:" + uid);
    let user = this.userArr[uid] || null;
    if(!!user) {
        let response = roomProto.userLeaveRoomResponse(user.chairId);
        if(this.roomType === enumeration.roomType.HUNDRED){
            this.sendRoomData(response, [{uid: uid, sid: user.frontendId}]);
        }else{
            this.sendRoomDataToAll(response);
        }
        // 私人房间
        if (this.roomType === enumeration.roomType.PRIVATE){
            // 开始过游戏无法直接退出
            if(this.gameStartedOnce) {
                user.userStatus |= roomProto.userStatusEnum.OFFLINE;
                if (this.roomType !== enumeration.roomType.HUNDRED){
                    this.sendRoomData(roomProto.userOffLinePush(user.chairId), [{uid: uid, sid: user.frontendId}]);
                }
            } else {
                // 未开始过游戏，可直接退出，房主退出，房间直接解散
                if(uid === this.roomOwnerID) {
                    this.dismissRoom(roomProto.roomDismissReason.RDR_OWENER_ASK);
                } else {
                    this.kickUser(uid);
                }
            }
        }
        // 非私人房间
        else{
            if (this.gameStarted && (user.userStatus & roomProto.userStatusEnum.PLAYING) !== 0){
                if (this.gameFrameSink.isUserEnableLeave(user.chairId)){
                    this.kickUser(uid);
                }else{
                    user.userStatus |= roomProto.userStatusEnum.OFFLINE;
                    if (this.roomType !== enumeration.roomType.HUNDRED){
                        this.sendRoomDataToAll(roomProto.userOffLinePush(user.chairId));
                    }
                    this.gameFrameSink.onEventUserOffLine(user.chairId);
                }
            }else{
                this.kickUser(uid);
            }
        }
    }else{
        logger.warn("roomFrame", "userLeaveRoom user not exist uid:" + uid);
    }
};

pro.userLeaveRoomNotify = function (uidAndSidArr, cb) {
    let localSessionService = this.app.get('localSessionService');
    for (let i = 0; i < uidAndSidArr.length; ++i){
        let uidAndSid = uidAndSidArr[i];
        let updateUserData = {
            roomID: "",
            isLockGold: "false"
        };
        userDao.updateUserData(uidAndSid.uid, updateUserData);
        userInfoServices.updateUserDataNotify(uidAndSid.uid, uidAndSid.sid, updateUserData);
        localSessionService.getByUid(uidAndSid.sid, uidAndSid.uid, function(err, result) {
            if (!!err || !result || !result[0]) {
                logger.warn('userLeaveRoomNotify: Get session error');
                utils.invokeCallback(cb);
            }else{
                let session = result[0];
                session.set ('roomID', null);
                session.push('roomID');
            }
        });
    }
    utils.invokeCallback(cb);
};

pro.kickUser = function(uid) {
    logger.debug("roomFrame", "kickUser uid:" + uid);
    let user = this.userArr[uid] || null;
    if(!!user) {
        // 通知游戏，用户离开
        if(this.gameStarted && !!this.gameFrameSink && !!this.gameFrameSink.onEventUserLeave){
            this.gameFrameSink.onEventUserLeave(user.chairId);
        }

        if (!user.userInfo.robot){
            // 通知大厅，玩家离开房间
            this.userLeaveRoomNotify([{uid: uid, sid: user.frontendId}]);
        }else{
            // 通知机器人服务器，机器人离开房间
            rpcAPI.robotLeaveRoomNotify(this.gameTypeInfo.kind, [uid], function (err) {
                if (!!err){
                    logger.error("roomFrame", "kickUser robotLeaveRoomNotify err:" + err);
                }
            });
        }
        let userRoomInfo = {
            userInfo: user.userInfo,
            chairId: user.chairId
        };
		// 百人房间只向退出玩家推送离开消息
        let otherUserLeavePush = roomProto.userLeaveRoomPush(userRoomInfo);
        if(this.roomType === enumeration.roomType.HUNDRED){
            this.sendRoomData(otherUserLeavePush, [{uid: uid, sid: user.frontendId}]);
        }else{
            this.sendRoomDataToAll(otherUserLeavePush);
        }
		delete this.userArr[uid];
		-- this.currentUserCount;
		// 停止定时器
        if (!!this.offlineSchedulerIDs[uid] || this.offlineSchedulerIDs[uid] === 0){
            scheduler.cancelJob(this.offlineSchedulerIDs[uid]);
            delete this.offlineSchedulerIDs[uid];
        }

        // 当有用户离开时
        if (!user.userInfo.robot){
            // 机器人的操作
            this.robotOperationUserLeaved();
        }
	}
	if(this.efficacyStartGame()){
        this.startGame();
    }
	if(this.efficacyDismissRoom()){
        this.dismissRoom(roomProto.roomDismissReason.RDR_NONE);
    }
};

pro.userOffLine = function (uid, cb){
    logger.debug("roomFrame", "userOffLine uid:" + uid);
	let user = this.userArr[uid];
	if(!!user) {
	    if(this.roomType === enumeration.roomType.PRIVATE){
	        this.userLeaveRoom(uid);
        }else{
	        if (!this.gameStarted || this.gameFrameSink.isUserEnableLeave(user.chairId)){
                this.userLeaveRoom(uid);
            }else{
	            if (!this.offlineSchedulerIDs[uid] && this.offlineSchedulerIDs[uid] !== 0){
                    // 设置定时器
                    this.offlineSchedulerIDs[uid] = scheduler.scheduleJob({start: Date.now() + OFFLINE_WAIT_TIME, count: 1}, function () {
                        // 移除定时
                        delete this.offlineSchedulerIDs[uid];
                        this.userLeaveRoom(uid);
                    }.bind(this));
                }else{
                    logger.warn('roomFrame', "userOffLine offlineSchedulerIDs is exist. uid:" + uid);
                }
            }
        }
	} else {
        logger.warn('roomFrame', "userOffLine user not exist uid:" + uid);
	}
    utils.invokeCallback(cb);
};

// ---------------------------------解散房间相关----------------------------------
pro.efficacyDismissRoom = function () {
    if (this.roomDismissed) return false;
    if (this.roomType === enumeration.roomType.HUNDRED) return false;
    return this.currentUserCount === 0;
};

pro.dismissRoom = function(reason) {
    if (this.roomDismissed) return;         // 防止重复解散
    logger.debug("roomFrame", "dismissRoom roomID:" + this.roomId);
    this.roomDismissed = true;
    if (!!this.requestRobotTimer) clearTimeout(this.requestRobotTimer);
    if (!!this.requestRobotInterval) clearInterval(this.requestRobotInterval);
	if(reason === roomProto.roomDismissReason.RDR_USER_ASK || reason === roomProto.roomDismissReason.RDR_NONE) {
	    if (this.roomType === enumeration.roomType.PRIVATE){
            let gameResult = this.gameFrameSink.onGetFinalResoutData();
            if(gameResult !== null) {
                let msg = roomProto.getGameEndPushData(gameResult);
                this.sendRoomDataToAll(msg);
            }
        }
	}

	// 通知大厅玩家离开了房间
    let uidAndSidArr = [];
    for(let key in this.userArr){
	    if(this.userArr.hasOwnProperty(key)){
	        let user = this.userArr[key];
	        if (!user.userInfo.robot){
                uidAndSidArr.push({uid:user.userInfo.uid, sid: user.frontendId});
            }
        }
    }

    this.userLeaveRoomNotify(uidAndSidArr);

	let self = this;
    this.app.roomManager.dismissRoom(this.roomId, function(err) {
        if(!!err){
            logger.error("roomFrame", 'dismissRoom error:' + err);
        }

        self.destroyRoom(reason);

        // 房间解散时，机器人操作
        self.robotOperationDismissRoom();

        let msg = roomProto.roomDismissPush(reason);
        self.sendRoomDataToAll(msg);
    });
};

pro.destroyRoom = function(reason) {
    logger.debug("roomFrame", "destroyRoom roomID:" + this.roomId);
    this.gameFrameSink.onEventRoomDismiss(reason);
    this.gameFrameSink = null;
};

pro.writeRecord = function(data, cb) {
	if(data) {
        dao.createData("gameRecordModel", data, function (err) {
            if (!!err){
                logger.error("roomFrame", 'writeRecord error:' + err);
            }
            utils.invokeCallback(cb, err);
        });
	}else{
        utils.invokeCallback(cb);
    }
};

pro.writeRecordEx = function (data, cb) {
    if (!!data) {
        let recordData = {
            kindId: this.gameTypeInfo.kind,
            uidArr: data.uidArr,
            record: JSON.stringify(data),
            createTime: Date.now()
        };
        for (let i = 0; i < data.uidArr.length; i ++) {
            recordData.uidArr[i] = data.uidArr[i] + '';
        }
        dao.createData("gameRecordModel", recordData, function (err) {
            if (!!err){
                logger.error("roomFrame", 'writeRecordEx error:' + err);
            }
            utils.invokeCallback(cb, err);
        });
    }else{
        utils.invokeCallback(cb);
    }
};

// 玩家请求解散房间
pro.askForDismiss = function(uid, isExit) {
    // 如果是非私人房，请求解散则直接退出房间
    if (this.roomType !== enumeration.roomType.PRIVATE){
        this.userLeaveRoomRequest(uid);
        return;
    }
    // 游戏未开始 直接离开
    if(! this.gameStartedOnce) {
        this.userLeaveRoom(uid);
        return;
    }
    let nameArr = [];
    for(let a = 0; a < this.chairCount; ++a) {
        nameArr[a] = '';
    }
    for(let key in this.userArr) {
        if(this.userArr.hasOwnProperty(key)) {
            nameArr[this.userArr[key].chairId] = this.userArr[key].userInfo.nickname;
        }
    }

    let scoreArr = [];
    if(this.gameFrameSink.onGetCurrentScoreArr) {
        scoreArr = this.gameFrameSink.onGetCurrentScoreArr();
    } else {
        for(let b = 0; b < this.chairCount; ++b) {
            scoreArr[b] = 0;
        }
    }

    let nullCount = 0, trueCount = 0;
    if(isExit === true || isExit === false) {
        this.askForExitArr[this.userArr[uid].chairId] = isExit;
    }
    for(let c = 0; c < this.askForExitArr.length; ++c) {
        if(this.askForExitArr[c] === null) {
            ++ nullCount;
        }
        else if(this.askForExitArr[c] === true) {
            ++ trueCount;
        }
    }

    if(nullCount === this.askForExitArr.length-1) {
        this.askForExitTm = Date.now();
        let self = this;
        if(! this.answerExitSchedule) {
            this.answerExitSchedule = scheduler.scheduleJob({start: this.askForExitTm+roomProto.ANSWER_EXIT_SECOND*1000, count: 1}, function() {
                for(let i = 0; i < self.chairCount; ++i) {
                    if(self.askForExitArr[i] === null) {
                        let user = self.getUserByChairId(i);
                        self.askForDismiss(user.userInfo.uid, true);
                    }
                }
            });
        }
    }
    let msg_a = roomProto.getAskForDismissPushData(this.askForExitArr, nameArr, scoreArr, this.askForExitTm, this.userArr[uid].chairId);
    if(isExit === true || isExit === false) {
        this.sendRoomData(msg_a);
    } else {
        this.sendRoomData(msg_a);
    }

    if(nullCount === 0) {
        if(!! this.answerExitSchedule) {
            scheduler.cancelJob(this.answerExitSchedule);
            this.answerExitSchedule = null;
            this.askForExitTm = null;
        }
        this.initAskForExitArr();
    }
    if(trueCount === this.askForExitArr.length) {
        if(this.curBureau >= 1) {
            this.dismissRoom(roomProto.roomDismissReason.RDR_USER_ASK);
        } else {
            this.dismissRoom(roomProto.roomDismissReason.RDR_OWENER_ASK);
        }
    }
};

pro.askForDismissStatus = function(uid) {
    let isOnDismiss = false;
    for(let i = 0; i < this.askForExitArr.length; ++i) {
        if(this.askForExitArr[i] !== null) {
            isOnDismiss = true;
            break;
        }
    }
    let msg = roomProto.getAskDismissStatusPushData(isOnDismiss);
    let uidAndFrontendIdArr = [{
        uid: uid,
        sid: this.userArr[uid].frontendId
    }];
    this.sendRoomData(msg, uidAndFrontendIdArr);
};

pro.initAskForExitArr = function() {
    if(! this.askForExitArr) {
        this.askForExitArr = [];
    }
    let i;
    for(i = 0; i < this.chairCount; ++i) {
        this.askForExitArr[i] = null;
    }
    return this.askForExitArr;
};

// ----------------------------------机器人接收相关----------------------------------
pro.robotOperationRoomCreated = function () {
    if (this.roomType === enumeration.roomType.PRIVATE) return;
    if (!!this.gameTypeInfo.matchRoom){
        if(!!this.requestRobotTimer) return;
        // 玩家进入后，如果玩家人数不足，则用机器人补齐
        this.requestRobotTimer = setTimeout(function () {
            this.requestRobotTimer = null;
            if (this.gameStarted || this.roomDismissed) return;
            let needMinRobotCount = this.gameTypeInfo.minPlayerCount - this.currentUserCount;
            let needMaxRobotCount = this.gameTypeInfo.maxPlayerCount - this.currentUserCount;
            if (needMinRobotCount < this.gameTypeInfo.minRobotCount && needMaxRobotCount >= this.gameTypeInfo.minRobotCount){
                needMinRobotCount = this.gameTypeInfo.minRobotCount;
            }
            if (needMaxRobotCount > this.gameTypeInfo.maxRobotCount && needMinRobotCount <= this.gameTypeInfo.maxRobotCount){
                needMaxRobotCount = this.gameTypeInfo.maxRobotCount;
            }
            if (needMaxRobotCount === 0) return;
            rpcAPI.requestRobotNotify(this.roomId, this.gameTypeInfo, utils.getRandomNum(needMinRobotCount, needMaxRobotCount), function (err) {
                if(!!err){
                    logger.error("robotOperationRoomCreated", "err:" + err);
                }
            });
        }.bind(this), 10);
    }else if (this.roomType === enumeration.roomType.HUNDRED){
        // 每五分钟检测一次机器人是否足够，不够则请求添加
        this.requestRobotInterval = setInterval(function () {
            if (this.currentUserCount < 20){
                rpcAPI.requestRobotNotify(this.roomId, this.gameTypeInfo, 20 - this.currentUserCount, function (err) {
                    if(!!err){
                        logger.error("robotOperationRoomCreated", "err:" + err);
                    }
                });
            }
        }.bind(this), 5 * 60 * 1000);
    } else if (this.gameTypeInfo.kind === enumeration.gameType.FISH){
        // 捕鱼特殊处理，进入时请求机器人，每2分钟检测一次机器人是否需要添加机器人
        // 玩家进入后，请求机器人
        setTimeout(function () {
            if (this.roomDismissed) return;
            rpcAPI.requestRobotNotify(this.roomId, this.gameTypeInfo, utils.getRandomNum(0, this.gameTypeInfo.maxPlayerCount - 1), function (err) {
                if(!!err){
                    logger.error("robotOperationRoomCreated", "err:" + err);
                }
            });
        }.bind(this), 10);
        // 每2分钟检测一次机器人是否需要添加机器人
        this.requestRobotInterval = setInterval(function () {
            if (this.currentUserCount < this.gameTypeInfo.maxPlayerCount){
                rpcAPI.requestRobotNotify(this.roomId, this.gameTypeInfo, utils.getRandomNum(0, this.gameTypeInfo.maxPlayerCount - this.currentUserCount), function (err) {
                    if(!!err){
                        logger.error("robotOperationRoomCreated", "err:" + err);
                    }
                });
            }
        }.bind(this), 2 * 60 * 1000);
    }
};

pro.robotOperationGamePrepare = function () {
    // 非自动开始游戏，机器人自动准备
    if (this.gameRoomStartType === enumeration.gameRoomStartType.AUTO_START) return;
    for (let key in this.userArr){
        if (this.userArr.hasOwnProperty(key)){
            let user = this.userArr[key];
            if (user.userInfo.robot){
                this.robotOperationExecReady(user.userInfo.uid);
            }
        }
    }
};

pro.robotOperationExecReady = function (uid) {
    let self = this;
    setTimeout(function () {
        if (!self.userArr[uid] || self.roomDismissed || self.gameStarted) return;
        if ((self.userArr[uid].userStatus & roomProto.userStatusEnum.READY) !== 0) return;
        self.userReady(uid);
        self.userReady(uid);
    }, utils.getRandomNum(1000, 2000));
};

pro.robotOperationUserEntry = function () {
    // 通知机器人服务器
    if (this.roomType !== enumeration.roomType.HUNDRED) return;

    if (this.currentUserCount < 20){
        rpcAPI.requestRobotNotify(this.roomId, this.gameTypeInfo, 20 - this.currentUserCount, function (err) {
            if(!!err){
                logger.error("robotOperationRoomCreated", "err:" + err);
            }
        });
    }
};

pro.robotOperationUserLeaved = function () {
    if (this.roomType === enumeration.roomType.HUNDRED) return;
    // 如果该房间没有真人，则剩余机器人离开房间(百人游戏除外)
    let leftUidArr = [];
    for (let key in this.userArr){
        if (this.userArr.hasOwnProperty(key)){
            let user = this.userArr[key];
            if (!user.userInfo.robot) return;
            leftUidArr.push(user.userInfo.uid);
        }
    }
    // 只剩下一个机器人
    if (leftUidArr.length === 1){
        this.kickUser(leftUidArr[0]);
    }
};

pro.robotOperationConcludeGame = function () {
    // 判定机器人是否需要离开游戏，当房间中无真人时，所有机器人离开房间
    let leaveUidArr = [];
    for (let key in this.userArr){
        if (this.userArr.hasOwnProperty(key)){
            let user = this.userArr[key];
            if (user.userInfo.robot){
                if(this.gameRoomStartType === enumeration.gameRoomStartType.AUTO_START){
                    if (!!this.gameFrameSink && !this.gameFrameSink.isUserEnableLeave(user.chairId)) {
                        continue;
                    }
                }
                // 每局结束，机器人有百分之30的概率离开游戏
                if (utils.getRandomNum(1, 10) <= 2){
                    leaveUidArr.push(user.userInfo.uid);
                }
            }
        }
    }
    for (let i = 0; i < leaveUidArr.length; ++i){
        this.robotOperationExecLeave(leaveUidArr[i]);
    }

    this.robotOperationUserLeaved();
};

pro.robotOperationExecLeave = function (uid) {
    let self = this;
    if (this.roomType === enumeration.roomType.HUNDRED){
        self.kickUser(uid);
    }else{
        setTimeout(function () {
            if (self.gameStarted && (self.gameTypeInfo.kind !== enumeration.gameType.FISH)) return; // 捕鱼游戏特殊处理
            if (!self.userArr[uid] || self.roomDismissed) return;
            self.kickUser(uid);
        }, utils.getRandomNum(2000, 5000));
    }
};

pro.robotOperationRecordGameResult = function (dataArr) {};

pro.robotOperationDismissRoom = function () {
    // 解散房间后，通知所有机器人离开房间
    let leaveUidArr = [];
    for (let key in this.userArr){
        if (this.userArr.hasOwnProperty(key)){
            let user = this.userArr[key];
            if (user.userInfo.robot){
                leaveUidArr.push(user.userInfo.uid);
            }
        }
    }
    if(leaveUidArr.length > 0){
        rpcAPI.robotLeaveRoomNotify(this.gameTypeInfo.kind, leaveUidArr, function (err) {
            if(!!err){
                logger.error("robotOperationDismissRoom", "userLeaveRoomNotify err" + err);
            }
        })
    }
};

pro.getCurRobotWinRate = function () {
    return this.robotWinRate;
};

// ---------------------------------房间聊天相关----------------------------------
// 聊天相关
pro.userWillWin = function (uid, data) {
    let user = this.userArr[uid];
    if (!!user) {
        let chairId = user.chairId;
        this.gameFrameSink.setWinner(parseInt(chairId));
    }
};

// ---------------------------------房间接口相关----------------------------------
pro.getUserByChairId = function(chairId){
    let userArr = this.userArr;
    for (let key in  userArr){
          if(userArr.hasOwnProperty(key) && (userArr[key].chairId === chairId)){
            return userArr[key];
        }
    }
    return null;
};

pro.getChairIdByUid = function (uid){
    let user = this.userArr[uid];
    if(!!user){
        return user.chairId;
    }
    return -1;
};

pro.getCurrentUserCount = function() {
	return this.currentUserCount;
};

pro.ownUser = function(uid) {
	return this.userArr.hasOwnProperty(uid);
};

pro.isShouldDelete = function(time){
    return (Date.now() - this.lastNativeTime >= time) && (this.roomType !== enumeration.roomType.HUNDRED);
};

pro.setGameWinRate = function(uid, rate) {
	let chairId = this.userArr[uid].chairId;
	if(this.gameFrameSink.onSetGameWinRate) {
		this.gameFrameSink.onSetGameWinRate(chairId, rate);
	}
};

pro.getGameTypeInfo = function () {
    return this.gameTypeInfo;
};

pro.getCurGameData = function () {
    if (!!this.gameFrameSink.getEnterGameData) {
        return {
            roomID: this.roomID,
            gameData: this.gameFrameSink.getEnterGameData()
        }
    }
    else return null;
};
