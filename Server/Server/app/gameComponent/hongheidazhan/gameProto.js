let proto = module.exports;

// 通用常量
proto.GAME_NAME = "扎金花";

//加注的档位(具体数值由服务器决定)
proto.STAKE_LEVEL = [1, 2, 3, 4, 5];

proto.campCount = 2;//阵营数
proto.BLACK = 0;//红方
proto.RED = 1;//黑方

proto.stakeTime = 12;//下注时间，单位：s
proto.gameStartDelayTime = 9;//每局开始前的延时

//牌型
proto.CARD_TYPE_ZASE_235 = 1;
proto.CARD_TYPE_DAN_ZHANG = 10;
proto.CARD_TYPE_DUI_ZI = 20;
proto.CARD_TYPE_SHUN_ZI = 30;
proto.CARD_TYPE_TONG_HUA = 40;
proto.CARD_TYPE_TONG_HUA_SHUN = 50;
proto.CARD_TYPE_BAO_ZI = 60;


//消息类型
//接收消息
proto.GAME_OPERATE_STAKE_NOTIFY = 401;//玩家下注信息

//推送消息
proto.GAME_OPERATE_STAKE_PUSH = 301;//推送下注信息

//游戏流程
proto.GAME_START_PUSH = 201;//游戏开局
proto.GAME_END_PUSH = 202;//游戏结束+结算

//下游金额类型
proto.SCORE_BLACK = 0;
proto.SCORE_RED = 1;
proto.SCORE_LUCK = 2;

//游戏状态
proto.gameStatus = {
    NONE: 0,//不可下注
    GAME_STARTED: 1,//可下注
    GAME_END: 2//不可下注
};

proto.DIR_COUNT = 50;