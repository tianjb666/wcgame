/**
 * Created by cly on 17/6/28
 */
var gameProto = require('./gameProto');
var roomProto = require('../../API/Protos/RoomProto');
var gameLogic = require('./gameLogic');
var scheduler = require('pomelo-scheduler');
var logger = require('pomelo-logger').getLogger('game');

var gameFrameSink = function(gameFrame) {
    this.gameFrame = gameFrame;
	this.gameRule = this.cloneObj(gameFrame.gameRule);
	this.gameStatus = gameProto.GAME_STATUS_PREPARE;
	this.robBankArr = [];		// 抢庄玩家chairId
	this.pourScoreArr = [];		// 玩家押注信息
	this.showCardArr = [];		// 已亮牌的玩家
	var i;
	for(i = 0; i < 6; ++i) {
		this.pourScoreArr[i] = 0;
		this.showCardArr[i] = 0;
	}
	this.bankChairId = null;
	this.gameStartChairIdArr = [];
	this.profitPercentage = this.gameFrame.publicParameter.profitPercentage;
};

module.exports = function(gameFrame) {
    return new gameFrameSink(gameFrame);
};

var pro = gameFrameSink.prototype;

pro.receivePlayerMessage = function (chairId, msg){
    var type = msg.type || null;
    var data = msg.data || null;
    if (!type || !data){ return false; }

	if(type === gameProto.ROB_RATE_BANK_NOTIFY) {
		this.answerRobRateBank(chairId, data.rate);
	}
	else if(type === gameProto.POUR_SCORE_NOTIFY) {
		this.answerPourScore(chairId, data.score);
	}
	else if(type === gameProto.SHOW_CARD_NOTIFY) {
		this.answerShowCard(chairId);
	}

    return false;
};

pro.prepareGame = function() {		// 游戏准备阶段(玩家可以准备)
	this.gameStatus = gameProto.GAME_STATUS_PREPARE;
	var msg = gameProto.getGameStatusPushData(this.gameStatus);
	this.gameFrame.sendData(msg);
	var self = this;
	setTimeout(function() { // n秒后未准备自动准备
		self.autoReady(); 
	}, gameProto.AUTO_READY_TM*1000);
};

// 玩家自动准备
pro.autoReady = function() {
	var user, key;
	if(this.gameFrame) {
		for(key in this.gameFrame.userArr) {
			if(this.gameFrame.userArr.hasOwnProperty(key)) {
				user = this.gameFrame.userArr[key];
				if((user.userStatus&roomProto.userStatusEnum.READY) === 0) {
					this.gameFrame.userReady(user.userInfo.uid);
				}
			}
		}
	}
};

pro.startGame = function() {
	this.gameRule.memberCount = this.getCurrentUserCount();
	this.recordGameStartChairId();
	var memberCount = this.gameRule.memberCount;
	this.cardsArr = this.getCardsByRate();
	this.robBankArr = [];
	this.pourScoreArr = [];
	this.showCardArr = [];
	var i;
	for(i = 0; i < memberCount; ++i) {
		this.robBankArr[i] = -1; 
		this.pourScoreArr[i] = 0;
		this.showCardArr[i] = 0;
	}
	this.bankChairId = null;
	this.gameStatus = gameProto.GAME_STATUS_ROBBANK;
	this.gameFrame.sendData(gameProto.getGameStatusPushData(this.gameStatus));
	this.robotAutoRobBank();
	this.playerAutoRobBank();
};

// 机器人抢庄
pro.robotAutoRobBank = function() {
	var self = this;
	var callFunc = function(chairId) {
		setTimeout(function() { 
			var rateArr = [0, 1, 2, 4];
			var random = rateArr[Math.floor(Math.random()*rateArr.length)];
			self.answerRobRateBank(chairId, random);
		}, Math.random()*2000+500);
	};
	var i, chairId, user, chairIndex;
	for(i = 0; i < this.gameStartChairIdArr.length; ++i) {
		chairId = this.gameStartChairIdArr[i];
		user = this.gameFrame.getUserByChairId(chairId);
		chairIndex = this.getChairIdIndex(chairId);
		if(user && user.userInfo.robot && self.gameStatus === gameProto.GAME_STATUS_ROBBANK && chairIndex >= 0) {
			callFunc(chairId);
		}
	}
};

