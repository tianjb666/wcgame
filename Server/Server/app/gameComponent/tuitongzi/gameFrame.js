var roomProto = require('../../API/Protos/RoomProto');
var gameLogic = require('./gameLogic');
var gameProto = require('./gameProto');
var scheduler = require('pomelo-scheduler');
var logger = require('pomelo-logger').getLogger('game');


var gameFrameSink = function(gameFrame) {
	this.gameFrame		= gameFrame;
	this.gameStatus		= gameProto.GAME_STATUS_WAITING;
	this.maxBureau		= 5;
	this.bureau			= 0;		// 进行的局数(每5局洗牌)
	this.bankerPool		= { '3000': [], '2000': [], '1000': [] };		// 请求成为庄家记录池
	this.cards			= gameLogic.getCards();
	this.bankerUid		= null;		// 庄家uid
	this.pourPool		= { '0': {}, '1': [], '2': [], '3': [] };		// 下注记录
	this.bankGold		= 10000000;		// 上庄金币
	this.dirRecord		= [];		// 走势记录
	this.resout			= null;
	this.schedulerControl('start');
};

module.exports = function(gameFrame) {
	return new gameFrameSink(gameFrame);
};

var pro = gameFrameSink.prototype;

pro.receivePlayerMessage = function (chairId, msg){
	var type = msg.type || null;
	var data = msg.data || null;
	if (!type || !data){ return false; }

	if(type === gameProto.GAME_ASKTOBEBANKER_REQUEST) {				// 请求上庄
		this.answerAskToBeBank(chairId, data.bankGold);
	}
	else if(type === gameProto.GAME_ASKTOBEPLAYER_REQUEST) {		// 请求下庄
		this.answerAskToBePlayer(chairId);
	}
	else if(type === gameProto.GAME_POURGOLD_REQUEST) {				// 请求下注
		this.answerGamePourGold(chairId, data.pourGold, data.direction);
	}
	else if(type === gameProto.GAME_CONTINUEBANKER_REQUEST) {		// 继续坐庄请求
		this.answerContinueBanker(chairId, data.bankGold);
	}
	return false;
};

// 开始游戏
pro.startGame = function() {
	++ this.bureau;
	if(this.bureau > this.maxBureau) { 
		this.bureau = 1; 
		this.cards = gameLogic.getCards();
	}
	this.pourPool[gameProto.TIANMEN] = [];
	this.pourPool[gameProto.ZHONGMEN] = [];
	this.pourPool[gameProto.DIMEN] = [];
	this.gameFrame.sendData(gameProto.gameBureauPushData(this.bureau));
	//setTimeout(function() {
	//	this.robotAskToBeBanker();
	//}.bind(this), 1000);
	this.nobankerStart();
};

pro.nobankerStart = function() {
	this.pourPool[gameProto.ZHUANGJIA].pourGold = this.bankGold;
	this.pourPool[gameProto.ZHUANGJIA].curGold	= this.bankGold;
	this.gameFrame.sendData(gameProto.changeBankerPushData(this.bankerUid, this.bankGold));
};

// 响应上庄请求
pro.answerAskToBeBank = function(chairId, bankGold) {
	var user = this.gameFrame.getUserByChairId(chairId);
	if(bankGold !== 1000 && bankGold !== 2000 && bankGold !== 3000) {
		logger.debug('error answerGameAskToBeBank bankGold error');
		return;
	}
	if(bankGold > user.userInfo.gold) {
		logger.debug('error answerGameAskToBeBank not enough gold error');
		return;
	}
	if(this.bankerPool[bankGold].indexOf(user.userInfo.uid) >= 0) {
		logger.debug('error answerGameAskToBeBank already asked error');
		return;
	}
	this.bankerPool[bankGold].push(user.userInfo.uid);
	this.gameFrame.sendData(gameProto.askToBeBankerPushData(user.userInfo.uid, bankGold));
	if(this.gameStatus === gameProto.GAME_STATUS_WAITING && !this.bankerUid) {
		this.changeBanker();
	}
};

