/**
 * author: caolinye		date: 2018/3/19
 */

var gameProto = require('./gameProto');
var roomProto = require('../../API/Protos/RoomProto');
var gameLogic = require('./gameLogic');
var logger = require('pomelo-logger').getLogger('game');


var gameFrameSink = function(gameFrame) {
    this.gameFrame = gameFrame;
	this.resoutRecord = [];					// 结果记录
	this.gameStatus = gameProto.STATUS_NONE;
	this.gameFrame = gameFrame;
	this.bajiuCount = 0;					// 8,9数量
	this.winTypeArr = [];					// 游戏记录
	this.maxBureau = 48;					// 48局重新开始
};

module.exports = function(gameFrame) {
    return new gameFrameSink(gameFrame);
};

var pro = gameFrameSink.prototype;

pro.receivePlayerMessage = function (chairId, msg){
    var type = msg.type || null;
    var data = msg.data || null;

    if (!type || !data){ return false; }
	if(type === gameProto.POUR_GOLD_NOTIFY) {
		this.answerPourGoldNotify(chairId, data);
	}

    return false;
};

/*
 * 开始游戏
 */
pro.startGame = function() {
	this.pourGoldObj = {};
	this.gameStatus = gameProto.STATUS_POUR;
	this.gameFrame.sendData(gameProto.getStatusPushData(this.gameStatus));
	this.robotAutoPour();

	this.tickTm = gameProto.POUR_TM;
	var id = setInterval(function() {
		-- this.tickTm;
	}.bind(this), 1000);
	setTimeout(function() {
		clearTimeout(id);
		this.sendResout();
	}.bind(this), gameProto.POUR_TM*1000);
};

/*
 * 机器人自动下注
 */
pro.robotAutoPour = function() {
	var self = this;
	var user, key;
	var callFunc = function(user){
		setTimeout(function() {
			var dirArr = [gameLogic.WIN_XIAN, gameLogic.WIN_ZHUANG, gameLogic.WIN_XIANDUI, gameLogic.WIN_ZHUANGDUI, gameLogic.WIN_HE];
			var pourGold = Math.floor(user.userInfo.gold*Math.random()*0.01);
			var dir = dirArr[Math.floor(Math.random()*dirArr.length)];
			if(pourGold > 0) {
				self.answerPourGoldNotify(user.chairId, {
					direction: dir,
					gold: pourGold
				}); 
			}
		}, 500+Math.random()*(gameProto.POUR_TM-1)*1000);
	};
	for(key in this.gameFrame.userArr) {
		if(this.gameFrame.userArr.hasOwnProperty(key)) {
			user = this.gameFrame.userArr[key];
			if(user.userInfo.robot && user.userInfo.uid !== this.bankerUid) {
				callFunc(user); 
			}
		}
	}
};


/*
 * 响应押注
 */
pro.answerPourGoldNotify = function(chairId, data) {
	if(this.gameStatus !== gameProto.STATUS_POUR) {
		logger.warn('baijiale answerPourGoldNotify error');
		return;
	}
	var dirArr = [gameLogic.WIN_XIAN, gameLogic.WIN_XIANDUI, gameLogic.WIN_ZHUANG, gameLogic.WIN_ZHUANGDUI, gameLogic.WIN_HE];
	if(dirArr.indexOf(data.direction) < 0) {
		logger.warn('baijiale direction error');
		return;
	}
	var user = this.gameFrame.getUserByChairId(chairId);
	if(data.gold+this.getAlreadyPourGold(user.userInfo.uid) > user.userInfo.gold) {
		logger.warn('baijiale gold not enough error');
		return;
	}

	if(! this.pourGoldObj[data.direction]) {
		this.pourGoldObj[data.direction] = {};
	}
	if(! this.pourGoldObj[data.direction][user.userInfo.uid]) {
		this.pourGoldObj[data.direction][user.userInfo.uid] = data.gold;
	} else {
		this.pourGoldObj[data.direction][user.userInfo.uid] += data.gold;
	}
	this.gameFrame.sendData(gameProto.getPourGoldPushData(data.direction, data.gold, user.userInfo.uid));
};

/*
 * 获取已经下注的金币
 */
pro.getAlreadyPourGold = function(uid) {
	var dir, key, gold = 0;
	for(dir in this.pourGoldObj) {
		if(this.pourGoldObj.hasOwnProperty(dir)) {
			for(key in this.pourGoldObj[dir]) {
				if(this.pourGoldObj[dir].hasOwnProperty(key) && key === uid) {
					gold += this.pourGoldObj[dir][key];
				}
			}
		}
	}
	return gold;
};

/*
 * 发送游戏结果
 */
