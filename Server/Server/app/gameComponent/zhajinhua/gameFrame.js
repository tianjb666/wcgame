let gameProto = require('./GameProtoZJH');
let gameLogic = require('./gameLogic');
let aiLogic = require('./aiLogic');
let roomProto = require('../../API/Protos/RoomProto');
let utils = require('../../util/utils');
let logger = require('pomelo-logger').getLogger('game');

module.exports = function (roomFrame) {
    return new gameFrameSink(roomFrame);
};

let gameFrameSink = function (roomFrame) {
    this.roomFrame = roomFrame;
    this.gameTypeInfo = this.roomFrame.gameTypeInfo;
    this.playerCount = this.roomFrame.gameRule.memberCount;
    this.gameStatus = gameProto.gameStatus.NONE;
};

let pro = gameFrameSink.prototype;

pro.receivePlayerMessage = function (chairId, msg) {
    logger.info('receivePlayerMessage');
    logger.info(chairId, msg);

    let type = msg.type || null;
    let data = msg.data || null;

    switch (type) {
        case gameProto.GAME_OPERATE_STAKE_NOTIFY:
        {
            return this.onUserStake(data, chairId);
        }
        case gameProto.GAME_OPERATE_GIVEUP_NOTIFY:
        {
            return this.onUserGiveUp(data, chairId);
        }
        case gameProto.GAME_OPERATE_LOOK_NOTIFY:
        {
            return this.onUserLook(data, chairId);
        }
        case gameProto.GAME_OPERATE_COMPARE_NOTIFY:
        {
            return this.onUserCompare(data, chairId);
        }
        case gameProto.GAME_OPERATE_SHOWDOWN_NOTIFY:
        {
            return this.onUserShowdown(data, chairId);
        }
        case gameProto.GAME_OPERATE_GU_ZHU_YI_ZHI_NOTIFY:
        {
            return this.onGuzhuyizhi(data, chairId);
        }
    }
};

pro.resetGame = function () {
    // 游戏变量
    this.firstXiaZhu = 0;                                                   //先手座位号
    this.goldSumAmount = 0;                                                 //奖池金额
    this.round = 1;                                                         //游戏下注回合数
    this.userCardIndexArr = [[], [], [], [], [], []];                       // 手牌
    this.userStatus = [0, 0, 0, 0, 0];                                      //玩家状态
    this.chairIds = [0, 1, 2, 3, 4];                                        //所有的椅子ID
    this.userStakeArr = [[], [], [], [], []];                              //玩家下注记录
    this.userStakeCountArr = [0, 0, 0, 0, 0];                               //玩家下注总额
    this.currentUserchairId = 0;                                            //当前操作的用户
    this.currentStakeLevel = 0;                                             //当前下注档位
    this.canCompare = false;                                                //是否可以比牌
    this.prepareWinnerchairId = -1;                                          //预计胜利座位
    this.curMaxCardchairId = null;                                           //当前最大牌的玩家
    this.stakeLevelDefine = [];                                               //下注数重置

    //设置下注档位数值
    for (let j = 0; j < gameProto.STAKE_LEVEL_BASE.length; j ++) {
        this.stakeLevelDefine[j] = gameProto.STAKE_LEVEL_BASE[j] * this.gameTypeInfo.baseScore;
    }
    //牌组初始化
    this.repertoryCard = gameLogic.CARD_DATA_ARRAY.slice();
};

