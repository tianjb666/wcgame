let gameProto = require('./gameProto');
let gameLogic = require('./gameLogic');
let utils = require('../../util/utils');
let logger = require('pomelo-logger').getLogger('game');

module.exports = function (roomFrame) {
    return new gameFrameSink(roomFrame);
};

let gameFrameSink = function (roomFrame) {
    this.roomFrame = roomFrame;
    this.gameTypeInfo = this.roomFrame.gameTypeInfo;
    this.gameStatus = gameProto.gameStatus.NONE;
    this.dirRecord = [];
};

let pro = gameFrameSink.prototype;

/**
 * 发牌
 */
pro.dealCard = function () {
    for (let i = 0; i < gameProto.campCount; i ++) {
        this.userCardIndexArr[i] = gameLogic.dealCard(this.repertoryCard);
    }
};

//初始化游戏变量
pro.init = function () {
    // 游戏变量
    this.userCardIndexArr = [];  // 手牌
    this.betRecordList = {};//玩家下注记录

    //牌组初始化
    this.repertoryCard = gameLogic.CARD_DATA_ARRAY.slice();
};

pro.onEventGameStart = function (cb) {
    setTimeout(function () {
        if (!!cb) {
            cb();
        }
        logger.info('onEventGameStart');

        this.init();
        //洗牌
        gameLogic.randCardData(this.repertoryCard);
        //分配牌
        this.dealCard();
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

        //发送数据
        let data = {
            type: gameProto.GAME_START_PUSH
        };
        this.roomFrame.sendDataToAll(data);
        this.gameStatus = gameProto.gameStatus.GAME_STARTED;

        setTimeout(function () {
            this.gameStatus = gameProto.gameStatus.GAME_END;
            this.checkRobotWin();
            this.showResult();
        }.bind(this), gameProto.stakeTime * 1000);

        // 机器人下注
        this.robotOperation();
    }.bind(this), gameProto.gameStartDelayTime * 1000);
};

pro.checkRobotWin = function () {
    //检测机器人是否赢
    let robotWinRate = this.roomFrame.getCurRobotWinRate() * 100;
    if (robotWinRate > 0) {
        let num = Math.ceil(Math.random() * 100);
        //随即到机器人赢，则下注总额少的一方赢
        if (num < robotWinRate) {
            let redTotalBetCount = 0;
            let blackTotalBetCount = 0;
            for (let k in this.betRecordList) {
                if (this.betRecordList.hasOwnProperty(k)) {
                    let user = this.roomFrame.userArr[k];
                    if (!user || user.userInfo.robot) continue;
                    let betInfo = this.betRecordList[k];
                    redTotalBetCount += betInfo[gameProto.SCORE_RED];
                    blackTotalBetCount += betInfo[gameProto.SCORE_BLACK];
                }
            }

            let changeCards = false;
            //黑方胜
            if (redTotalBetCount > blackTotalBetCount) {
                if (gameLogic.compareCards(this.userCardIndexArr[gameProto.RED], this.userCardIndexArr[gameProto.BLACK])) {
                    changeCards = true;
                }
            }
            //红方胜
            else if (blackTotalBetCount > redTotalBetCount) {
                if (gameLogic.compareCards(this.userCardIndexArr[gameProto.BLACK], this.userCardIndexArr[gameProto.RED])) {
                    changeCards = true;
                }
            }

            //交换红黑方的手牌
            if (changeCards) {
                let tmpCards = this.userCardIndexArr[gameProto.RED];
                this.userCardIndexArr[gameProto.RED] = this.userCardIndexArr[gameProto.BLACK];
                this.userCardIndexArr[gameProto.BLACK] = tmpCards;
            }
        }
    }
};

pro.receivePlayerMessage = function (chairId, msg) {
    logger.info('receivePlayerMessage');
    logger.info(chairId, msg);

    let type = msg.type || null;
    let data = msg.data || null;
    if (!type) {
        return false;
    }

    switch (type) {
        case gameProto.GAME_OPERATE_STAKE_NOTIFY:
            return this.onUserStake(data, chairId);
    }
};

pro.onUserStake = function (data, chairId) {
    let user = this.roomFrame.getUserByChairId(chairId);
    if (!user) return false;
    let userBetInfo = this.betRecordList[user.userInfo.uid + ''] || [0, 0, 0];
    let totalBetCount = userBetInfo[0] + userBetInfo[1] + userBetInfo[2];
    if (totalBetCount + data.count > user.userInfo.gold){
        return false;
    }
    userBetInfo[data.betType] += data.count;
    this.betRecordList[user.userInfo.uid + ''] = userBetInfo;

    let pushData = {
        type: gameProto.GAME_OPERATE_STAKE_PUSH,
        data: {
            uid: user.userInfo.uid,
            count: data.count,
            betType: data.betType
        }
    };
    this.roomFrame.sendDataToAll(pushData);
};