/*
 * 玩家自动抢庄
 */
pro.playerAutoRobBank = function(){
	var self = this;
	this.scheduleRobBank = setTimeout(function() {
		var i, chairId, chairIndex;
		for(i = 0; i < self.gameStartChairIdArr.length; ++i) {
			chairId = self.gameStartChairIdArr[i];
			chairIndex = self.getChairIdIndex(chairId);
			if(chairIndex >= 0 &&self.robBankArr[i] === -1 && self.gameStatus === gameProto.GAME_STATUS_ROBBANK) {
				self.answerRobRateBank(chairId, 0);
			}
		}
		self.scheduleRobBank = null;
	}, gameProto.AUTO_ROBBANK_TM*1000);
};

// 机器人亮牌操作
pro.robotAutoShowCard = function() {
	var self = this;
	var callFunc = function(chairId) {
		setTimeout(function() {  
			if(self.showCardArr[self.getChairIdIndex(chairId)] !== 1 && self.gameStatus === gameProto.GAME_STATUS_SORTCARD) {
				self.answerShowCard(chairId);
			}
		}, Math.random()*4000+2000);
	};
	var i, chairId, user;
	for(i = 0; i < this.gameStartChairIdArr.length; ++i) {
		chairId = this.gameStartChairIdArr[i];
		user = this.gameFrame.getUserByChairId(chairId);
		if(user && user.userInfo.robot) {
			callFunc(chairId);
		}
	}
};

pro.playerAutoShowCard = function() {
	var self = this;
	this.scheduleShowCard = setTimeout(function() {
		var i, chairId, chairIndex, user;
		for(i = 0; i < self.gameStartChairIdArr.length; ++i) {
			chairId = self.gameStartChairIdArr[i];
			chairIndex = self.getChairIdIndex(chairId);
			user = self.gameFrame.getUserByChairId(chairId);
			if(user && !user.userInfo.robot && chairIndex >= 0) {
				if(self.showCardArr[self.getChairIdIndex(chairId)] !== 1 && self.gameStatus === gameProto.GAME_STATUS_SORTCARD) {
					self.answerShowCard(chairId);
				}
			}
		}
		self.scheduleShowCard = null;
	}, gameProto.AUTO_SHOWCARD_TM*1000);
};

/*
 * 玩家自动下注
 */
pro.autoPourGold = function() {
	var self = this;
	this.schedulePourGold = setTimeout(function() {
		var i, chairId, chairIndex, user;
		for(i = 0; i < self.gameStartChairIdArr.length; ++i) {
			chairId = self.gameStartChairIdArr[i];
			chairIndex = self.getChairIdIndex(chairId);
			user = self.gameFrame.getUserByChairId(chairId);
			if(self.pourScoreArr[i] === 0 && chairId !== self.bankChairId && self.gameStatus === gameProto.GAME_STATUS_POURSCORE) {
				if(!user.userInfo.robot && chairIndex >= 0) {
					self.answerPourScore(chairId, 5);
				}
			}
		}
		self.schedulePourGold = null;
	}, gameProto.AUTO_POURGOLD_TM*1000);
};

/*
 * 机器人自动下注
 */
pro.robotAutoPourGold = function() {
	var self = this;
	var callFunc = function(chairId) {
		setTimeout(function() {
			var pourArr = [5, 10, 15, 20];
			var random = pourArr[Math.floor(Math.random()*pourArr.length)];
			self.answerPourScore(chairId, random);
		}, Math.random()*(gameProto.AUTO_POURGOLD_TM-2)*1000+2000);
	};
	var i, chairId, chairIndex, user;
	for(i = 0; i < this.gameStartChairIdArr.length; ++i) {
		chairId = self.gameStartChairIdArr[i];
		chairIndex = self.getChairIdIndex(chairId);
		user = self.gameFrame.getUserByChairId(chairId);
		if(user && user.userInfo.robot && chairId !== self.bankChairId && self.gameStatus === gameProto.GAME_STATUS_POURSCORE) {
			if(chairIndex >= 0) {
				callFunc(chairId);
			}
		}
	}
};