pro.startGame = function () {
    this.resetGame();
    // 修改状态
    this.gameStatus = gameProto.gameStatus.PLAYING;
    // 洗牌
    gameLogic.randCardData(this.repertoryCard);
    // 发牌
    this.dealCard();
    //牌局数+1
    this.curDureau++;
    //测试数据
    // this.userCardIndexArr[0] = [0x21, 0x01, 0x11];//豹子
    // this.userCardIndexArr[0] = [0x01, 0x02, 0x03];//同花顺 特殊A32
    // this.userCardIndexArr[0] = [0x02, 0x03, 0x04];//同花顺
    // this.userCardIndexArr[0] = [0x02, 0x04, 0x06];//同花
    // this.userCardIndexArr[0] = [0x02, 0x03, 0x14];//顺子
    // this.userCardIndexArr[0] = [0x02, 0x12, 0x04];//对子(右)
    // this.userCardIndexArr[0] = [0x02, 0x13, 0x03];//对子(左)
    // this.userCardIndexArr[1] = [0x02, 0x15, 0x24];//单牌
    // this.userCardIndexArr[0] = gameLogic.sortCardList(this.userCardIndexArr[0]);
    // this.userCardIndexArr[1] = [0x02, 0x13, 0x25];//235
    // 随机先手座位号
    let playerChairIDArr = [];
    for (let i = 0; i < this.playerCount; ++i){
        let user = this.roomFrame.getUserByChairId(i);
        if (!user) continue;
        playerChairIDArr.push(i);
    }
    this.firstXiaZhu = playerChairIDArr[utils.getRandomNum(0, playerChairIDArr.length - 1)];
    // 设置当前操作用户
    this.currentUserchairId = this.firstXiaZhu;
    //起始下注
    for (let i = 0; i < this.playerCount; i ++) {
        if (this.userStatus[i] === gameProto.NORMAL_PLAYING) {
            let count = this.stakeLevelDefine[this.currentStakeLevel];
            this.userStakeArr[i].push(count);
            this.userStakeCountArr[i] += count;
            this.goldSumAmount += count;
        }
    }
    this.roomFrame.sendDataToAll(gameProto.gameStartPush(this.currentStakeLevel, this.firstXiaZhu, this.goldSumAmount, this.round, this.userStakeCountArr));

    this.checkAutoStake(this.currentUserchairId);
};

pro.dealCard = function () {
    // 检测机器人是否赢
    let robotWinRate = this.roomFrame.getCurRobotWinRate() * 100;
    if (robotWinRate > 0) {
        let num = Math.ceil(Math.random() * 100);
        if (num < robotWinRate) {
            let robotChairs = [];
            for (let i = 0; i < this.playerCount; i++) {
                let user = this.roomFrame.getUserByChairId(i);
                if (!!user) {
                    if (user.userInfo.robot) {
                        robotChairs.push(i);
                    }
                }
            }
            if (robotChairs.length > 0) {
                this.prepareWinnerchairId = robotChairs[num % robotChairs.length];
            }
        }
    }
    // 发牌
    let cardTypeArr = [];
    for (let i = 0; i < this.playerCount; i++) {
        let user = this.roomFrame.getUserByChairId(i);
        if (!user) continue;
        this.userCardIndexArr[i] = gameLogic.dealCard(this.repertoryCard);
        this.userStatus[i] = gameProto.NORMAL_PLAYING;
        if (this.prepareWinnerchairId >= 0) cardTypeArr[i] = gameLogic.getCardType(this.userCardIndexArr[i]);
    }

    // 给机器人最大牌
    if (this.prepareWinnerchairId >= 0) {
        let baoziAnd235 = {
            baozi: false,
            danpai_235: false,
            danpai_235_chairId: 0
        };
        for (let j = 0; j < cardTypeArr.length; j ++) {
            if (cardTypeArr[j] === gameProto.CARD_TYPE_BAO_ZI) baoziAnd235.baozi = true;
            if (cardTypeArr[j] === gameProto.CARD_TYPE_ZASE_235) baoziAnd235.danpai_235 = true;
        }
        // 若既有豹子又有杂色235，则把235的牌重新换掉
        if (baoziAnd235.baozi && baoziAnd235.danpai_235) {
            this.changeDanPai235(baoziAnd235.danpai_235_chairId);
        }
        this.prepareWinnerChangeCards();
    }

    // 计算当前最大牌的玩家
    let maxCardType = 0;
    let maxCardTypechairId = 0;
    for (let i = 0; i < this.playerCount; i ++) {
        if (this.userCardIndexArr[i].length > 0) {
            let cardType = gameLogic.getCardType(this.userCardIndexArr[i]);
            if (maxCardType < cardType) {
                maxCardType = cardType;
                maxCardTypechairId = i;
            } else if (maxCardType === cardType) {
                if (gameLogic.compareCards(this.userCardIndexArr[i], this.userCardIndexArr[maxCardTypechairId])) {
                    maxCardTypechairId = i;
                }
            }
        }
    }
    this.curMaxCardchairId = maxCardTypechairId;
};