// 请求继续坐庄
pro.answerContinueBanker = function(chairId, bankGold) {
	if((bankGold !== 1000 && bankGold !== 2000 && bankGold !== 3000) || bankGold <= this.bankGold) {
		logger.debug('error answerContinueBanker bankGold error');
		return;
	}
	var bankerChairId = this.gameFrame.getChairIdByUid(this.bankerUid);
	if(chairId !== bankerChairId) {
		logger.debug('error answerContinueBanker chairId error');
		return;
	}
	var banker = this.gameFrame.userArr[this.bankerUid];
	if(banker.userInfo.gold < bankGold) {
		logger.debug('error answerContinueBanker bankGold error');
		return;
	}
	this.pourPool[gameProto.ZHUANGJIA].pourGold += bankGold;
	this.pourPool[gameProto.ZHUANGJIA].curGold += bankGold;
	this.gameFrame.sendData(gameProto.continueBankerPushData(banker.userInfo.uid, bankGold));
};

// 请求下庄
pro.answerAskToBePlayer = function(chairId) {
	if(this.gameStatus !== gameProto.GAME_STATUS_SETTLE) {
		logger.debug('error answerAskToBePlayer gameStatus error');
		return;
	}
	var user = this.gameFrame.getUserByChairId(chairId);
	if(!user || user.userInfo.uid !== this.bankerUid) {
		logger.debug('error answerAskToBePlayer chairId error');
		return;
	}
	var goldChange = this.pourPool[gameProto.ZHUANGJIA].curGold-this.pourPool[gameProto.ZHUANGJIA].pourGold;
	this.gameFrame.sendData(gameProto.askToBePlayerPushData(user.userInfo.uid, goldChange));
	this.bankerUid = null;
	this.changeBanker();
};

// 上庄
pro.changeBanker = function() {
	var bankerGoldArr = [3000, 2000, 1000];
	var i, bankerList, hasChange, j, user;
	for(i = 0; i < bankerGoldArr.length; ++i) {
		bankerList = this.bankerPool[bankerGoldArr[i]];
		hasChange = false;
		for(j = 0; j < bankerList.length; ++j) {
			user = this.gameFrame.userArr[bankerList[j]];
			if(user && user.userInfo.gold >= bankerGoldArr[i]) {
				this.bankGold = bankerGoldArr[i];
				this.bankerUid = bankerList[j];
				bankerList.splice(j, 1);
				hasChange = true;
				break;
			}
		}
		if(hasChange) { break; }
	}
	if(this.bankerUid) {
		this.pourPool[gameProto.ZHUANGJIA].pourGold = this.bankGold;
		this.pourPool[gameProto.ZHUANGJIA].curGold	= this.bankGold;
		this.gameFrame.sendData(gameProto.changeBankerPushData(this.bankerUid, this.bankGold));
		this.bureau = 1;
		this.cards = gameLogic.getCards();
		this.schedulerControl('start');
	} else {
		this.gameStatus = gameProto.GAME_STATUS_WAITING;
		this.gameFrame.sendData(gameProto.gameStatusChangePushData(this.gameStatus));
		this.schedulerControl('end');
	}
};

// 下注请求
pro.answerGamePourGold = function(chairId, pourGold, direction) {
	if(this.gameStatus !== gameProto.GAME_STATUS_POUR) {
		logger.debug('error answerGamePourGold gameStatus error');
		return;
	}
	if(direction !== gameProto.TIANMEN && direction !== gameProto.ZHONGMEN && direction !== gameProto.DIMEN) {
		logger.debug('error answerGamePourGold direction error');
		return;
	}
	var user = this.gameFrame.getUserByChairId(chairId);
	var uid = user.userInfo.uid;
	var alreadyPourGold = 0, allPourGold = 0;
	var i, key;
	for(key in this.pourPool) {
		if(this.pourPool.hasOwnProperty(key)) {
			for(i = 0; i < this.pourPool[key].length; ++i) {
				if(this.pourPool[key][i].uid === uid) {
					alreadyPourGold += this.pourPool[key][i].pourGold; 
				}
				allPourGold += this.pourPool[key][i].pourGold; 
			}
		}
	}
	if(pourGold + alreadyPourGold > user.userInfo.gold) {
		logger.debug('error answerGamePourGold pourGold error');
		return;
	}
	if(pourGold+allPourGold > this.pourPool['0'].curGold) {
		logger.debug('error answerGamePourGold pourGold beyond error');
		return;
	}
	var hasPour = false;
	for(i = 0; i < this.pourPool[direction].length; ++i) {
		if(this.pourPool[direction][i].uid === uid) {
			hasPour = true;
			this.pourPool[direction][i].pourGold += pourGold; 
			break;
		}
	}
	if(! hasPour) {
		this.pourPool[direction].push({
			uid: uid,
			pourGold: pourGold
		});
	}
	allPourGold += pourGold;
	this.gameFrame.sendData(gameProto.pourGoldPushData(uid, pourGold, direction, allPourGold));
};