pro.sendResout = function() {
	this.gameStatus = gameProto.STATUS_RESOUT;
	this.gameFrame.sendData(gameProto.getStatusPushData(this.gameStatus));
	//this.cardsArr = gameLogic.getCards();
	this.cardsArr = this.getCardsByWinRate();
	this.resout = gameLogic.getResout(this.cardsArr, this.pourGoldObj);
	if(this.winTypeArr.length === this.maxBureau) {
		this.winTypeArr = [];
		this.bajiuCount = 0;
	}
	if(this.cardsArr[0].length === 3 && gameLogic.getCardCount(this.cardsArr[0][2]) >= 8) {
		++ this.bajiuCount;
	}
	if(this.cardsArr[1].length === 3 && gameLogic.getCardCount(this.cardsArr[1][2]) >= 8) {
		++ this.bajiuCount;
	}
	this.winTypeArr.push(this.resout.type);
	this.resout.bajiuCount = this.bajiuCount;
	this.resout.winTypeArr = this.winTypeArr;
	this.gameFrame.sendData(gameProto.getResoutPushData(this.resout));
	this.tickTm = gameProto.RESOUT_TM;
	var id = setInterval(function() {
		-- this.tickTm;
	}.bind(this), 1000);
	setTimeout(function() {
		clearTimeout(id);
		this.endGame();
	}.bind(this), gameProto.RESOUT_TM*1000);
};

/*
 * 结束游戏
 */
pro.endGame = function() {
	var data = [];
	var userWinObj = this.resout.userWinObj;
	var betObj = {};
	var key, dir;
	for(dir in this.pourGoldObj) {
		if(this.pourGoldObj.hasOwnProperty(dir)) {
			for(key in this.pourGoldObj[dir]) {
				if(this.pourGoldObj[dir].hasOwnProperty(key)) {
					if(betObj[key]) {
						betObj[key] += this.pourGoldObj[dir][key];
					} else {
						betObj[key] = this.pourGoldObj[dir][key];
					}
				}
			}
		}
	}
	for(key in userWinObj) {
		if(userWinObj.hasOwnProperty(key)) {
			data.push({
				uid: key,
				score: userWinObj[key],
				betCount: betObj[key]
			});
		}
	}
	this.gameFrame.concludeGame(data);
};

/*
 * 进入游戏时获取的数据
 */
pro.getEnterGameData = function() {
	var data = {
		gameStatus: this.gameStatus,
		roomId: this.gameFrame.roomId,
		tickTm: this.tickTm,
        resultData: this.resout,
		winTypeArr: this.winTypeArr,
		bajiuCount: this.bajiuCount,
		profitPercentage: this.gameFrame.publicParameter.profitPercentage,
		pourGoldObj: this.pourGoldObj,
	};
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
	var user = this.gameFrame.getUserByChairId(chairId);
	var dir, uid;
	for(dir in this.pourGoldObj) {
		if(this.pourGoldObj.hasOwnProperty(dir)) {
			for(uid in this.pourGoldObj[dir]) {
				if(this.pourGoldObj[dir].hasOwnProperty(uid) && uid === user.userInfo.uid) {
					return false;
				}
			}
		}
	}
	return true;
};

pro.onEventUserOffLine = function() {
};

pro.onEventUserEntry = function() {
};

//****************************************************************************************

/*
 * 后台控制输赢概率
 */
pro.getCardsByWinRate = function() {
	var winRate = this.gameFrame.robotWinRate;
	var cardsArr = gameLogic.getCards();
	if(Math.random() <= winRate) {	/* 后台进行控制 */
		var pourGoldObj = {};		/*筛选非机器人玩家*/
		var dir, uid, user;
		var userCount = 0;
		for(dir in this.pourGoldObj) {
			if(this.pourGoldObj.hasOwnProperty(dir)) {
				pourGoldObj[dir] = {};
				for(uid in this.pourGoldObj[dir]) {
					if(this.pourGoldObj[dir].hasOwnProperty(uid)) {
						user = this.gameFrame.userArr[uid];
						if(user && !user.userInfo.robot) {
							pourGoldObj[dir][uid] = this.pourGoldObj[dir][uid];
							++ userCount;
						}
					}
				}
			}
		}
		var type;
		if(userCount > 0) {	/*有玩家时进行控制*/
			var typeArr = [gameLogic.WIN_ZHUANG, gameLogic.WIN_XIAN, gameLogic.WIN_HE, gameLogic.WIN_ZHUANG|gameLogic.WIN_ZHUANGDUI, gameLogic.WIN_XIAN|gameLogic.WIN_XIANDUI];
			var winLoseObj;
			while(typeArr.length > 0) {
				cardsArr = gameLogic.getCards();
				type = gameLogic.getResoutType(cardsArr);
				while(typeArr.indexOf(type) === -1) {
					cardsArr = gameLogic.getCards();
					type = gameLogic.getResoutType(cardsArr);
				}
				typeArr.splice(typeArr.indexOf(type), 1);
				winLoseObj = gameLogic.getWinLoseGold(cardsArr, pourGoldObj);
				if(winLoseObj.lose >= winLoseObj.win) {	/*系统赢钱*/
					break;
				}
			}
		}
	}
	return cardsArr;
};
