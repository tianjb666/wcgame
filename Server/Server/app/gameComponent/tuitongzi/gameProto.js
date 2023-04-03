var proto = module.exports;

// 推筒子协议
//-----------------------------上下庄----------------------------------------
proto.GAME_ASKTOBEBANKER_REQUEST	= 301;		// 请求成为庄家
proto.GAME_ASKTOBEBANKER_PUSH		= 401;		

proto.GAME_ASKTOBEPLAYER_REQUEST	= 302;		// 请求下庄
proto.GAME_ASKTOBEPLAYER_PUSH		= 402;

proto.GAME_BANKERCHANGE_PUSH		= 403;		// 换庄推送

//-----------------------------玩家操作----------------------------------------
proto.GAME_POURGOLD_REQUEST			= 304;		// 下注
proto.GAME_POURGOLD_PUSH			= 404;		// 下注

//-----------------------------游戏状态----------------------------------------

proto.GAME_STATUSCHANGE_PUSH		= 405;		// 游戏状态变化
proto.GAME_RESOUT_PUSH				= 406;		// 游戏结果推送

proto.GAME_BUREAU_PUSH				= 407;		// 游戏局数推送

proto.GAME_CONTINUEBANKER_REQUEST	= 308;		// 请求须庄
proto.GAME_CONTINUEBANKER_PUSH		= 408;		// 请求须庄
proto.GAME_TOUZI_PUSH				= 409;		// 投资推送

proto.GAME_STATUS_WAITING			= 0;		// 游戏等待开始
proto.GAME_STATUS_SORTCARD			= 1;		// 游戏摆牌
proto.GAME_STATUS_POUR				= 2;		// 游戏下注
proto.GAME_STATUS_RESOUT			= 3;		// 游戏显示结果
proto.GAME_STATUS_SETTLE			= 4;		// 游戏结算中
proto.GAME_STATUS_START				= 5;		// 游戏开始中

//-----------------------------游戏状态----------------------------------------
proto.SORTCARD_SECOND				= 5;		// 摆牌时间
proto.POURGOLD_SECOND				= 9;		// 下注时间
proto.SHOWRESOUT_SECOND				= 15;		// 显示结果时间
proto.SETTLE_SECOND					= 5;		// 结算时间
proto.GAMESTART_SECOND				= 3;		// 开始中时间

//-----------------------------下注方位----------------------------------------
proto.ZHUANGJIA						= 0;		// 庄家
proto.TIANMEN						= 1;		// 天门
proto.ZHONGMEN						= 2;		// 中门
proto.DIMEN							= 3;		// 地门

// 上庄请求
proto.askToBeBankerRequestData = function(bankGold) {
	return {
		type: this.GAME_ASKTOBEBANKER_REQUEST,
		data: {
			bankGold: bankGold
		}
	};
};

// 上庄回复
proto.askToBeBankerPushData = function(bankerUid, bankGold) {
	return {
		type: this.GAME_ASKTOBEBANKER_PUSH,
		data: { 
			bankerUid: bankerUid, 
			bankGold: bankGold
		}
	};
};

// 下庄请求
proto.askToBePlayerRequestData = function() {
	return {
		type: this.GAME_ASKTOBEPLAYER_REQUEST,
		data: { }
	};
};

// 下庄请求回复
proto.askToBePlayerPushData = function(bankerUid, goldChange) {
	return {
		type: this.GAME_ASKTOBEPLAYER_PUSH,
		data: { 
			bankerUid: bankerUid,
			goldChange: goldChange
		}
	};
};

// 换庄推送
proto.changeBankerPushData = function(bankerUid, bankGold) {
	return {
		type: this.GAME_BANKERCHANGE_PUSH,
		data: { 
			bankerUid: bankerUid,
			bankGold: bankGold
		}
	};
};

// 下注请求
proto.pourGoldRequestData = function(pourGold, direction) {
	return {
		type: this.GAME_POURGOLD_REQUEST,
		data: { 
			pourGold: pourGold, 
			direction: direction
		}
	};
};

// 下注请求回复
proto.pourGoldPushData = function(uid, pourGold, direction, allPourGold) {
	return {
		type: this.GAME_POURGOLD_PUSH,
		data: { 
			uid: uid,					// uid
			pourGold: pourGold,			// 下注金币
			direction: direction,		// 下注方位
			allPourGold: allPourGold	// 总下注金额
		}
	};
};

// 游戏状态推送
proto.gameStatusChangePushData = function(gameStatus) {
	return {
		type: this.GAME_STATUSCHANGE_PUSH,
		data: { 
			gameStatus: gameStatus
		}
	};
};

// 游戏结果推送
proto.gameResoutPushData = function(resout) {
	return {
		type: this.GAME_RESOUT_PUSH,
		data: { 
			resout: resout
		}
	};
};

// 游戏局数推送
proto.gameBureauPushData = function(bureau) {
	return {
		type: this.GAME_BUREAU_PUSH,
		data: { 
			bureau: bureau
		}
	};
};

proto.continueBankerRequestData = function(bankGold) {
	return {
		type: this.GAME_CONTINUEBANKER_REQUEST,
		data: { 
			bankGold: bankGold
		}
	};
};

proto.continueBankerPushData = function(bankerUid, bankGold) {
	return {
		type: this.GAME_CONTINUEBANKER_PUSH,
		data: { 
			bankerUid: bankerUid, 
			bankGold: bankGold
		}
	};
};

proto.touziPushData = function(touzi1, touzi2) {
	return {
		type: this.GAME_TOUZI_PUSH,
		data: { 
			touzi1: touzi1, 
			touzi2: touzi2
		}
	};
};
