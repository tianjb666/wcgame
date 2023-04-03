let proto = module.exports;

// 游戏状态
proto.gameStatus = {
    NONE: 0,
    PLAYING: 1
};

//房卡模式计分档位
proto.STAKE_LEVEL_BASE = [1, 2, 3, 4, 5];
proto.STAKE_XUE_PIN_BASE = 50;

//加注的档位(具体数值由服务器决定)
proto.STAKE_LEVEL = [1, 2, 3, 4, 5];
proto.STAKE_XUE_PIN = 50;

proto.LOOK_CARD_MULTIPLE = 2;//看牌之后的下注倍率
proto.MAX_ROUND = 10;//最大下注次数

//牌型
proto.CARD_TYPE_ZASE_235 = 1;
proto.CARD_TYPE_DAN_ZHANG = 10;
proto.CARD_TYPE_DUI_ZI = 20;
proto.CARD_TYPE_SHUN_ZI = 30;
proto.CARD_TYPE_TONG_HUA = 40;
proto.CARD_TYPE_TONG_HUA_SHUN = 50;
proto.CARD_TYPE_BAO_ZI = 60;


//玩家状态
proto.NORMAL_PLAYING = 10000;//正常玩状态
proto.LOOK_CARD = 10001;//已看牌
proto.LOSE = 10002;//已输
proto.GIVE_UP = 10003;//弃牌
proto.LEAVE = 10004;//离开

//结算时的赢类型
proto.WIN_TYPE_OTHERS_GIVE = 1;//其他人均弃牌或离开
proto.WIN_TYPE_WIN = 2;//到达最大下注数，靠实力赢

// 扎金花协议
//-----------------------------玩家操作----------------------------------------
proto.GAME_OPERATE_STAKE_NOTIFY     = 401;//玩家下注信息
proto.GAME_OPERATE_STAKE_PUSH       = 301;//推送下注信息

proto.GAME_OPERATE_GIVEUP_NOTIFY    = 402;//弃牌
proto.GAME_OPERATE_GIVEUP_PUSH      = 302;//推送弃牌信息

proto.GAME_OPERATE_LOOK_NOTIFY      = 403;//看牌
proto.GAME_OPERATE_LOOK_PUSH        = 303;//推送看牌

proto.GAME_OPERATE_COMPARE_NOTIFY   = 404;//比牌
proto.GAME_OPERATE_COMPARE_PUSH     = 304;//推送比牌

proto.GAME_OPERATE_SHOWDOWN_NOTIFY  = 405;//亮牌
proto.GAME_OPERATE_SHOWDOWN_PUSH    = 305;//推送亮牌

proto.GAME_OPERATE_GET_GAME_DATA_NOTIFY     = 406; //新进入游戏的玩家获取游戏数据
proto.GAME_OPERATE_GET_GAME_DATA_PUSH       = 306; //新进入游戏的玩家获取游戏数据

proto.GAME_OPERATE_GU_ZHU_YI_ZHI_NOTIFY     = 407;//玩家孤注一掷
proto.GAME_OPERATE_GU_ZHU_YI_ZHI_PUSH       = 307;//玩家孤注一掷推送

//-----------------------------游戏流程----------------------------------------
proto.GAME_START_PUSH               = 308;//游戏开局
proto.GAME_CHAIR_TURN_PUSH          = 309;//轮到哪张椅子操作了
proto.GAME_END_PUSH                 = 310;//游戏结束+结算

// 操作时间
proto.OPERATION_TIME = 15;

proto.gameStartPush = function (stakeLevel, firstXiaZhu, goldSumAmount, round, userStakeCountArr) {
    return {
        type: proto.GAME_START_PUSH,
        data: {
            stakeLevel: stakeLevel,
            firstXiaZhu: firstXiaZhu,
            goldSumAmount: goldSumAmount,
            round: round,
            userStakeCountArr: userStakeCountArr
        }
    }
};

proto.chairTurnPush = function (chairId, currentStakeLevel, currentMultiple, canCompare) {
    return {
        type: proto.GAME_CHAIR_TURN_PUSH,
        data: {
            chairId: chairId,
            currentStakeLevel: currentStakeLevel,
            canCompare: canCompare,
            currentMultiple: currentMultiple
        }
    }
};

proto.gameEndPush = function (winType, winnerchairId, userCardTypeArr, userCardIndexArr, scoreChangeArr) {
    return {
        type: proto.GAME_END_PUSH,
        data: {
            winType: winType,
            winnerchairId: winnerchairId,
            userCardIndexArr: userCardIndexArr,
            userCardTypeArr: userCardTypeArr,
            scoreChangeArr: scoreChangeArr
        }
    }
};

proto.userStakeNotify = function (stakeLevel) {
    return {
        type: proto.GAME_OPERATE_STAKE_NOTIFY,
        data: {
            stakeLevel: stakeLevel
        }
    }
};

proto.userStakePush = function (chairId, stakeLevel, multiple, userStakeCount, goldSumAmount, round) {
    return {
        type: proto.GAME_OPERATE_STAKE_PUSH,
        data: {
            chairId: chairId,
            stakeLevel: stakeLevel,
            goldSumAmount: goldSumAmount,
            round: round,
            multiple: multiple,
            userStakeCount: userStakeCount
        }
    }
};

proto.userGiveUpNotify = function () {
    return {
        type: proto.GAME_OPERATE_GIVEUP_NOTIFY,
        data: {}
    }
};

proto.userGiveUpPush = function (chairId) {
    return {
        type: proto.GAME_OPERATE_GIVEUP_PUSH,
        data: {
            chairId: chairId
        }
    }
};

proto.userLookCardNotify = function () {
    return {
        type: proto.GAME_OPERATE_LOOK_NOTIFY
    }
};

proto.userLookCardPush = function (cardDataArr, chairId) {
    return {
        type: proto.GAME_OPERATE_LOOK_PUSH,
        data: {
            cardDataArr: cardDataArr,
            chairId: chairId
        }
    }
};

proto.userShowDownNotify = function (showchairId) {
    return {
        type: proto.GAME_OPERATE_SHOWDOWN_NOTIFY,
        data: {
            showchairId: showchairId
        }
    }
};

proto.userShowdownPush = function (cardDataArr, chairId) {
    return {
        type: proto.GAME_OPERATE_SHOWDOWN_PUSH,
        data: {
            chairId: chairId,
            cards: cardDataArr
        }
    }
};

proto.userCompareNotify = function (comparechairId) {
    return {
        type: proto.GAME_OPERATE_COMPARE_NOTIFY,
        data: {
            comparechairId: comparechairId
        }
    }
};

proto.userComparePush = function (chairId, comparechairId, loserchairId) {
    return {
        type: proto.GAME_OPERATE_COMPARE_PUSH,
        data: {
            loserchairId: loserchairId,
            comparechairId: comparechairId,
            chairId: chairId
        }
    }
};

proto.guzhuyizhiNotify = function (stakeNum) {
    return {
        type: proto.GAME_OPERATE_GU_ZHU_YI_ZHI_NOTIFY,
        data: {
            stakeNum: stakeNum
        }
    }
};

proto.guzhuyizhiPush = function (data) {
    return {
        type: proto.GAME_OPERATE_GU_ZHU_YI_ZHI_PUSH,
        data: data
    }
};