pro.prepareWinnerChangeCards = function () {
    let maxCardType = 0;
    let maxCardTypechairId = 0;

    for (let i = 0; i < this.playerCount; i ++) {
        //有牌才换，没牌不换
        if (this.userCardIndexArr[i].length > 0) {
            let cardType = gameLogic.getCardType(this.userCardIndexArr[i]);
            if (maxCardType < cardType) {
                maxCardType = cardType;
                maxCardTypechairId = i;
            } else if (maxCardType === cardType) {
                if (gameLogic.compareCards(this.userCardIndexArr[i], this.userCardIndexArr[maxCardTypechairId])) {
                    maxCardTypechairId = i;
                }
            }
        }
    }

    let tmpCards = this.userCardIndexArr[maxCardTypechairId];
    this.userCardIndexArr[maxCardTypechairId] = this.userCardIndexArr[this.prepareWinnerchairId];
    this.userCardIndexArr[this.prepareWinnerchairId] = tmpCards;
};

pro.changeDanPai235 = function (chairId) {
    if (gameLogic.getCardType(this.userCardIndexArr[chairId]) === gameProto.CARD_TYPE_ZASE_235) {
        this.userCardIndexArr[chairId] = gameLogic.dealCard(this.repertoryCard);
        this.changeDanPai235(chairId);
    }
};

pro.checkPrepareWin = function () {
    return this.prepareWinnerchairId >= 0;
};

pro.checkIsNewRound = function () {
    // 获取用户下注次数
    let playingUserRound = [];
    for (let i = 0; i < this.userStatus.length; i ++) {
        if (this.userStatus[i] === gameProto.NORMAL_PLAYING || this.userStatus[i] === gameProto.LOOK_CARD) {
            playingUserRound.push(this.userStakeArr[i].length);
        }
    }
    // 下注次数都相同则改轮结束
    for (let j = 0; j < playingUserRound.length - 1; j ++) {
        if (playingUserRound[j] !== playingUserRound[j + 1]) return false;
    }
    return true;
};

pro.checkIsGameEnd = function (param) {
    let playingchairIds = [];
    let playingUsersCards = [];
    let winType = 0;

    for (let i = 0; i < this.userStatus.length; i ++) {
        if (this.userStatus[i] === gameProto.NORMAL_PLAYING || this.userStatus[i] === gameProto.LOOK_CARD) {
            playingchairIds.push(i);
            playingUsersCards.push(this.userCardIndexArr[i]);
        }
    }
    // 只有一个人了
    if (playingchairIds.length === 1) winType = gameProto.WIN_TYPE_OTHERS_GIVE;

    // 到达最大回合数
    if (this.round > gameProto.MAX_ROUND) winType = gameProto.WIN_TYPE_WIN;

    // 如果下注次数达到最大，则自动开牌，这个时候人数必定是2个或以上
    if (winType !== 0) {
        let winnerCards = playingUsersCards[0];
        let winnerchairId = playingchairIds[0];
        if (winType === gameProto.WIN_TYPE_WIN) {
            for (let j = 1; j < playingUsersCards.length; j ++) {
                logger.info(winnerCards);
                logger.info(playingUsersCards[j]);
                if (!gameLogic.compareCards(winnerCards, playingUsersCards[j])) {
                    winnerCards = playingUsersCards[j];
                    winnerchairId = playingchairIds[j];
                }
            }
        }
        logger.info('赢家Chair', winnerchairId);
        let scoreChangeArr = [];
        for (let i = 0; i < this.userStakeCountArr.length; ++i){
            scoreChangeArr[i] = -this.userStakeCountArr[i];
            if (i === winnerchairId){
                scoreChangeArr[i] += this.goldSumAmount;
            }
        }
        let userCardTypeArr = [];
        for (let i = 0; i < this.userCardIndexArr.length; ++i){
            if (!!this.userCardIndexArr[i] && this.userCardIndexArr[i].length > 0){
                userCardTypeArr.push(gameLogic.getCardType(this.userCardIndexArr[i]));
            }else{
                userCardTypeArr.push(null);
            }
        }
        // 发送游戏结束信息
        this.roomFrame.sendDataToAll(gameProto.gameEndPush(winType, winnerchairId, userCardTypeArr, this.userCardIndexArr, scoreChangeArr));
        // 一局游戏结束
        this.gameStatus = gameProto.gameStatus.NONE;
        // 结束数据
        let endData = [];
        for (let r = 0; r < this.playerCount; r ++) {
            let user = this.roomFrame.getUserByChairId(r);
            if (!!user) {
                endData.push({
                    uid: user.userInfo.uid,
                    score: scoreChangeArr[r]
                })
            }
        }
        this.roomFrame.concludeGame(endData);
    } else {
        //若本局没有完，则下一个人出牌
        if (!!param &&  param.notNextOne) return;
        let tmpchairId = this.currentUserchairId;
        // 查找下一个出牌的用户
        for (let i = 1; i < this.chairIds.length; i++) {
            let index = (tmpchairId + i) % this.chairIds.length;
            if (this.userStatus[index] === gameProto.LOOK_CARD || this.userStatus[index] === gameProto.NORMAL_PLAYING) {
                this.currentUserchairId = index;
                break;
            }
        }
        // 第二回合起剩下的人里有看牌的就可以进行比牌
        this.canCompare = false;
        if (this.round > 1) {
            for (let i = 0; i < playingchairIds.length; i++) {
                if (this.userStatus[playingchairIds[i]] === gameProto.LOOK_CARD) {
                    this.canCompare = true;
                }
            }
        }
        // 发送操作消息
        let currentMultiple = this.userStatus[this.currentUserchairId] === gameProto.LOOK_CARD?2:1;
        this.roomFrame.sendDataToAll(gameProto.chairTurnPush(this.currentUserchairId, this.currentStakeLevel, currentMultiple, this.canCompare));
        // 检查自动操作
        this.checkAutoStake(this.currentUserchairId);
    }
};