// 推送游戏结果
pro.sendGameResout = function() {
	var cardsArr = gameLogic.getCardsArrByBureau(this.cards, this.bureau);
	this.getCardsByWinRate(cardsArr);	// 调整胜率
	var i;
	if(this.dirRecord.length > 9) {
		for(i = this.dirRecord.length-9; i > 0; --i) {
			this.dirRecord.shift();
		}
	}
	this.dirRecord.push(cardsArr);
	var resout = gameLogic.getResout(cardsArr, this.pourPool);
	this.gameFrame.sendData(gameProto.gameResoutPushData(resout));
	this.resout = resout;
	if(resout.bankerWin > 0) {
		var profitPercentage = (1-this.gameFrame.publicParameter.profitPercentage/100);
		this.pourPool[gameProto.ZHUANGJIA].curGold += resout.bankerWin*profitPercentage;
	} else {
		this.pourPool[gameProto.ZHUANGJIA].curGold += resout.bankerWin;
	}
};

// 随机上庄
pro.robotAskToBeBanker = function() {
	var bankArr = this.bankerPool['3000'];
	var userCount = 0, robotCount = 0;
	var user, i;
	for(i = 0; i < bankArr.length; ++i) {
		user = this.gameFrame.userArr[bankArr[i]];
		if(user) {
			if(! user.userInfo.robot) {
				++ userCount;
			} else {
				++ robotCount;
			}
		}
	}
	var bankerCount = Math.floor(Math.random()*3+4);
	var addCount = bankerCount-userCount-robotCount;
	var key;
	for(key in this.gameFrame.userArr) {
		if(this.gameFrame.userArr.hasOwnProperty(key)) {
			user = this.gameFrame.userArr[key];
			if(user.userInfo.robot && key !== this.bankerUid && user.userInfo.gold >= 3000) {
				if(this.bankerPool['3000'].indexOf(user.userInfo.uid) < 0) {
					this.answerAskToBeBank(user.chairId, 3000);
					-- addCount;
					if(addCount === 0) { break; }
				}
			}
		}
	}
};

// 随机下注
pro.robotAutoPourGold = function() {
	var self = this;
	var callFunc = function(user){
		setTimeout(function() {
			var dirArr = [gameProto.TIANMEN, gameProto.ZHONGMEN, gameProto.DIMEN];
			var canPourGold = self.getCanPourGold();
			if(canPourGold > user.userInfo.gold) { canPourGold = user.userInfo.gold; }
			var pourGold = Math.floor(canPourGold*Math.random()/10)*10;
			var dir = dirArr[Math.floor(Math.random()*dirArr.length)];
			if(pourGold > 0) { self.answerGamePourGold(user.chairId, pourGold, dir); }
		}, 500+Math.random()*4000);
	};
	var key, user;
	for(key in this.gameFrame.userArr) {
		if(this.gameFrame.userArr.hasOwnProperty(key)) {
			user = this.gameFrame.userArr[key];
			if(user.userInfo.robot && user.userInfo.uid !== this.bankerUid) { callFunc(user); }
		}
	}
};

// 自动下庄
pro.robotAutoAbandonBanker = function() {
	if(this.bureau < 3) { return; }
	var bankerChairId = this.gameFrame.getChairIdByUid(this.bankerUid);
	var user = this.gameFrame.userArr[this.bankerUid];
	if(user && user.userInfo.robot) {
		setTimeout(function() {
			this.answerAskToBePlayer(bankerChairId);
		}.bind(this), Math.random()*3000+1000);
	}
};

