var proto = module.exports;

// 龙虎斗协议
//-----------------------------玩家操作----------------------------------------
proto.GAME_POURGOLD_NOTIFY			= 301;		// 下注通知
proto.GAME_POURGOLD_PUSH			= 401;		// 下注推送

//-----------------------------游戏状态----------------------------------------
proto.GAME_START_PUSH		        = 402;		// 游戏开始通知(下注)
proto.GAME_RESULT_PUSH				= 403;		// 游戏结果推送

//-----------------------------游戏状态----------------------------------------
proto.gameStatus = {
    NONE: 0,
    GAME_STARTED: 1,
    GAME_END: 2
};

//-----------------------------时间状态----------------------------------------
proto.BET_TIME                      = 10;       // 下注时间
proto.SHOW_RESULT_TIME              = 8;        // 显示结果的时间

//-----------------------------下注方位----------------------------------------
proto.LONG							= 0;		// 龙
proto.HU							= 1;		// 虎
proto.HE							= 2;		// 和

// 下注推送
proto.gameStartPush = function() {
	return {
		type: this.GAME_START_PUSH,
		data: {
		}
	};
};

// 游戏结果推送
proto.gameResultPush = function(scoreChangeArr, longCard, huCard, winType) {
	return {
		type: this.GAME_RESULT_PUSH,
		data: {
		    longCard: longCard,
            huCard: huCard,
            winType:winType,
            scoreChangeArr: scoreChangeArr
		}
	};
};

// 下注通知
proto.gameUserBetNotify = function (betType, count) {
    return {
        type: this.GAME_POURGOLD_NOTIFY,
        data: {
            betType: betType,
            count: count
        }
    };
};

// 下注通知
proto.gameUserBetPush = function (uid, betType, count) {
    return {
        type: this.GAME_POURGOLD_PUSH,
        data: {
            uid: uid,
            betType: betType,
            count: count
        }
    };
};