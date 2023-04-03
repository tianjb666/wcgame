let roomProto = require('../../API/Protos/RoomProto');
let utils = require('../../util/utils');
let gameLogic = require('./gameLogic');
let gameProto = require('./LHDProto');
let scheduler = require('pomelo-scheduler');
let logger = require('pomelo-logger').getLogger('game');

let BET_TIME = 10;
let CAN_BET_MIN_USER_GOLD = 50;

module.exports = function(roomFrame) {
	return new gameFrameSink(roomFrame);
};

let gameFrameSink = function(roomFrame) {
	this.roomFrame		= roomFrame;
	this.gameStatus		= gameProto.gameStatus.NONE;
	this.betRecordList		= {};							// 下注记录
	this.dirRecord		= [];		                        // 走势记录
    this.resultData    = null;                             // 游戏结果
    this.startTime     = 0;                                 // 游戏开始时间
};

let pro = gameFrameSink.prototype;

pro.receivePlayerMessage = function (chairID, msg){
	let type = msg.type || null;
	let data = msg.data || null;
	if (!type || !data) return false;

	if(type === gameProto.GAME_POURGOLD_NOTIFY) {				// 下注请求
        this.userBet(chairID, data);
	}
	return false;
};

// 开始游戏
pro.startGame = function() {
    // 延迟开始下一局
    setTimeout(function () {
        logger.debug("longhudou game start");
        // 初始化数据
        this.gameStatus = gameProto.gameStatus.GAME_STARTED;
        this.betRecordList = {};
        this.resultData = null;
        this.startTime = Date.now();
        // 发送游戏开始通知
        this.roomFrame.sendDataToAll(gameProto.gameStartPush());
        // 开启游戏结束定时器
        setTimeout(this.endGame.bind(this), gameProto.BET_TIME * 1000);
        // 机器人下注
        this.robotOperation();
    }.bind(this), (this.gameStatus === gameProto.gameStatus.NONE)?1000: gameProto.SHOW_RESULT_TIME * 1000);
};

// 游戏结束
pro.endGame = function () {
    if(this.gameStatus !== gameProto.gameStatus.GAME_STARTED) return;
    logger.debug("longhudou game end");
    this.gameStatus = gameProto.gameStatus.GAME_END;
    // 获取机器人胜率
    let rate = this.roomFrame.getCurRobotWinRate();
    let cardDataArr;
    // 获取牌
    if (Math.random() < rate){
        // 控制输赢，获取赢方
        let type = this.getMaximumBetType();
        if (type < 0){
            cardDataArr = gameLogic.getCards();
        }else{
            cardDataArr = gameLogic.getCardsEx(type);
        }
    }else{
        cardDataArr = gameLogic.getCards();
    }
    // 计算赢分类型
    let winType = gameLogic.getWinType(cardDataArr[0], cardDataArr[1]);
    // 发送游戏结束通知
    let scoreChangeArr = this.getScoreChangeArr(winType);
    this.resultData = {
        longCard: cardDataArr[0],
        huCard: cardDataArr[1],
        winType:winType,
        scoreChangeArr: scoreChangeArr
    };
    this.roomFrame.sendDataToAll(gameProto.gameResultPush(scoreChangeArr, cardDataArr[0], cardDataArr[1], winType));
    // 记录走势，最多记录20局
    this.dirRecord.push(winType);
    while (this.dirRecord.length > 20){
        this.dirRecord.shift();
    }
    // 通知房间游戏结束
    this.roomFrame.concludeGame(scoreChangeArr);
};

pro.robotOperation = function () {
    let self = this;
    function robotBet(user) {
        if (user.userInfo.gold < CAN_BET_MIN_USER_GOLD) return;
        setTimeout(function () {
            let rand = utils.getRandomNum(0, 10);
            let betType;
            if (rand === 0) betType = gameProto.HE;
            else betType = rand%2;

            let maxBetCount = 2000;
            if (betType === gameProto.HE){
                maxBetCount = 300;
            }
            let betCount = utils.getRandomNum(1, user.userInfo.gold * 0.5 > maxBetCount ? maxBetCount: Math.floor(user.userInfo.gold * 0.5));
            self.userBet(user.chairId, {
                count:betCount,
                betType: betType
            })
        }, utils.getRandomNum(2000, (BET_TIME - 1.5) * 1000));
    }
    for (let key in this.roomFrame.userArr){
        if (this.roomFrame.userArr.hasOwnProperty(key)){
            let user = this.roomFrame.userArr[key];
            if(!user.userInfo.robot) continue;
            robotBet(user);
        }
    }
};

pro.getScoreChangeArr = function (winType) {
    let goldChangeArr = [];
    for (let key in this.betRecordList){
        if (this.betRecordList.hasOwnProperty(key)){
            let userBetInfo = this.betRecordList[key];
            // 计算赢分
            let score = 0;
            if(winType === gameProto.HE){
                score = (gameProto.HE in userBetInfo)?userBetInfo[gameProto.HE] * 8 : 0;
            } else{
                for (let key1 in userBetInfo){
                    if (userBetInfo.hasOwnProperty(key1)){
                        if (key1 === winType.toString()){
                            score += (userBetInfo[key1]);
                        }else{
                            score -= (userBetInfo[key1]);
                        }
                    }
                }
            }
            let betCount = 0;
            // 记录下注总额
            betCount += (userBetInfo[gameProto.LONG] || 0);
            betCount += (userBetInfo[gameProto.HU] || 0);
            betCount += (userBetInfo[gameProto.HE] || 0);

            goldChangeArr.push({uid: key, score: score, betCount: betCount});
        }
    }
    return goldChangeArr;
};