// 获取能押注信息
pro.getCanPourGold = function() {
	var pourGold = 0, key, i;
	for(key in this.pourPool) {
		if(this.pourPool.hasOwnProperty(key) && parseInt(key, 10) !== gameProto.ZHUANGJIA) {
			for(i = 0; i < this.pourPool[key].length; ++i) {
				pourGold += this.pourPool[key][i].pourGold;
			}
		}
	}
	return this.pourPool[gameProto.ZHUANGJIA].curGold-pourGold;
};

// 流程控制
pro.schedulerControl = function(op) {
	var self = this;
	if(op === 'start') {
		this.isStopSchedule = false;
		this.gameStatus = gameProto.GAME_STATUS_WAITING;
		this.tick = 1;
		if(this.schedulerId) { return; }
		this.schedulerId = scheduler.scheduleJob({period: 1000}, function() {
			//if(self.isStopSchedule) { return; }
			self.tick -= 1;
			if(self.gameStatus === gameProto.GAME_STATUS_WAITING && self.tick === 0) {		//未开始
				self.gameStatus = gameProto.GAME_STATUS_SORTCARD;
				self.gameFrame.sendData(gameProto.gameStatusChangePushData(self.gameStatus));
				self.tick = gameProto.SORTCARD_SECOND;
			}
			else if(self.gameStatus === gameProto.GAME_STATUS_SORTCARD && self.tick === 0) {	// 摆牌结束
				self.gameStatus = gameProto.GAME_STATUS_POUR;
				self.gameFrame.sendData(gameProto.gameStatusChangePushData(self.gameStatus));
				self.tick = gameProto.POURGOLD_SECOND;
				self.robotAutoPourGold();
			}
			else if(self.gameStatus === gameProto.GAME_STATUS_START && self.tick === 0) {		// 开始游戏中结束
				self.gameStatus = gameProto.GAME_STATUS_POUR;
				self.gameFrame.sendData(gameProto.gameStatusChangePushData(self.gameStatus));
				self.tick = gameProto.POURGOLD_SECOND;
				self.robotAutoPourGold();
			}
			else if(self.gameStatus === gameProto.GAME_STATUS_POUR && self.tick === 0) {		// 下注结束
				self.touzi1 = Math.floor(Math.random() * 7);
				self.touzi2 = Math.floor(Math.random() * 7);
				self.gameFrame.sendData(gameProto.touziPushData(self.touzi1, self.touzi2));

				self.tick = gameProto.SHOWRESOUT_SECOND;
				self.sendGameResout();
				self.gameStatus = gameProto.GAME_STATUS_RESOUT;
				self.gameFrame.sendData(gameProto.gameStatusChangePushData(self.gameStatus));
			}
			else if(self.gameStatus === gameProto.GAME_STATUS_RESOUT && self.tick === 0) {		// 显示结果结束
				self.gameStatus = gameProto.GAME_STATUS_SETTLE;
				self.gameFrame.sendData(gameProto.gameStatusChangePushData(self.gameStatus));
				self.tick = gameProto.SETTLE_SECOND;
				//self.robotAutoAbandonBanker();
				self.endGame();
			}
			else if(self.gameStatus === gameProto.GAME_STATUS_SETTLE && self.tick === 0) {		// 结算结束
				//self.tick = gameProto.GAMESTART_SECOND;
				//if(! self.bankerUid) {	// 无人上庄
				//	self.gameStatus = gameProto.GAME_STATUS_WAITING;
				//	self.schedulerControl('end');
				//} else {
				//	if(self.pourPool[gameProto.ZHUANGJIA].curGold < 1000) {
				//		var bankerChairId = self.gameFrame.getChairIdByUid(self.bankerUid);
				//		self.schedulerControl('end');
				//		self.answerAskToBePlayer(bankerChairId);
				//		//self.changeBanker();
				//	} else {
						if(self.bureau === 1) {
							self.gameStatus = gameProto.GAME_STATUS_SORTCARD;
						} else {
							self.gameStatus = gameProto.GAME_STATUS_START;
						}
						self.tick = gameProto.GAMESTART_SECOND;
						self.gameFrame.sendData(gameProto.gameStatusChangePushData(self.gameStatus));
				//	}
				//}
			}
		});
	} else if(op === 'end') {
		if(this.schedulerId) {
			this.isStopSchedule = true;
			//scheduler.cancelJob(this.schedulerId);
			//this.schedulerId = null;
		}
	}
};