pro.onUserGetGameData = function (data_, chairId) {
    let cardsArr = [[], [], [], [], [], []];
    let offLineStatus = [];
    for (let i = 0; i < this.userStatus.length; i ++) {
        if (this.userStatus[i] === gameProto.LOOK_CARD) {
            cardsArr[i] = this.userCardIndexArr[i];
        }

        let user = this.roomFrame.getUserByChairId(i);
        if (!!user) {
            offLineStatus[i] = user.userStatus === roomProto.userStatusEnum.OFFLINE;
        }
    }

    let data = {
        stakeArr: this.userStakeArr,
        userStatus: this.userStatus,
        goldSumAmount: this.goldSumAmount,
        round: this.round,
        usersScore: this.usersScore,
        currentUserchairId: this.currentUserchairId,
        userCardsArr: cardsArr,
        currentStakeLevel: this.currentStakeLevel,
        canCompare: this.canCompare,
        offLineStatus: offLineStatus,
        firstXiaZhu: this.firstXiaZhu
    };

    this.roomFrame.sendData(gameProto.getGameDataPush(data), [chairId]);
};

pro.onUserStake = function (data, chairId) {
    if (this.gameStatus !== gameProto.gameStatus.PLAYING) return;
    if (this.userStatus[chairId] !== gameProto.NORMAL_PLAYING && this.userStatus[chairId] !== gameProto.LOOK_CARD) return;
    //下注椅子验证
    if (chairId !== this.currentUserchairId) {
        logger.error("onUserStake err: invalid chair id");
        return;
    }
    //下注等级验证
    let stakeLevel = parseInt(data.stakeLevel);
    if (stakeLevel < this.currentStakeLevel || !this.stakeLevelDefine[data.stakeLevel]) {
        logger.error("onUserStake err: stakeLevel err");
        return;
    }
    // 看牌的人按倍率下注
    let stakeNum = this.stakeLevelDefine[data.stakeLevel];
    let multiple = 1;
    if (this.userStatus[chairId] === gameProto.LOOK_CARD) {
        stakeNum = this.stakeLevelDefine[data.stakeLevel] * gameProto.LOOK_CARD_MULTIPLE;
        multiple = gameProto.LOOK_CARD_MULTIPLE;
    }
    // 验证下注金额
    let user = this.roomFrame.getUserByChairId(chairId);
    if (!user.userInfo.robot && (user.userInfo.gold < this.userStakeCountArr[chairId] + stakeNum)){
        logger.error("onUserStake err: gold err");
        return;
    }
    // 记录下注数据
    this.currentStakeLevel = stakeLevel;
    this.userStakeArr[chairId].push(stakeNum);
    this.userStakeCountArr[chairId] += stakeNum;
    this.goldSumAmount += stakeNum;
    // 更新轮数
    if (this.checkIsNewRound()) this.round ++;
    let round = this.round;
    if (round > gameProto.MAX_ROUND) round = gameProto.MAX_ROUND;

    this.roomFrame.sendDataToAll(gameProto.userStakePush(chairId, stakeLevel, multiple, this.userStakeCountArr[chairId], this.goldSumAmount, round));

    // this.writeUserScore(chairId, -stakeNum);
    // this.updateUsersScore();

    this.checkIsGameEnd();
};