// 计算分数
pro.userBet = function (chairID, data) {
    // 判定是否能下注
    if (this.gameStatus !== gameProto.gameStatus.GAME_STARTED) return false;
    if (typeof data.count !== 'number' || Math.floor(data.count) <= 0) return false;
    if ((data.betType !== gameProto.LONG) && (data.betType !== gameProto.HU) && (data.betType !== gameProto.HE)) return false;
    let user = this.roomFrame.getUserByChairId(chairID);
    if (!user) return false;
    let userBetInfo = this.betRecordList[user.userInfo.uid] || {};
    let alreadyBetCount = 0;
    for (let key in userBetInfo){
        if (userBetInfo.hasOwnProperty(key)){
            alreadyBetCount += userBetInfo[key];
        }
    }
    if (alreadyBetCount + data.count > user.userInfo.gold) return false;
    // 更新下注记录
    if(data.betType in userBetInfo){
        userBetInfo[data.betType] += data.count;
    }else{
        userBetInfo[data.betType] = data.count;
    }
    this.betRecordList[user.userInfo.uid] = userBetInfo;
    // 推送下注消息
    this.roomFrame.sendDataToAll(gameProto.gameUserBetPush(user.userInfo.uid, data.betType, data.count));
};

pro.getUserBetInfoByUid = function (uid) {
    return this.betRecordList[uid];
};

pro.getMaximumBetType = function () {
    let longBetCount = 0;
    let huBetCount = 0;
    for(let key in this.betRecordList){
        if (this.betRecordList.hasOwnProperty(key)){
            let user = this.roomFrame.userArr[key];
            if (!user || user.userInfo.robot) continue;
            let betRecord = this.betRecordList[key];
            longBetCount += (betRecord[gameProto.LONG] || 0);
            huBetCount += (betRecord[gameProto.HU] || 0);
        }
    }

    if(longBetCount === huBetCount){
        return -1;
    }else if (longBetCount > huBetCount){
        return gameProto.HU;
    }else{
        return gameProto.LONG;
    }
};

/* 玩家进入游戏时数据 */
pro.getEnterGameData = function() {
	return {
	    betLeftTime: Math.floor((Date.now() - this.startTime)/1000),
		gameStatus: this.gameStatus,
        betRecordList: this.betRecordList,
		dirRecord: this.dirRecord,
        resultData: this.resultData,
		profitPercentage: this.roomFrame.publicParameter.profitPercentage
	};
};

/**************************************************************************************
 * room message
 */
pro.onEventGamePrepare = function(cb) {
	if(!!cb) cb();
};

pro.onEventGameStart = function(cb) {
	this.startGame();
	if(!! cb) cb();
};

pro.onEventUserEntry = function(entryUserChairId, cb) {
	var user = this.roomFrame.getUserByChairId(entryUserChairId);
	user.userStatus = roomProto.userStatusEnum.PLAYING;
	if(!! cb) cb();
};

pro.onEventUserLeave = function(leaveUserChairId, cb) {
	if(!! cb) cb();
};

pro.isUserEnableLeave = function(userChairId) {
    if(this.gameStatus !== gameProto.gameStatus.GAME_STARTED) return true;
    let user = this.roomFrame.getUserByChairId(userChairId);
	return !this.getUserBetInfoByUid(user.userInfo.uid);
};

pro.onEventUserOffLine = function(offLineUserChairId, cb) {
	var user = this.roomFrame.getUserByChairId(offLineUserChairId);
	for(var key in this.bankerPool) {
		if(this.bankerPool.hasOwnProperty(key)) {
			var index = this.bankerPool[key].indexOf(user.userInfo.uid);
			if(index >= 0) { this.bankerPool[key].splice(index, 1); }
		}
	}
	if(!! cb) cb();
	return false;
};

pro.onEventRoomDismiss = function() {
	if(this.schedulerId) { 
		scheduler.cancelJob(this.schedulerId); 
		this.schedulerId = null;
	}
};

pro.getRobotPourGoldOnDir = function(dir) {
	var pourArr = this.pourPool[dir];
	var pourGold = 0;
	for(var i = 0; i < pourArr.length; ++i) {
		var user = this.roomFrame.userArr[pourArr[i].uid];
		if(user && user.userInfo.robot) {
			pourGold += pourArr[i].pourGold;
		}
	}
	return pourGold;
};

pro.getPlayerPourGoldOnDir = function(dir) {
	var pourArr = this.pourPool[dir];
	var pourGold = 0;
	for(var i = 0; i < pourArr.length; ++i) {
		var user = this.roomFrame.userArr[pourArr[i].uid];
		if(user && !user.userInfo.robot) {
			pourGold += pourArr[i].pourGold;
		}
	}
	return pourGold;
};

// 根据机器人胜率调整牌
pro.getCardsByWinRate = function(cardsArr) {
	return cardsArr;
};