pro.sendCanPourScore = function() {
	this.gameStatus = gameProto.GAME_STATUS_POURSCORE;
	this.gameFrame.sendData(gameProto.getGameStatusPushData(this.gameStatus));
	var i, msg;
	for(i = 0; i < this.gameStartChairIdArr.length; ++i) {
		if(this.bankChairId !== this.gameStartChairIdArr[i]) {
			msg = gameProto.getCanPourScorePushData(this.gameStatus, this.gameRule.otherRule.difenArr);
			this.gameFrame.sendData(msg, [this.gameStartChairIdArr[i]]);
		}
	}
	this.autoPourGold();
	this.robotAutoPourGold();
};

// 响应名牌抢庄
pro.answerRobRateBank = function(chairId, rate) {
	if(this.gameStatus !== gameProto.GAME_STATUS_ROBBANK) {
		logger.warn('error answerRobRateBank gameStatus');
		return;
	} 
	if(typeof rate !== 'number' || parseInt(rate, 10) < 0) {
		logger.warn('error answerRobRateBank rate');
		return;
	}
	var chairIndex = this.getChairIdIndex(chairId);
	if(chairIndex < 0) {
		logger.warn('error answerRobRateBank chairIndex');
		return;
	}
	this.robBankArr[chairIndex] = parseInt(rate, 10);
	this.gameFrame.sendData(gameProto.getRobRateBankPushData(chairId, rate));
	var robCount = 0;
	var i;
	for(i = 0; i < this.robBankArr.length; ++i) {
		if(this.robBankArr[i] !== -1) { ++ robCount; }
	}
	if(robCount === this.gameStartChairIdArr.length) {
		this.sendChangeBank();
	}
};

// 抢庄结束,判定庄家
pro.sendChangeBank = function() {
	if(this.scheduleRobBank) {
		clearTimeout(this.scheduleRobBank);
		this.scheduleRobBank = null;
	}
	this.gameStatus = gameProto.GAME_STATUS_POURSCORE;
	this.bankChairId = this.getRandomBankChairId();
	this.gameFrame.sendData(gameProto.getBankChangePushData(this.bankChairId, this.gameStatus, this.robBankArr));
	this.sendCanPourScore();
};

// 响应亮牌
pro.answerShowCard = function(chairId) {
	if(this.gameStatus !== gameProto.GAME_STATUS_SORTCARD) {	// 验证
		logger.warn('error answerShowCard gameStatus'); return;
	}
	var chairIndex = this.getChairIdIndex(chairId);
	this.showCardArr[chairIndex] = 1;
	this.gameFrame.sendData(gameProto.getShowCardPushData(chairId, this.cardsArr[chairIndex]));
	var showCardCount = 0;
	var i;
	for(i = 0; i < this.showCardArr.length; ++i) {
		if(this.showCardArr[i] === 1) { ++ showCardCount; }
	}
	if(showCardCount === this.showCardArr.length) {
		this.sendResout();
	}
};

// 响应押注
pro.answerPourScore = function(chairId, score) {
	if(this.gameStatus !== gameProto.GAME_STATUS_POURSCORE) {
		logger.warn('error answerPourScore gameStatus');
		return;
	}
	if(chairId === this.bankChairId) {
		logger.warn('error answerPourScore chairId');
		return;
	}
	if(typeof score !== 'number' || score <= 0) {	// 验证
		logger.warn('error answerPourScore score');
		return;
	}
	score = parseInt(score, 10);

	var chairIndex = this.getChairIdIndex(chairId);
	this.pourScoreArr[chairIndex] = score;
	var msg = gameProto.getPourScorePushData(chairId, score);
	this.gameFrame.sendData(msg);
	var pourCount = 0;
	var i;
	for(i = 0; i < this.gameStartChairIdArr.length; ++i) {
		if(this.pourScoreArr[i] !== 0) { ++ pourCount; }
	}
	if(pourCount === this.gameStartChairIdArr.length-1) {
		this.sendFiveCard();
		this.robotAutoShowCard();
		this.playerAutoShowCard();
	}
};