pro.onUserGiveUp = function (data, chairId) {
    if (this.gameStatus !== gameProto.gameStatus.PLAYING) return;
    if (this.userStatus[chairId] !== gameProto.NORMAL_PLAYING && this.userStatus[chairId] !== gameProto.LOOK_CARD) return;
    this.userStatus[chairId] = gameProto.GIVE_UP;

    // 推送弃牌消息
    this.roomFrame.sendDataToAll(gameProto.userGiveUpPush(chairId));

    // 检查是否开始下一轮
    this.checkIsGameEnd({notNextOne: this.currentUserchairId !== chairId});
};

pro.onUserLook = function (data, chairId) {
    //若玩家已经弃牌或者输了，看牌时只给自己发送通知
    if (this.userStatus[chairId] === gameProto.GIVE_UP || this.userStatus[chairId] === gameProto.LOSE) {
        this.roomFrame.sendData(gameProto.userLookCardPush(this.userCardIndexArr[chairId], chairId), [chairId]);
        return;
    }

    // 修改用户状态
    this.userStatus[chairId] = gameProto.LOOK_CARD;

    // 给其他玩家发送看牌消息
    this.roomFrame.sendDataExceptchairIds(gameProto.userLookCardPush(null, chairId), [chairId]);
    // 给自己发送看牌消息和牌数据
    this.roomFrame.sendData(gameProto.userLookCardPush(this.userCardIndexArr[chairId], chairId), [chairId]);
};

pro.onUserCompare = function (data, chairId) {
    if (this.gameStatus !== gameProto.gameStatus.PLAYING) {
        logger.error('onUserCompare err: game status err');
        return;
    }
    if (this.userStatus[chairId] !== gameProto.NORMAL_PLAYING && this.userStatus[chairId] !== gameProto.LOOK_CARD){
        logger.error('onUserCompare err: user status err');
        return;
    }
    if (this.userStatus[data.comparechairId] !== gameProto.NORMAL_PLAYING && this.userStatus[data.comparechairId] !== gameProto.LOOK_CARD){
        logger.error('onUserCompare err: comparechair status err');
        return;
    }
    if (chairId !== this.currentUserchairId){
        logger.error('onUserCompare err: chair invalid');
        return;
    }
    // 比牌要先下比注
    let stakeNum = this.stakeLevelDefine[this.currentStakeLevel];
    // 比牌的人看了牌，则按倍率下注
    let multiple = 1;
    if (this.userStatus[chairId] === gameProto.LOOK_CARD) {
        stakeNum = this.stakeLevelDefine[this.currentStakeLevel] * gameProto.LOOK_CARD_MULTIPLE;
        multiple = gameProto.LOOK_CARD_MULTIPLE;
    }
    // 比牌时要下两倍的注
    stakeNum *= 2;
    multiple *= 2;

    // 记录下注
    this.userStakeArr[chairId].push(stakeNum);
    this.userStakeCountArr[chairId] += stakeNum;
    this.goldSumAmount += stakeNum;

    // 推送下注信息
    this.roomFrame.sendDataToAll(gameProto.userStakePush(chairId, this.currentStakeLevel, multiple, this.userStakeCountArr[chairId], this.goldSumAmount, this.round));

    // 计算比牌结果
    let loserchairId = gameLogic.compareCards(this.userCardIndexArr[chairId], this.userCardIndexArr[data.comparechairId])?data.comparechairId:chairId;
    this.userStatus[loserchairId] = gameProto.LOSE;
    // 向所有玩家发送比牌结果
    this.roomFrame.sendDataToAll(gameProto.userComparePush(chairId, data.comparechairId, loserchairId));

    setTimeout(function () {
        if (!this.roomFrame) return;
        // 延迟检查下一轮
        this.checkIsGameEnd();
    }.bind(this), 2000);

    /*// 延迟检查下一轮
    this.checkIsGameEnd();*/
    /*//比牌结果
    setTimeout(function () {
        // 向所有玩家发送比牌结果
        this.roomFrame.sendDataToAll(gameProto.userComparePush(chairId, data.comparechairId, loserchairId));

        setTimeout(function () {
            // 延迟检查下一轮
            this.checkIsGameEnd();
        }.bind(this), 2000);
    }.bind(this), 500);*/
};

