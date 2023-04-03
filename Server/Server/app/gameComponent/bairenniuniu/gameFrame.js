let roomProto = require('../../API/Protos/RoomProto');
let utils = require('../../util/utils');
let gameLogic = require('./BRNNGameLogic');
let gameProto = require('./BRNNProto');

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
    this.timerID = setTimeout(function () {
        // 初始化数据
        this.gameStatus = gameProto.gameStatus.GAME_STARTED;
        this.betRecordList = {};
        this.startTime = Date.now();
        // 发送游戏开始通知
        this.roomFrame.sendDataToAll(gameProto.gameStartPush(this.roomFrame.drawID));
        // 开启游戏结束定时器
        setTimeout(this.endGame.bind(this), gameProto.BET_TIME * 1000);
        // 机器人下注
        this.robotOperation();
    }.bind(this), (this.gameStatus === gameProto.gameStatus.NONE)?1000: gameProto.SHOW_RESULT_TIME * 1000);
};

// 游戏结束
pro.endGame = function () {
    if(this.gameStatus !== gameProto.gameStatus.GAME_STARTED) return;
    this.gameStatus = gameProto.gameStatus.GAME_END;
    // 洗牌
    let allCardData = gameLogic.getRandCardList();
    let cardDataArr = [];
    for (let i = 0; i < 5; ++i){
        cardDataArr.push(allCardData.splice(0, 5));
    }
    // 获取机器人胜率
    let rate = this.roomFrame.getCurRobotWinRate();
    // 获取牌
    if (Math.random() < rate){
        // 控制输赢，将最大的牌发给庄家
        let maxIndex = 4;
        for (let i = 0; i < 4; ++i){
            if (!gameLogic.compareCard(cardDataArr[maxIndex], cardDataArr[i])){
                maxIndex = i;
            }
        }
        if (maxIndex !== 4){
            let temp = cardDataArr[4];
            cardDataArr[4] = cardDataArr[maxIndex];
            cardDataArr[maxIndex] = temp;
        }
    }
    // 计算赢分类型
    let winTimesArr = [];
    let bankerCardDataArr = cardDataArr[4];
    for (let i = 0; i < 4; ++i){
        if (gameLogic.compareCard(cardDataArr[i], bankerCardDataArr)){
            winTimesArr.push(gameLogic.getWinTimes(gameLogic.getCardType(cardDataArr[i])))
        }else{
            winTimesArr.push(-gameLogic.getWinTimes(gameLogic.getCardType(bankerCardDataArr)));
        }
    }
    let cardTypeArr = [];
    for (let i = 0; i < cardDataArr.length; ++i){
        let cardType = gameLogic.getCardType(cardDataArr[i]);
        cardTypeArr.push(cardType);
        if (cardType >= 1 && cardType <= 10){
            gameLogic.sortCard(cardDataArr[i]);
        }
    }
    // 发送游戏结束通知
    let scoreChangeArr = this.getScoreChangeArr(winTimesArr);
    this.roomFrame.sendDataToAll(gameProto.gameResultPush(scoreChangeArr, cardDataArr, winTimesArr, cardTypeArr));
    // 记录走势，最多记录20局
    this.dirRecord.push(winTimesArr);
    while (this.dirRecord.length > 10){
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
            let betType = utils.getRandomNum(0, 3);
            let maxBetCount = 2000;
            let betCount = utils.getRandomNum(1, user.userInfo.gold * 0.5 > maxBetCount ? maxBetCount: Math.floor(user.userInfo.gold * 0.5));
            self.userBet(user.chairId, {betInfoArr: [{
                betCount: betCount,
                betType: betType
            }]})
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

pro.getScoreChangeArr = function (winTimesArr) {
    let goldChangeArr = [];
    for (let key in this.betRecordList){
        if (this.betRecordList.hasOwnProperty(key)){
            let userBetInfo = this.betRecordList[key];
            // 计算赢分
            let score = 0;
            let totalBetCount = 0;
            for (let i = 0; i < winTimesArr.length; ++i){
                let betCount = userBetInfo[i] || 0;
                score += (betCount * winTimesArr[i])

                totalBetCount += betCount;
            }

            goldChangeArr.push({uid: key, score: score, betCount: totalBetCount});
        }
    }
    return goldChangeArr;
};

// 计算分数
pro.userBet = function (chairID, data) {
    // 判定是否能下注
    if (this.gameStatus !== gameProto.gameStatus.GAME_STARTED) return false;
    if (!data.betInfoArr || data.betInfoArr.length === 0) return false;
    let totalCount = 0;
    for (let i = 0; i < data.betInfoArr.length; ++i){
        let info = data.betInfoArr[i];
        if ((info.betType !== gameProto.TIAN) && (info.betType !== gameProto.DI) && (info.betType !== gameProto.XUAN) && (info.betType !== gameProto.HUANG)) return false;
        if (typeof info.betCount !== 'number' || info.betCount <= 0) return false;
        totalCount += info.betCount;
    }

    let user = this.roomFrame.getUserByChairId(chairID);
    if (!user) return false;
    let userBetInfo = this.betRecordList[user.userInfo.uid] || {};
    let alreadyBetCount = 0;
    for (let key in userBetInfo){
        if (userBetInfo.hasOwnProperty(key)){
            alreadyBetCount += userBetInfo[key];
        }
    }
    // 下注金额不得操作自己金币的三分之一
    if ((alreadyBetCount + totalCount) * 3 > user.userInfo.gold) return false;
    // 更新下注记录
    for (let i = 0; i < data.betInfoArr.length; ++i){
        let info = data.betInfoArr[i];
        if(info.betType in userBetInfo){
            userBetInfo[info.betType] += info.betCount;
        }else{
            userBetInfo[info.betType] = info.betCount;
        }
    }
    this.betRecordList[user.userInfo.uid] = userBetInfo;
    // 推送下注消息
    this.roomFrame.sendDataToAll(gameProto.gameUserBetPush(user.userInfo.uid, data.betInfoArr));
};

pro.getUserBetInfoByUid = function (uid) {
    return this.betRecordList[uid];
};

/* 玩家进入游戏时数据 */
pro.getEnterGameData = function() {
	return {
        drawID: this.roomFrame.drawID,
	    betLeftTime: gameProto.BET_TIME - Math.floor((Date.now() - this.startTime)/1000),
		gameStatus: this.gameStatus,
        betRecordList: this.betRecordList,
		dirRecord: this.dirRecord,
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
	let user = this.roomFrame.getUserByChairId(entryUserChairId);
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
	if(!! cb) cb();
	return false;
};

pro.onEventRoomDismiss = function() {
	if(this.timerID) {
		clearTimeout(this.timerID);
		this.timerID = null;
	}
};
