let proto = module.exports;

// 斗地主协议
//-----------------------------玩家操作----------------------------------------
proto.GAME_USER_OUT_CARD_NOTIFY             = 302;      // 用户出牌通知
proto.GAME_USER_OUT_CARD_PUSH               = 402;      // 用户出牌推送

proto.GAME_USER_PASS_NOTIFY                 = 303;      // 用户不出通知
proto.GAME_USER_PASS_PUSH                   = 403;      // 用户不出通知

proto.GAME_USER_BOMB_WIN_PUSH               = 407;      // 用户炸弹赢的推送

//-----------------------------游戏状态----------------------------------------
proto.GAME_START_PUSH                       = 405;      // 游戏开始推送
proto.GAME_RESULT_PUSH				        = 406;		// 游戏结果推送

//-----------------------------游戏状态----------------------------------------
proto.gameStatus = {
    NONE: 0,
    OUT_CARD: 1,
    GAME_END: 2
};

//-----------------------------时间状态----------------------------------------
proto.OPREATION_TIME                = 15;        // 操作时间
proto.OUT_CARD_TIME                 = 15;        // 显示结果的时间

proto.cardType = {
    ERROR: 0,                   // 错误
    SINGLE: 1,                  // 单牌
    DOUBLE: 2,                  // 对子
    SINGLE_LINE: 3,             // 单连
    DOUBLE_LINE: 4,             // 对连
    THREE_LINE: 5,              // 三连
    THREE_LINE_TAKE_ONE: 6,     // 三连带1
    THREE_LINE_TAKE_TWO: 7,     // 三连带2
    FOUR_LINE_TAKE_X: 8,        // 四带X
    BOMB_CARD: 9               // 炸弹
};

proto.gameStartPush = function (curChairID, selfCardArr) {
    return {
        type: this.GAME_START_PUSH,
        data: {
            curChairID: curChairID,
            selfCardArr: selfCardArr
        }
    };
};

proto.gameUserOutCardNotify = function (outCardArr) {
    return {
        type: this.GAME_USER_OUT_CARD_NOTIFY,
        data: {
            outCardArr: outCardArr
        }
    }
};

proto.gameUserOutCardPush = function (chairID, curChairID, outCardArr, leftCardCount, enablePass) {
    return {
        type: this.GAME_USER_OUT_CARD_PUSH,
        data: {
            chairID: chairID,
            curChairID: curChairID,
            outCardArr: outCardArr,
            leftCardCount: leftCardCount,
            enablePass: enablePass
        }
    }
};

proto.gameUserPassNotify = function () {
    return {
        type: this.GAME_USER_PASS_NOTIFY,
        data: {
        }
    }
};

proto.gameUserPassPush = function (chairID, curChairID, enablePass, isNewTurn) {
    return {
        type: this.GAME_USER_PASS_PUSH,
        data: {
            chairID: chairID,
            curChairID: curChairID,
            enablePass: enablePass,
            isNewTurn: isNewTurn
        }
    }
};

// 游戏结果推送
proto.gameResultPush = function(allCardArr, scoreChangeArr, bombScoreChangeArr, winChairID, nicknameArr) {
	return {
		type: this.GAME_RESULT_PUSH,
		data: {
            allCardArr: allCardArr,
            scoreChangeArr: scoreChangeArr,
            bombScoreChangeArr: bombScoreChangeArr,
            winChairID: winChairID,
            nicknameArr: nicknameArr
		}
	};
};

// 炸弹赢推送
proto.gameUserBombWinPush = function(chairID) {
    return {
        type: this.GAME_USER_BOMB_WIN_PUSH,
        data: {
            chairID: chairID
        }
    };
};