//孤注一掷
pro.onGuzhuyizhi = function (data, chairId) {
    if (this.gameStatus !== gameProto.gameStatus.PLAYING) return;
    if (this.userStatus[chairId] !== gameProto.NORMAL_PLAYING && this.userStatus[chairId] !== gameProto.LOOK_CARD) return;

    let user = this.roomFrame.getUserByChairId(chairId);
    let stakeNum = data.stakeNum;
    // 验证stakeNum是否合理
    // 看牌的人按倍率下注
    let shouldStakeNum = this.stakeLevelDefine[data.stakeLevel];
    if (this.userStatus[chairId] === gameProto.LOOK_CARD) {
        shouldStakeNum = this.stakeLevelDefine[data.stakeLevel] * gameProto.LOOK_CARD_MULTIPLE;
    }
    if (typeof stakeNum !== "number" || stakeNum < 0 || stakeNum > shouldStakeNum || (stakeNum + this.userStakeCountArr[chairId] - user.userInfo.gold > 0.0001)){
        logger.error("onGuzhuyizhi err: invalid stakeNum " + stakeNum);
        return;
    }

    this.userStakeArr[chairId].push(stakeNum);
    this.userStakeCountArr[chairId] += stakeNum;
    this.goldSumAmount += stakeNum;

    this.roomFrame.sendDataToAll(gameProto.userStakePush(chairId, 0, stakeNum, this.userStakeCountArr[chairId], this.goldSumAmount, this.round));

    this.resultData = [];
    this.guzhuyizhiCompare(chairId);
};

pro.guzhuyizhiCompare = function (chairId) {
    //孤注一掷则从玩家下家开始挨个比牌，输了GG，赢了继续比牌
    let comparechairId = this.getComparechairId(chairId);
    logger.info('guzhuyizhiCompare', comparechairId);
    if (comparechairId !== null) {
        let loserchairId = chairId;
        let result = gameLogic.compareCards(this.userCardIndexArr[chairId], this.userCardIndexArr[comparechairId]);
        if (result) {
            loserchairId = comparechairId;
            this.userStatus[loserchairId] = gameProto.LOSE;

            this.resultData[this.resultData.length] = {
                chairId: chairId,
                comparechairId: comparechairId,
                loserchairId: loserchairId
            };

            this.guzhuyizhiCompare(chairId);
        } else {
            loserchairId = chairId;
            this.userStatus[loserchairId] = gameProto.LOSE;

            this.resultData[this.resultData.length] = {
                chairId: chairId,
                comparechairId: comparechairId,
                loserchairId: loserchairId
            };

            this.roomFrame.sendDataToAll(gameProto.guzhuyizhiPush(this.resultData));
            this.checkIsGameEnd();
        }
    } else {
        this.roomFrame.sendDataToAll(gameProto.guzhuyizhiPush(this.resultData));
        this.checkIsGameEnd();
    }
};

pro.getComparechairId = function (chairId) {
    //逆时针出牌
    for (let m = chairId + 1; m < this.chairIds.length; m ++) {
        if (this.userStatus[m] === gameProto.LOOK_CARD || this.userStatus[m] === gameProto.NORMAL_PLAYING) {
            return this.chairIds[m];
        }
    }

    for (let n = 0; n < chairId; n ++) {
        if (this.userStatus[n] === gameProto.LOOK_CARD || this.userStatus[n] === gameProto.NORMAL_PLAYING) {
            return this.chairIds[n];
        }
    }
    return null;
};

