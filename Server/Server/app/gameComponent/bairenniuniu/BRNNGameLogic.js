var logic = module.exports;
let utils = require('../../util/utils');
var gameProto = require('./BRNNProto');

//扑克数据
logic.CARD_DATA_ARRAY = [
    0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0x0C,0x0D,	//方块 A - K
    0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x1A,0x1B,0x1C,0x1D,	//梅花 A - K
    0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2A,0x2B,0x2C,0x2D,	//红桃 A - K
    0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3A,0x3B,0x3C,0x3D	//黑桃 A - K
];

//数值掩码
let MASK_COLOR =                    0x0E;                               // 花色掩码
let MASK_VALUE =					0x0F;								//数值掩码

//获取数值
logic.getCardValue = function(cardData) {
    return cardData&MASK_VALUE;
};
//获取花色
logic.getCardColor = function(cardData) {
    return cardData&MASK_COLOR;
};

//逻辑数值
logic.getCardLogicValue = function(cardData){
    //扑克属性
    let cardValue = logic.getCardValue(cardData);
    //转换数值
    return (cardValue > 10)?10 : cardValue;
};

/* 获取牌 */
logic.getRandCardList= function() {
    let tempCardDataArr = this.CARD_DATA_ARRAY.slice();
    let cardDataArr = [];

    let maxCount = tempCardDataArr.length;
    let randCount = 0;
    let pos = 0;
    // 混乱牌
    do{
        pos = Math.floor(Math.random() * (maxCount - randCount));
        cardDataArr[randCount++] = tempCardDataArr[pos];
        tempCardDataArr[pos] = tempCardDataArr[maxCount - randCount];
    }while(randCount < maxCount);
    return cardDataArr;
};

// 获取牌的配型
logic.getCardType = function (cardDataArr) {
    if (this.isWuXiaoNiu(cardDataArr)) return gameProto.cardType.WU_XIAO_NIU;
    if (this.isZhanDanNiu(cardDataArr)) return gameProto.cardType.ZHA_DAN_NIU;
    let sum = 0, rate = 0;
    let hasRate = false;
    let cardArr = [];
    for(let i = 0; i < cardDataArr.length; ++i) {
        cardArr[i] = this.getCardLogicValue(cardDataArr[i]);
        sum += cardArr[i];
    }
    for(let i = 0; i < cardArr.length; ++i) {
        for(let j = i+1; j < cardArr.length; ++j) {
            for(let k = j+1; k < cardArr.length; ++k) {
                if((cardArr[i] + cardArr[j] + cardArr[k]) % 10 === 0) {
                    hasRate = true;
                    rate = (sum - cardArr[i] - cardArr[j] - cardArr[k]) % 10;
                    break;
                }
            }
        }
    }
    if(rate === 0 && hasRate) rate = 10;

    if (rate < 10) return rate;
    else{
        // 判断是否是五花牛
        if (this.isWuHuaNiu(cardDataArr)) return gameProto.cardType.WU_HUA_NIU;
        // 判断是否是四花牛
        if (this.isSiHuaNiu(cardDataArr)) return gameProto.cardType.SI_HUA_NIU;
    }
    return gameProto.cardType.NIU_NIU;
};

// 排序扑克牌，三张组成10的放前面
logic.sortCard  = function (cardDataArr) {
    let hasRate = false;
    let indexArr = [];
    let cardArr = [];
    for(let i = 0; i < cardDataArr.length; ++i) {
        cardArr[i] = this.getCardLogicValue(cardDataArr[i]);
    }
    for(let i = 0; i < cardDataArr.length; ++i) {
        for(let j = i+1; j < cardDataArr.length; ++j) {
            for(let k = j+1; k < cardDataArr.length; ++k) {
                if((cardArr[i] + cardArr[j] + cardArr[k]) % 10 === 0) {
                    hasRate = true;
                    indexArr = [i, j, k];
                    break;
                }
            }
        }
    }
    if (!hasRate) return;
    for (let i = 0; i < 5; ++i){
        if (indexArr.indexOf(i) === -1){
            indexArr.push(i);
        }
    }
    let tempCardDataArr = cardDataArr.slice();
    for (let i = 0; i < indexArr.length; ++i){
        cardDataArr[i] = tempCardDataArr[indexArr[i]];
    }
};

logic.isWuXiaoNiu = function (cardDataArr) {
    let totalCount = 0;
    for (let i = 0; i< cardDataArr.length; ++i){
        let logicValue = this.getCardLogicValue(cardDataArr[i])
        if (logicValue >= 5) return false;
        totalCount += logicValue;
    }
    return totalCount <= 10;
};

logic.isZhanDanNiu = function (cardDataArr) {
    let card1 = cardDataArr[0], card2 = cardDataArr[1];
    let count1 = 0, count2 = 0;
    for(let i = 0; i < cardDataArr.length; ++i) {
        if(this.getCardValue(cardDataArr[i]) === this.getCardValue(card1)) ++count1;
        if(this.getCardValue(cardDataArr[i]) === this.getCardValue(card2)) ++count2;
    }
    return ((count1 >= 4) || (count2 >= 4));
};

logic.isWuHuaNiu = function (cardDataArr) {
    for (let i = 0; i < cardDataArr.length; ++i){
        if (this.getCardValue(cardDataArr[i]) <= 10) return false;
    }
    return true;
};

logic.isSiHuaNiu = function (cardDataArr) {
    let huaCount = 0;
    let tenCount = 0;
    for (let i = 0; i < cardDataArr.length; ++i){
        let cardValue = this.getCardValue(cardDataArr[i]);
        if (cardValue < 10) return false;
        else if (cardValue === 0) tenCount++;
        else if (cardValue > 10) huaCount++;
    }
    return (huaCount === 4 && tenCount === 1);
};

// 获取最大的牌
logic.getMaxSingleCard = function (cardDataArr) {
    let maxCardData = cardDataArr[0];
    for (let i = 1; i < cardDataArr.length; ++i){
        if (!this.compareSingleCard(maxCardData, cardDataArr[i])){
            maxCardData = cardDataArr[i]
        }
    }
    return maxCardData;
};

logic.compareSingleCard = function (firstCard, nextCard) {
    let firstCardValue = this.getCardValue(firstCard);
    let nextCardValue = this.getCardValue(nextCard);
    if (firstCardValue === nextCardValue){
        let firstCardColor = this.getCardColor(firstCard);
        let nextCardColor = this.getCardColor(nextCard);
        return firstCardColor > nextCardColor;
    }else{
        return firstCardValue > nextCardValue;
    }
};

// 比较牌的大小
logic.compareCard = function(firstCardArr, nextCardArr){
    let firstCardType = this.getCardType(firstCardArr);
    let nextCardType = this.getCardType(nextCardArr);
    if (firstCardType === nextCardType){
        let firstMaxCard = this.getMaxSingleCard(firstCardArr);
        let nextMaxCard = this.getMaxSingleCard(nextCardArr);
        return this.compareSingleCard(firstMaxCard, nextMaxCard);
    }else{
        return firstCardType > nextCardType;
    }
};

// 获取倍数
logic.getWinTimes = function (cardType) {
    if (cardType <= gameProto.cardType.NIU_6) return 1;
    else if (cardType <= gameProto.cardType.NIU_9) return 2;
    return 3
};