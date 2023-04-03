let exp = module.exports;
let gameProto = require('./GameProtoZJH');
let utils = require('../../util/utils');
let gameLogic = require('./gameLogic');

exp.getOperationResult = function (chairID, prepareWinnerChairID, round, userStatus, cardDataArr, currentStakeLevel, curMaxCardchairId, maxStakeLevel) {
    let randomNum = Math.ceil(Math.random() * 100);
    let compareChairId = -1;
    let operation = 'stake';
    if (round >= 2) {
        let playingUsers = [];
        for (let i = 0; i < userStatus.length; i ++) {
            if (userStatus[i] === gameProto.LOOK_CARD && i !==  chairID) playingUsers.push(i);
        }
        if (playingUsers.length > 0) compareChairId = playingUsers[utils.getRandomNum(0, playingUsers.length - 1)];
    }

    //如果是本局要赢的人，则不会弃牌
    if (prepareWinnerChairID >= 0 && prepareWinnerChairID === chairID) {
        if (randomNum > 80) operation = 'addStake';
        else if (randomNum > 50) operation = 'stake';
        else if (compareChairId >= 0 && randomNum > 25) operation = 'compare';
        else operation = 'look';
    } else {
        //根据牌型来定义机器人操作
        let cardType = gameLogic.getCardType(cardDataArr);
        switch (cardType) {
            case gameProto.CARD_TYPE_BAO_ZI://豹子和同花顺无论看牌不看牌都跟到底
            case gameProto.CARD_TYPE_TONG_HUA_SHUN:
            case gameProto.CARD_TYPE_TONG_HUA:
            case gameProto.CARD_TYPE_SHUN_ZI:
                if (randomNum > 70) operation = 'addStake';
                else if (randomNum > 50 && compareChairId >= 0) operation = 'compare';
                else if (randomNum > 25) operation = 'look';
                else operation = 'stake';
                break;
            case gameProto.CARD_TYPE_DUI_ZI://对子
                if (randomNum > 80) operation = 'addStake';
                else if (compareChairId >= 0 && randomNum > 50) operation = 'compare';
                else if (randomNum > 25) operation = 'look';
                else operation = 'stake';
                if ((round > utils.getRandomNum(3, 5) || currentStakeLevel >= utils.getRandomNum(3, 4)) && curMaxCardchairId !== chairID) {
                    if (compareChairId >= 0 && randomNum > 50) operation = 'compare';
                    else if (randomNum > 20) operation = 'giveUp';
                    else operation = 'stake';
                    if (currentStakeLevel >= 4)operation = 'giveUp';
                }
                break;
            case gameProto.CARD_TYPE_DAN_ZHANG://单张牌最多跟到第3轮看牌并弃牌
                if (randomNum > 40) operation = 'look';
                else operation = 'stake';

                if ((round > utils.getRandomNum(3, 5) || currentStakeLevel >= utils.getRandomNum(1, 2)) && curMaxCardchairId !== chairID) {
                    if (compareChairId >= 0 && randomNum > 60) operation = 'compare';
                    else if (randomNum > 20) operation = 'giveUp';
                    else operation = 'stake';
                    if (currentStakeLevel >= 3)operation = 'giveUp';
                }
                break;
        }
    }

    switch (operation) {
        case 'addStake':
            if (currentStakeLevel < maxStakeLevel) {
                return gameProto.userStakeNotify(currentStakeLevel + 1);
            } else {
                return gameProto.userStakeNotify(currentStakeLevel);
            }
            break;
        case 'stake':
            return gameProto.userStakeNotify(currentStakeLevel);
            break;
        case 'look':
            if (userStatus[chairID] === gameProto.LOOK_CARD){
                return exp.getOperationResult(chairID, prepareWinnerChairID, round, userStatus, cardDataArr, currentStakeLevel, curMaxCardchairId, maxStakeLevel);
            }
            return gameProto.userLookCardNotify();
            /*if (userStatus[chairID] !== gameProto.LOOK_CARD) {
                return gameProto.userLookCardNotify();
            }
            //this.checkAutoStake();*/
            break;
        case 'giveUp':
            // 未看牌的用户必须先看牌
            if (userStatus[chairID] !== gameProto.LOOK_CARD) {
                return gameProto.userLookCardNotify();
                /*this.onUserLook(null, this.currentUserchairId);
                this.checkAutoStake();*/
            } else {
                return gameProto.userGiveUpNotify();
            }
            break;
        case 'compare':
            return gameProto.userCompareNotify(compareChairId);
            break;
    }
};