pro.showResult = function () {
    let winner = gameProto.BLACK;
    let winnerCardType = gameLogic.getCardType(this.userCardIndexArr[gameProto.BLACK]);
    let winnerCards = this.userCardIndexArr[gameProto.BLACK];
    if (gameLogic.compareCards(this.userCardIndexArr[gameProto.RED], this.userCardIndexArr[gameProto.BLACK])) {
        winner = gameProto.RED;
        winnerCardType = gameLogic.getCardType(this.userCardIndexArr[gameProto.RED]);
        winnerCards = this.userCardIndexArr[gameProto.RED];
    }

    let cardsData = [];
    for (let i = 0; i < this.userCardIndexArr.length; i ++) {
        cardsData[i] = {
            cardType: gameLogic.getCardType(this.userCardIndexArr[i]),
            cards: this.userCardIndexArr[i]
        }
    }

    let scoreChangeArr = [];
    let luck = false;
    for (let k in this.betRecordList) {
        if (this.betRecordList.hasOwnProperty(k)) {
            let betInfo = this.betRecordList[k];
            let score = 0;
            let betCount = 0;
            betCount = betInfo[gameProto.SCORE_BLACK] + betInfo[gameProto.SCORE_RED] + betInfo[gameProto.SCORE_LUCK];
            //黑方胜
            if (winner === gameProto.BLACK) {
                score += betInfo[gameProto.SCORE_BLACK] * 2;
            //红方胜
            } else if (winner === gameProto.RED) {
                score += betInfo[gameProto.SCORE_RED] * 2;
            }
            //幸运一击
            switch (winnerCardType) {
                case gameProto.CARD_TYPE_BAO_ZI:
                    score += betInfo[gameProto.SCORE_LUCK] * (10 + 1);
                    luck = true;
                    break;
                case gameProto.CARD_TYPE_TONG_HUA_SHUN:
                    score += betInfo[gameProto.SCORE_LUCK] * (5 + 1);
                    luck = true;
                    break;
                case gameProto.CARD_TYPE_TONG_HUA:
                    score += betInfo[gameProto.SCORE_LUCK] * (3 + 1);
                    luck = true;
                    break;
                case gameProto.CARD_TYPE_SHUN_ZI:
                    score += betInfo[gameProto.SCORE_LUCK] * (2 + 1);
                    luck = true;
                    break;
                case gameProto.CARD_TYPE_DUI_ZI:
                    //大于等于9的对子
                    if (gameLogic.getCardLogicValue(winnerCards[1]) >= 9) {
                        score += betInfo[gameProto.SCORE_LUCK] * (1 + 1);
                        luck = true;
                    }
                    break;
            }

            score -= betCount;
            scoreChangeArr.push({uid: k, score: score, betCount: betCount});
        }
    }

    let dirData = {
        winner: winner,
        winnerCardType: winnerCardType
    };
    this.dirRecord.push(dirData);
    if (this.dirRecord.length > gameProto.DIR_COUNT) {
        this.dirRecord.shift();
    }

    let resultData = {
        type: gameProto.GAME_END_PUSH,
        data: {
            winType: winner,
            winnerCardType: winnerCardType,
            cardsData: cardsData,
            scoreChangeArr: scoreChangeArr,
            luck: luck
        }
    };

    this.roomFrame.sendDataToAll(resultData);
    this.roomFrame.concludeGame(scoreChangeArr);
};

pro.isUserEnableLeave = function (chairId) {
    if(this.gameStatus !== gameProto.gameStatus.GAME_STARTED) {
        return true;
    }
    let user = this.roomFrame.getUserByChairId(chairId);
    return !this.getUserBetInfoByUid(user.userInfo.uid);
};

pro.getUserBetInfoByUid = function (uid) {
    return this.betRecordList[uid + ''];
};

let CAN_BET_MIN_USER_GOLD = 50;
pro.robotOperation = function () {
    let self = this;
    function robotBet(user) {
        if (user.userInfo.gold < CAN_BET_MIN_USER_GOLD) return;
        setTimeout(function () {
            let rand = utils.getRandomNum(0, 10);
            let betType;
            if (rand === 0) betType = gameProto.SCORE_LUCK;
            else betType = rand % 2;

            let maxBetCount = 2000;
            if (betType === gameProto.SCORE_LUCK){
                maxBetCount = 300;
            }
            let betCount = utils.getRandomNum(1, user.userInfo.gold * 0.5 > maxBetCount ? maxBetCount: Math.floor(user.userInfo.gold * 0.5));
            self.onUserStake({
                count:betCount,
                betType: betType
            }, user.chairId);
        }, utils.getRandomNum(1000, (gameProto.stakeTime - 1.5) * 1000));
    }

    for (let key in this.roomFrame.userArr){
        if (this.roomFrame.userArr.hasOwnProperty(key)){
            let user = this.roomFrame.userArr[key];
            if(!user.userInfo.robot) continue;
            robotBet(user);
        }
    }
};

pro.onEventUserOffLine = function (chairId) {

};

pro.onEventUserLeave = function (chairId) {

};

pro.onUserGetGameData = function (data, chairId) {

};

pro.getEnterGameData = function () {
    return {
        gameStatus: this.gameStatus,
        betRecordList: this.betRecordList,
        dirRecord: this.dirRecord,
        profitPercentage: this.roomFrame.publicParameter.profitPercentage
    };
};

pro.getRecordData = function () {

};

pro.onGetCurrentScoreArr = function () {

};

pro.onGetFinalResoutData = function () {

};

pro.onEventRoomDismiss = function () {

};

pro.onEventGamePrepare = function () {

};