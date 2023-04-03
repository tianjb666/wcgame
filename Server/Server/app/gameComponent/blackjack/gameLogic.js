let logic = module.exports;
let utils = require('../../util/utils');

//扑克数据
logic.CARD_DATA_ARRAY = [
    0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0x0C,0x0D,	//方块 A - K
    0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x1A,0x1B,0x1C,0x1D,	//梅花 A - K
    0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2A,0x2B,0x2C,0x2D,	//红桃 A - K
    0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3A,0x3B,0x3C,0x3D,	//黑桃 A - K
];

//数值掩码
let MASK_VALUE =					0x0F;								//数值掩码


logic.getCardValue = function(cardData) {
    let value = cardData&MASK_VALUE;
    if (value >= 10) value = 10;
    if (value === 1) value = 11;
    return value;
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

logic.getCardPoint = function (cardDataArr) {  
    let count = 0;
    let ACardCount = 0;
    for (let i = 0; i < cardDataArr.length; ++i){
        let value = logic.getCardValue(cardDataArr[i]);
        if (value === 11 && (cardDataArr[i]&MASK_VALUE) === 1){
            ACardCount += 1;
        }
        count += value;
    }
    if (count > 21){
        count -= ACardCount * 10;
    }
    return count;
};

logic.isBurst = function (cardDataArr) {  
    let point = logic.getCardPoint(cardDataArr);
    return point > 21;
};

logic.isBlackJack = function(cardDataArr){
    if (!cardDataArr) return false;
    if (cardDataArr.length !== 2) return false;
    return this.getCardPoint(cardDataArr) === 21;
};

logic.isCanCutCard = function (cardDataArr) {  
    if (cardDataArr.length !== 2) return false;
    return logic.getCardValue(cardDataArr[0]) === logic.getCardValue(cardDataArr[1]);
};

// -1庄家赢，1闲家赢，0平局
logic.deduceWiner = function(bankerCardArr, idleCardArr){
    let bankerPoint = logic.getCardPoint(bankerCardArr);
    let idle = logic.getCardPoint(idleCardArr);
    if (idle > 21){
        return -1;
    }
    if(bankerPoint > 21){
        return 1;
    }
    if (idle > bankerPoint) return 1;
    if (idle === bankerPoint) return 0;
    if (idle < bankerPoint) return -1;
};