// 随机庄家
pro.getRandomBankChairId = function() {
	var qiangArr = [];
	var i, j;
	for(i = 4; i >= -1; --i) {
		for(j = 0; j < this.robBankArr.length; ++j) {
			if(this.robBankArr[j] === i) {
				qiangArr.push(this.gameStartChairIdArr[j]);
			}
		}
		if(qiangArr.length > 0) { break; }
	}
	var index = Math.floor(Math.random() * qiangArr.length);
	return qiangArr[index];
};

// 发送4张牌
pro.sendFourCard = function(cardsArr, memberCount) {
	var i, j, fourCards;
	for(i = 0; i < memberCount; ++i) {
		fourCards = [];
		for(j = 0; j < 4; ++j) {
			fourCards[j] = cardsArr[i][j];
		}
		this.gameFrame.sendData(gameProto.getFourCardPushData(fourCards), [this.gameStartChairIdArr[i]]);
	}
};

// 发送5张牌
pro.sendFiveCard = function() {
	if(this.schedulePourGold) {
		clearTimeout(this.schedulePourGold);
		this.scheduleRobBank = null;
	}
	this.gameStatus = gameProto.GAME_STATUS_SORTCARD;
	this.gameFrame.sendData(gameProto.getGameStatusPushData(this.gameStatus));
	var i, chairId, msg;
	for(i = 0; i < this.cardsArr.length; ++i) {
		chairId = this.gameStartChairIdArr[i];
		msg = gameProto.getResoutCardPushData(chairId, this.cardsArr[i], this.gameStatus);
		this.gameFrame.sendData(msg, [chairId]);
	}
};

// 发送游戏结果
pro.sendResout = function() {
	var bankIndex = this.getChairIdIndex(this.bankChairId);
	var robRate = this.robBankArr[bankIndex];
	if(robRate === 0) { robRate = 1; }
	var banker = this.gameFrame.getUserByChairId(this.bankChairId);
	this.resout = gameLogic.getResout(this.cardsArr, this.pourScoreArr, bankIndex, robRate, this.gameRule.baseScore, banker.userInfo.gold);
	var msg = gameProto.getGameResoutPushData(this.resout);
	this.gameFrame.sendData(msg);
	if(this.scheduleShowCard) {
		clearTimeout(this.scheduleShowCard);
		this.scheduleShowCard = null;
	}
	/*有玩家退出时,客户端显示结果不正常,需要等客户端放完动画再结束*/
	setTimeout(function() {		
		this.endGame();
	}.bind(this), 4500);
};

// 结束游戏
pro.endGame = function() {
	var data = [];
	var i, user;
	for(i = 0; i < this.gameStartChairIdArr.length; ++i) {
		user = this.gameFrame.getUserByChairId(this.gameStartChairIdArr[i]);
		data.push({
			uid: user.userInfo.uid,
			score: this.resout.finalScoreArr[i],
		});
	}
	this.gameFrame.concludeGame(data);
};

// 进入游戏时获取的数据
pro.getEnterGameData = function() {
	var data = {
		gameRule: this.gameRule,
		curBureau: this.gameFrame.curBureau+1,
		roomId: this.gameFrame.roomId,
		gameStatus: this.gameStatus,
		bankChairId: this.bankChairId,
		pourScoreArr: this.pourScoreArr,
		robBankArr: this.robBankArr,
		gameStartChairIdArr: this.gameStartChairIdArr,
		profitPercentage: this.gameFrame.publicParameter.profitPercentage,
		gameTypeInfo: this.gameFrame.gameTypeInfo
	};
	if(this.gameStatus === gameProto.GAME_STATUS_SORTCARD) {
		data.cardsArr = this.cardsArr;
		data.showCardArr = this.showCardArr;
	}
	else if(this.gameStatus === gameProto.GAME_STATUS_RESOUT) {
		data.cardsArr = this.cardsArr;
		data.resout = this.resout;
	}
	return data;
};

