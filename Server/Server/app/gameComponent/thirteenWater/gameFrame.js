var gameLogic = require('./gameLogic');
var roomProto = require('../../API/Protos/RoomProto');
var gameProto = require('./gameProto');
var scheduler = require('pomelo-scheduler');
var utils = require('../../util/utils');

module.exports = function(gameFrame) {
	return new gameFrameSink(gameFrame);
};

var gameFrameSink = function(gameFrame) {
	this.gameFrame = gameFrame;
	this.gameRule = this.gameFrame.gameRule;

    this.gameSettleFinishedTm = 0;

	this.resetGame();
};

var pro = gameFrameSink.prototype;

pro.receivePlayerMessage = function (chairId, msg){
	var type = msg.type || null;
	var data = msg.data || null;
	if (!type || !data){ return false; }

	if(type === gameProto.GAME_CARDS_SORT_REQUEST) {
		this.answerCardsSortRequest(chairId, data.cardArr);
	}
	else if(type === gameProto.GAME_CARDS_NOSORT_REQUEST) {
		this.answerCardsNosortRequest(chairId, data.isNosort);
	}

	return false;
};

pro.resetGame = function () {
    this.gameStatus = gameProto.gameStatus.NOT_START;
    this.mianbaiArr = [];
    this.sortCardChairArr = [];

    this.playingChairArr = [];

    this.cardsArr = null;
};

pro.startGame = function() {
	for (let key in this.gameFrame.userArr){
	    if (this.gameFrame.userArr.hasOwnProperty(key)){
            this.playingChairArr.push(this.gameFrame.userArr[key].chairId);
        }
    }
    this.playingChairArr.sort();

    for (let i = 0; i < this.playingChairArr.length; ++i){
        this.mianbaiArr.push(false);
	}

    this.cardsArr = this.getCardsByWinRate();

	this.gameStatus = gameProto.GAME_STATUS_GAMEING;
	var msg = gameProto.getGameCardsPushData(this.cardsArr, this.playingChairArr);
	this.gameFrame.sendData(msg);

    // 机器人下注
    this.robotOperation();
	//this.timeOutSortCards();
};

// 超时自动理牌 
/*
pro.timeOutSortCards = function() {
	this.sortCardSchedule = scheduler.scheduleJob({start: this.startGameTm+gameProto.SORT_CARDS_TM*1000}, function() {
		var i, cardArr;
		for(i = 0; i < this.gameFrame.chairCount; ++i) {
			if(this.sortCardChairArr.indexOf(i) === -1) {
				cardArr = gameLogic.autoSortCards(this.cardsArr[i]);
				this.answerCardsSortRequest(i, cardArr);
			}
		}
	}.bind(this));
};
*/


// 玩家理牌 
pro.answerCardsSortRequest = function(chairId, cardArr) {
	if (this.gameStatus !== gameProto.GAME_STATUS_GAMEING) return;
	if (this.playingChairArr.indexOf(chairId) < 0) return;
	if (this.sortCardChairArr.indexOf(chairId) >= 0 || typeof(cardArr) !== 'object') return;
    let baseCards = this.cardsArr[this.playingChairArr.indexOf(chairId)];
	let count = 0;
	for(let i = 0; i < cardArr.length; ++i) {
		if(baseCards.indexOf(cardArr[i]) !== -1) {
			++ count;
		}
	}

	let type = gameLogic.getCardsType(cardArr);
    if(count !== baseCards.length || !type) return;
    let msg = gameProto.getGameCardsSortPushData(0, chairId, cardArr);
    this.sortCardChairArr.push(chairId);
    this.cardsArr[this.playingChairArr.indexOf(chairId)] = cardArr;
    this.gameFrame.sendData(msg);

	// 理牌结束,开始结算 
	if(this.sortCardChairArr.length === this.playingChairArr.length) {
		this.gameStatus = gameProto.GAME_STATUS_SETTLE;
		let result = gameLogic.getResout(this.cardsArr, this.mianbaiArr, this.gameRule, this.gameFrame.gameTypeInfo.baseScore);
        let msg  = gameProto.getGameResoutPushData(result, this.gameStatus);
		this.gameFrame.sendData(msg);

		this.resout = result;
        this.endGame(result);
	}
};

pro.answerCardsNosortRequest = function(chairId, isNosort) {
	if(this.gameStatus !== gameProto.GAME_STATUS_GAMEING) return;
	let index = this.playingChairArr.indexOf(chairId);
	if (index === -1) return;
	this.mianbaiArr[index] = !!isNosort;
	if(!!isNosort) {
		this.cardsArr[index] = gameLogic.sortSpecialCard(this.cardsArr[index]);
		this.answerCardsSortRequest(chairId, this.cardsArr[index]);
	}
	this.gameFrame.sendData(gameProto.getGameNosortPushData(chairId, isNosort));
};

pro.endGame = function(result) {
    let scoreArr = gameLogic.getScoreArrByResout(result);
    let dataArr = [];
    for(let i = 0; i < scoreArr.length; ++i){
        let uid = this.gameFrame.getUserByChairId(this.playingChairArr[i]).userInfo.uid;
        dataArr.push({
            uid: uid,
            score: scoreArr[i]
        })
    }
    this.gameFrame.writeUserGameResult(dataArr);

    setTimeout(function () {
    	if (!this.gameFrame) return;
        this.gameFrame.concludeGame([]);
        this.resetGame();
    }.bind(this), this.playingChairArr.length * 3 * 1000);

    this.gameSettleFinishedTm = Date.now() + this.playingChairArr.length * 3 * 1000;
};