pro.endGame = function() {
	// 记录数据
	var scoreChangeArr = [];
	var pourObj = {};
	var key, i, uid, player;
	for(key in this.pourPool) {
		if(this.pourPool.hasOwnProperty(key)) {
			for(i = 0; i < this.pourPool[key].length; ++i) {
				uid = this.pourPool[key][i].uid;
				if(pourObj[uid]) {
					pourObj[uid] += this.pourPool[key][i].pourGold; 
				} else {
					pourObj[uid] = this.pourPool[key][i].pourGold; 
				}
			}
		}
	}
	for(key in this.resout.usersWin) {
		if(this.resout.usersWin.hasOwnProperty(key)) {
			player = this.gameFrame.userArr[key];
			if(player) {
				scoreChangeArr.push({
					uid: key,
					score: this.resout.usersWin[key],
					betCount: pourObj[key],
				});
			}
		}
	}
	this.gameFrame.concludeGame(scoreChangeArr);
};

/* 玩家进入游戏时数据 */
pro.getEnterGameData = function() {
	return {
		bankerUid: this.bankerUid,
		bureau: this.bureau,
		maxBureau: this.maxBureau,
		gameStatus: this.gameStatus,
		pourPool: this.pourPool,
		bankerPool: this.bankerPool,
		touzi1: this.touzi1,
		touzi2: this.touzi2,
		bankGold: this.bankGold,
		dirRecord: this.dirRecord,
		resout: this.resout,
		profitPercentage: this.gameFrame.publicParameter.profitPercentage,
		roomId: this.gameFrame.roomId,
	};
};

/**************************************************************************************
 * room message
 */
pro.onEventGamePrepare = function(cb) {
	if(!!cb) {
		cb();
	}
};

pro.onEventGameStart = function(cb) {
	this.startGame();
	if(!! cb) {
		cb();
	}
};

pro.onEventUserEntry = function(entryUserChairId, cb) {
	var user = this.gameFrame.getUserByChairId(entryUserChairId);
	user.userStatus = roomProto.userStatusEnum.PLAYING;
	if(!! cb) {
		cb();
	}
};

pro.onEventUserLeave = function(leaveUserChairId, cb) {
	var user = this.gameFrame.getUserByChairId(leaveUserChairId);
	var key, index;
	for(key in this.bankerPool) {
		if(this.bankerPool.hasOwnProperty(key)) {
			index = this.bankerPool[key].indexOf(user.userInfo.uid);
			if(index >= 0) {
				this.bankerPool.splice(index, 1);
			}
		}
	}
	if(!! cb) {
		cb();
	}
};

pro.isUserEnableLeave = function(userChairId) {
	var user = this.gameFrame.getUserByChairId(userChairId);
	if(user.userInfo.robot && user.userInfo.gold > 1000) { return false; }
	var uid = user.userInfo.uid;
	if(uid === this.bankerUid) {
		return false;
	}
	var key, i;
	for(key in this.pourPool) {
		if(this.pourPool.hasOwnProperty(key) && key !== '0') {
			for(i = 0; i < this.pourPool[key].length; ++i) {
				if(this.pourPool[key][i].uid === user.userInfo.uid) {
					return false;
				}
			}
		}
	}
	return true;
};

pro.onEventUserOffLine = function(offLineUserChairId, cb) {
	var user = this.gameFrame.getUserByChairId(offLineUserChairId);
	var key, index;
	for(key in this.bankerPool) {
		if(this.bankerPool.hasOwnProperty(key)) {
			index = this.bankerPool[key].indexOf(user.userInfo.uid);
			if(index >= 0) { this.bankerPool[key].splice(index, 1); }
		}
	}
	if(!! cb) { cb(); }
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
	var i, user;
	for(i = 0; i < pourArr.length; ++i) {
		user = this.gameFrame.userArr[pourArr[i].uid];
		if(user && user.userInfo.robot) {
			pourGold += pourArr[i].pourGold;
		}
	}
	return pourGold;
};