pro.onUserShowdown = function (data, chairId) {
    if (this.gameStatus === gameProto.gameStatus.PLAYING) return;
    this.roomFrame.sendDataToAll(gameProto.userShowdownPush(this.userCardIndexArr[chairId], chairId));
};

// 如果当前椅子上的玩家是机器人或离线状态，则自动下注
pro.checkAutoStake = function (chairID) {
    if (this.currentUserchairId !== chairID) return;
    if (this.gameStatus !== gameProto.gameStatus.PLAYING) return;
    let user = this.roomFrame.getUserByChairId(chairID);
    if (!user) return;
    // 机器人自动操作
    if (user.userInfo.robot){
        setTimeout(function () {
            if (this.currentUserchairId !== chairID) return;
            if (this.gameStatus !== gameProto.gameStatus.PLAYING) return;
            let operationResult = aiLogic.getOperationResult(chairID, this.prepareWinnerchairId, this.round, this.userStatus, this.userCardIndexArr[this.currentUserchairId], this.currentStakeLevel, this.curMaxCardchairId, this.stakeLevelDefine.length - 1);
            this.receivePlayerMessage(chairID, operationResult);
            if (operationResult.type === gameProto.GAME_OPERATE_LOOK_NOTIFY){
                this.checkAutoStake(chairID);
            }
        }.bind(this), utils.getRandomNum(1000, 3000));

    }else if ((user.userStatus & roomProto.userStatusEnum.OFFLINE) !== 0){
        setTimeout(function () {
            this.receivePlayerMessage(chairID, gameProto.userStakeNotify(this.currentStakeLevel));
        }.bind(this), 1500);
    }
};

/**************************************************************************************
 * room interface
 */
/* 玩家进入游戏时数据 */
pro.getEnterGameData = function (chairId) {
    let gameData = {
        gameTypeInfo: this.gameTypeInfo,
        profitPercentage: parseInt(this.roomFrame.publicParameter["profitPercentage"] || 5),
        gameStatus: this.gameStatus
    };
    if (this.gameStatus === gameProto.gameStatus.PLAYING){
        gameData.stakeArr = this.userStakeArr;
        gameData.goldSumAmount = this.goldSumAmount;
        gameData.round = this.round;
        gameData.userStatus = this.userStatus;
        gameData.userStakeCountArr = this.userStakeCountArr;
        gameData.currentStakeLevel = this.currentStakeLevel;
        gameData.canCompare = this.canCompare;
        gameData.currentUserchairId = this.currentUserchairId;
        gameData.firstXiaZhu = this.firstXiaZhu;
        if (gameData.userStatus[chairId] === gameProto.LOOK_CARD){
            gameData.userCardsArr = this.userCardIndexArr[chairId];
        }
    }
    return gameData;
};

pro.onEventGamePrepare = function(cb) {
    if(!!cb) cb();
};

pro.onEventGameStart = function(cb) {
    this.startGame();
    utils.invokeCallback(cb);
};

pro.onEventUserEntry = function(entryUserChairId, cb) {
    utils.invokeCallback(cb);
};

pro.onEventUserLeave = function(chairId, cb) {
    //结算
    if (!!this.userCardIndexArr[chairId] && !!this.userCardIndexArr[chairId].length > 0) {
        if (this.roomFrame.gameStarted) {
            let user = this.roomFrame.getUserByChairId(chairId);
            let data = {
                uid: user.userInfo.uid,
                score: -this.userStakeCountArr[chairId],
            };
            this.roomFrame.writeUserGameResult([data]);
        }
    }

    //清牌
    this.userCardIndexArr[chairId] = [];
    //清座位状态
    this.userStatus[chairId] = 0;
    utils.invokeCallback(cb);
};

pro.isUserEnableLeave = function(chairId) {
    return this.userStatus[chairId] === gameProto.GIVE_UP || this.userStatus[chairId] === gameProto.LOSE;
};

pro.onEventUserOffLine = function (chairId) {
    if (chairId === this.currentUserchairId) {
        this.checkAutoStake(this.currentUserchairId);
    }
};

pro.onEventRoomDismiss = function () {
    // 关闭定时器等，做最后清理工作，确保gameFrame和roomFrame没有被引用
    this.roomFrame = null;
};