/**************************************************************************************
 * 房间消息处理
 */
// 游戏等待玩家准备状态
pro.onEventGamePrepare = function(cb) {
	if(!!cb) {
		cb();
	}
	this.prepareGame();
};

// 游戏开始
pro.onEventGameStart = function(cb) {
	this.startGame();
	if(!! cb) {
		cb();
	}
};

// 游戏解散
pro.onEventRoomDismiss = function() {
	this.gameFrame = null;
};

// 设置作弊胜率
pro.onSetGameWinRate = function(chairId, rate) {
	this.winRate = rate;
	this.winChairId = chairId;
};

pro.isUserEnableLeave = function(chairId) {
	return (this.getChairIdIndex(chairId) < 0);
};

pro.onEventUserOffLine = function(chairId) {
	/*null*/
};

pro.onEventUserEntry = function(chairId) {
	/*var user = this.gameFrame.getUserByChairId(chairId);
	if(this.gameStatus === gameProto.GAME_STATUS_PREPARE) {
		this.gameFrame.userReady(user.userInfo.uid);
	}*/
};

//****************************************************************************************

pro.getCurrentUserCount = function() {
	var userCount = 0;
	var key;
	for(key in this.gameFrame.userArr) {
		if(this.gameFrame.userArr.hasOwnProperty(key)) {
			++ userCount;
		}
	}
	return userCount;
};

// 游戏开始时的玩家id
pro.recordGameStartChairId = function() {
	this.gameStartChairIdArr = [];
	var i, user;
	for(i = 0; i < 6; ++i) {
		user = this.gameFrame.getUserByChairId(i);
		if(user) {
			this.gameStartChairIdArr.push(i);
		}
	}
};

pro.cloneObj = function(data) {
	var cloneData = {}, key;
	for(key in data) {
		if(data.hasOwnProperty(key)) {
			if(typeof(data[key]) === 'object') {
				cloneData[key] = this.cloneObj(data[key]);
			} else {
				cloneData[key] = data[key];
			}
		}
	}
	return cloneData;
};

// 玩家在gameStartChairIdArr中index
pro.getChairIdIndex = function(chairId) {
	return this.gameStartChairIdArr.indexOf(chairId);
};

pro.hasRobot = function() {
	var i, chairId, user;
	for(i = 0; i < this.gameStartChairIdArr.length; ++i) {
		chairId = this.gameStartChairIdArr[i];
		user = this.gameFrame.getUserByChairId(chairId);
		if(user && user.robot) {
			return true;
		}
	}
	return false;
};

// 根据概率获取牌
pro.getCardsByRate = function() {
	var winRate = this.gameFrame.robotWinRate;
	var memberCount = this.gameRule.memberCount;
	var cardsArr = gameLogic.getCardsArr(memberCount);
	var i, j, user, user2, tmp;
	for(i = 0; i < this.gameStartChairIdArr.length; ++i) {
		user = this.gameFrame.getUserByChairId(this.gameStartChairIdArr[i]);
		if(user && user.userInfo.robot && (Math.random() <= winRate)) {	/*机器人胜*/ 
			for(j = 0; j < this.gameStartChairIdArr.length; ++j) {
				user2 = this.gameFrame.getUserByChairId(this.gameStartChairIdArr[j]);
				if(user2 && !user2.userInfo.robot) {
					if(!gameLogic.isCardArrBigger(cardsArr[i], cardsArr[j])) {	/*机器人牌与玩家牌互换*/
						tmp = cardsArr[i];
						cardsArr[i] = cardsArr[j];
						cardsArr[j] = tmp;
					}
				}
			}
		}
	}
	return cardsArr;
};