pro.getPlayerPourGoldOnDir = function(dir) {
	var pourArr = this.pourPool[dir];
	var pourGold = 0;
	var i, user;
	for(i = 0; i < pourArr.length; ++i) {
		user = this.gameFrame.userArr[pourArr[i].uid];
		if(user && !user.userInfo.robot) {
			pourGold += pourArr[i].pourGold;
		}
	}
	return pourGold;
};

// 根据机器人胜率调整牌
pro.getCardsByWinRate = function(cardsArr) {
	var winRate = this.gameFrame.robotWinRate;
	var banker = this.gameFrame.userArr[this.bankerUid];
	var tmp, pourGoldArr, i, choose, choose1, choose2;
	if(!banker || (banker && banker.userInfo.robot)) {	// 机器人坐庄
		if(Math.random() <= winRate) {
			pourGoldArr = [gameProto.TIANMEN, gameProto.ZHONGMEN, gameProto.DIMEN];
			var random1, random2;
			for(i = 0; i < 15; ++i) {	// 乱序
				random1 = Math.floor(Math.random()*3);
				random2 = Math.floor(Math.random()*3);
				tmp = pourGoldArr[random1];
				pourGoldArr[random1] = pourGoldArr[random2];
				pourGoldArr[random2] = tmp;
			}
			var pourGold0 = this.getPlayerPourGoldOnDir(pourGoldArr[0]);
			var pourGold1 = this.getPlayerPourGoldOnDir(pourGoldArr[1]);
			var pourGold2 = this.getPlayerPourGoldOnDir(pourGoldArr[2]);

			choose = null; 
			choose1 = null;
			if(pourGold0 > pourGold1+pourGold2) {
				choose = pourGoldArr[0];
			} 
			else if(pourGold1 > pourGold0+pourGold2) {
				choose = pourGoldArr[1];
			} 
			else if(pourGold2 > pourGold0+pourGold1) {
				choose = pourGoldArr[2];
			} 
			if(! choose) {
				choose = pourGoldArr[0];
				choose1 = pourGoldArr[1];
			}
			if(choose && gameLogic.compareCards(cardsArr[0], cardsArr[choose]) < 0) {
					tmp = cardsArr[0];
					cardsArr[0] = cardsArr[choose];
					cardsArr[choose] = tmp;
			}
			if(choose1 && gameLogic.compareCards(cardsArr[0], cardsArr[choose1]) < 0) {
					tmp = cardsArr[0];
					cardsArr[0] = cardsArr[choose1];
					cardsArr[choose1] = tmp;
			}
		}
	} else {	// 玩家坐庄
		if(Math.random() <= winRate) {
			pourGoldArr = [gameProto.ZHUANGJIA, gameProto.TIANMEN, gameProto.ZHONGMEN, gameProto.DIMEN];
			for(i = 1; i < pourGoldArr.length; ++i) {
				pourGoldArr[i] = this.getRobotPourGoldOnDir(pourGoldArr[i]);
			}
			choose1 = null; choose2 = null;
			if(pourGoldArr[1]+pourGoldArr[2] > pourGoldArr[3]) {
				choose1 = 1; choose2= 2;
			}
			else if(pourGoldArr[2]+pourGoldArr[3] > pourGoldArr[1]) {
				choose1 = 2; choose2= 3;
			}
			else if(pourGoldArr[1]+pourGoldArr[3] > pourGoldArr[2]) {
				choose1 = 1; choose2= 3;
			}
			if(choose1 && gameLogic.compareCards(cardsArr[0], cardsArr[choose1]) > 0) {
					tmp = cardsArr[0];
					cardsArr[0] = cardsArr[choose1];
					cardsArr[choose1] = tmp;
			}
			if(choose2 && gameLogic.compareCards(cardsArr[0], cardsArr[choose2]) > 0) {
					tmp = cardsArr[0];
					cardsArr[0] = cardsArr[choose2];
					cardsArr[choose2] = tmp;
			}
		}
	}
	return cardsArr;
};
