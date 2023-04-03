/**
 * Created by cly on 17/6/28
 */
var proto = module.exports;

proto.ROB_FREE_BANK_NOTIFY		= 301;		// 自由抢庄
proto.ROB_FREE_BANK_PUSH		= 401;		// 抢庄回复

proto.BANK_CHANGE_PUSH			= 402;		// 庄家变化推送

proto.CAN_POUR_SCORE_PUSH		= 403;		// 可押注分数推送
proto.POUR_SCORE_NOTIFY			= 304;		// 押注推送
proto.POUR_SCORE_PUSH			= 404;		// 押注回复

proto.RESOUT_CARD_PUSH			= 405;		// 结果牌推送
proto.SHOW_CARD_NOTIFY			= 306;		// 亮牌通知
proto.SHOW_CARD_PUSH			= 406;		// 亮牌回复

proto.GAME_RESOUT_PUSH			= 407;		// 游戏结果

proto.FOUR_CARD_PUSH			= 408;		// 明牌抢庄牌推送
proto.ROB_RATE_BANK_NOTIFY		= 309;		// 明牌抢庄
proto.ROB_RATE_BANK_PUSH		= 409;		// 明牌抢庄回复
proto.FIFTH_CARD_PUSH			= 410;		// 第5张牌推送
proto.GAME_STATUS_PUSH			= 411;		// 游戏状态变化推送


proto.GAME_STATUS_PREPARE		= 1;		// 准备中
proto.GAME_STATUS_ROBBANK		= 2;		// 抢庄中
proto.GAME_STATUS_POURSCORE		= 3;		// 押注中
proto.GAME_STATUS_SORTCARD		= 4;		// 看牌中
proto.GAME_STATUS_RESOUT		= 5;		// 显示结果中


proto.AUTO_SHOWCARD_TM			= 10;		// 自动显示牌时间
proto.AUTO_READY_TM				= 8;		// 游戏自动开始
proto.AUTO_ROBBANK_TM			= 5;		// 抢庄时间
proto.AUTO_POURGOLD_TM			= 7;		// 下注时间


// 自由抢庄
proto.getRobFreeBankNotifyData = function(isRob) {
	return {
		type: this.ROB_FREE_BANK_NOTIFY,
		data: { 
			isRob: isRob
		}
	};
};

proto.getRobFreeBankPushData = function(chairId, isRob) {
	return {
		type: this.ROB_FREE_BANK_PUSH,
		data: { 
			chairId: chairId,
			isRob: isRob
		}
	};
};

// 换庄
proto.getBankChangePushData = function(bankChairId, gameStatus, robBankArr) {
	return {
		type: this.BANK_CHANGE_PUSH,
		data: {
			bankChairId: bankChairId,
			gameStatus: gameStatus,
			robBankArr: robBankArr
		}
	};
};

// 选择押注分数推送
proto.getCanPourScorePushData = function(gameStatus, scoresArr) {
	return {
		type: this.CAN_POUR_SCORE_PUSH,
		data: {
			gameStatus: gameStatus,
			scoresArr: scoresArr
		}
	};
};

// 押注通知
proto.getPourScoreNotifyData = function(score) {
	return {
		type: this.POUR_SCORE_NOTIFY,
		data: {
			score: score
		}
	};
};

proto.getPourScorePushData = function(chairId, score) {
	return {
		type: this.POUR_SCORE_PUSH,
		data: { 
			chairId: chairId,
			score: score
		}
	};
};

// 结果牌推送
proto.getResoutCardPushData = function(chairId, cardArr, gameStatus) {
	return {
		type: this.RESOUT_CARD_PUSH,
		data: { 
			chairId: chairId,
			cardArr: cardArr,
			gameStatus: gameStatus
		}
	};
};

// 亮牌通知
proto.getShowCardNotifyData = function() {
	return {
		type: this.SHOW_CARD_NOTIFY,
		data: { }
	};
};

// 亮牌推送
proto.getShowCardPushData = function(chairId, cardArr) {
	return {
		type: this.SHOW_CARD_PUSH,
		data: { 
			chairId: chairId,
			cardArr: cardArr
		}
	};
};

// 明牌抢庄牌推送
proto.getFourCardPushData = function(cardArr) {
	return {
		type: this.FOUR_CARD_PUSH,
		data: { 
			cardArr: cardArr
		}
	};
};

// 明牌抢庄通知
proto.getRobRateBankNotifyData = function(rate) {
	return {
		type: this.ROB_RATE_BANK_NOTIFY,
		data: { 
			rate: rate
		}
	};
};

proto.getRobRateBankPushData = function(chairId, rate) {
	return {
		type: this.ROB_RATE_BANK_PUSH,
		data: { 
			chairId: chairId,
			rate: rate
		}
	};
};

// 明牌第5张牌推送
proto.getFiveCardPushData = function(cardId) {
	return {
		type: this.FIFTH_CARD_PUSH,
		data: { 
			cardId: cardId
		}
	};
};

// 游戏结果推送
proto.getGameResoutPushData = function(resout) {
	return {
		type: this.GAME_RESOUT_PUSH,
		data: {
			bankIndex: resout.bankIndex,
			cardsArr: resout.cardsArr,
			finalScoreArr: resout.finalScoreArr
		}
	};
};

// 游戏状态变化推送
proto.getGameStatusPushData = function(gameStatus) {
	return {
		type: this.GAME_STATUS_PUSH,
		data: { 
			gameStatus: gameStatus
		}
	};
};