pro.getRecordData = function() {
	this.recordData.createTime = Date.now();
	if(this.recordData.dateArr.length > 0) {
		return gameLogic.changeToMongoData(this.recordData);
	} else {
		return null;
	}
};

/* 玩家进入游戏时数据 */
pro.getEnterGameData = function() {
	return {
		gameRule: this.gameFrame.gameRule,
	    roomID: this.gameFrame.roomId,
		gameStatus: this.gameStatus,
		sortCardChairArr: this.sortCardChairArr,
		cardsArr: this.cardsArr,
        mianbaiArr: this.mianbaiArr,
        playingChairArr: this.playingChairArr,
        resout: this.resout,
        leftGameEndTime: this.gameSettleFinishedTm - Date.now(),
		gameTypeInfo: this.gameFrame.gameTypeInfo
	};
};

pro.getCardsByWinRate = function() {
	let isCheat = false;
    if(Math.random() <= this.gameFrame.getCurRobotWinRate()) {
        isCheat = true;
    }
    let cardsArr = gameLogic.getCardsArr(this.playingChairArr.length);
	if(! isCheat) { return cardsArr; }

    let sortCardsArr = [];
	let guaiPai = [false, false, false, false];
	for(let i = 0; i < cardsArr.length; ++i) {
		if(gameLogic.hasGuaipai(cardsArr[i])) {
            guaiPai[i] = true;
            sortCardsArr.push(gameLogic.sortSpecialCard(cardsArr[i]));
		}else{
            sortCardsArr.push(gameLogic.autoSortCards(cardsArr[i]));
        }
	}

	let resout = gameLogic.getResout(sortCardsArr, guaiPai, this.gameRule, this.gameFrame.gameTypeInfo.baseScore);
    let finalScoreArr = gameLogic.getScoreArrByResout(resout);
	for(let i = 0; i < this.playingChairArr.length; ++i) {
	    let user = this.gameFrame.getUserByChairId(this.playingChairArr[i]);
	    if (!user.userInfo.robot){
	        let minIndex = 0;
	        for (let j = 1; j < finalScoreArr.length; ++j){
	            if (finalScoreArr[j] < finalScoreArr[minIndex]) minIndex = j;
            }
            finalScoreArr[minIndex] = 10000000;
	        let tem = cardsArr[i];
            cardsArr[i] = cardsArr[minIndex];
            cardsArr[minIndex] = tem;
        }
	}
	return cardsArr;
};

pro.robotSortCard = function (user) {
    setTimeout(function () {
        let index = this.playingChairArr.indexOf(user.chairId);
        if (index < 0) return;
        if (gameLogic.hasGuaipai(this.cardsArr[index])){
            this.answerCardsNosortRequest(user.chairId, true);
        }else{
            let cardArr = gameLogic.autoSortCards(this.cardsArr[index]);
            this.answerCardsSortRequest(user.chairId, cardArr);
        }
    }.bind(this), utils.getRandomNum(5, 10) * 1000);
};

pro.robotOperation = function () {
    for (let i = 0; i < this.playingChairArr.length; ++i){
        let user = this.gameFrame.getUserByChairId(this.playingChairArr[i]);
        if (!user || !user.userInfo.robot) continue;
        this.robotSortCard(user);
    }
};

/**************************************************************************************
 * room message
 */
pro.onEventGamePrepare = function(cb) {
	if(!!cb) cb();
};

pro.onEventGameStart = function(cb) {
	setTimeout(function() {
		if(this.gameFrame) {
			this.startGame();
		}
	}.bind(this), 500);
	if(!! cb) cb();
};

pro.onEventUserEntry = function(entryUserChairId, cb) {
	if(!! cb) cb();
};

pro.onEventUserLeave = function(leaveUserChairId, cb) {
	if(!! cb) cb();
};

pro.isUserEnableLeave = function() {
    return (this.gameStatus !== gameProto.GAME_STATUS_GAMEING);
};

pro.onEventUserOffLine = function(offLineUserChairId, cb) {
    if (this.gameStatus === gameProto.GAME_STATUS_GAMEING){
        do{
            // 检查是否已经摆牌
            if (this.sortCardChairArr.indexOf(offLineUserChairId) !== -1) break;
            // 自动摆牌
            let index = this.playingChairArr.indexOf(offLineUserChairId);
            if (index < 0) break;
            let cardArr = gameLogic.autoSortCards(this.cardsArr[index]);
            this.answerCardsSortRequest(offLineUserChairId, cardArr);
        } while (false)
    }
    utils.invokeCallback(cb);
};

pro.onEventRoomDismiss = function(reason, cb) {
    this.gameFrame = null;
	this.gameRule = null;
	if(this.sortCardSchedule) {
		scheduler.cancelJob(this.sortCardSchedule);
		this.sortCardSchedule = null;
	}
    if(!! cb) cb();
};

pro.onEventUserReconnection = function(onLineUserChairId, cb) {
	if(!! cb) cb();
};
