let gameProto = require('./gameProto');

let gameLogic = module.exports = {};

//扑克数据
gameLogic.CARD_DATA_ARRAY = [
    0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0x0C,0x0D,	//方块 A - K
    0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x1A,0x1B,0x1C,0x1D,	//梅花 A - K
    0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2A,0x2B,0x2C,0x2D,	//红桃 A - K
    0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3A,0x3B,0x3C,0x3D	//黑桃 A - K
];

//逻辑掩码
gameLogic.LOGIC_MASK_VALUE = 0x0F;
gameLogic.LOGIC_MASK_COLOR = 0xF0;

gameLogic.COUNT = 3;//玩家手牌数量

/**
 * 混乱牌
 * @param cardDataArr
 */
gameLogic.randCardData = function(cardDataArr){
    let tempCardDataArr = cardDataArr.slice();

    let maxCount = cardDataArr.length;
    let randCount = 0;
    let pos = 0;
    // 混乱牌
    do{
        pos = Math.floor(Math.random() * (maxCount - randCount));
        cardDataArr[randCount++] = tempCardDataArr[pos];
        tempCardDataArr[pos] = tempCardDataArr[maxCount - randCount];
    }while(randCount < maxCount);
};

gameLogic.dealCard = function (cardDataArr) {
    this.leftCardCount = cardDataArr.length - 1;
    this.leftCardCount -= this.COUNT;

    let cardIndexArr = cardDataArr.splice(this.leftCardCount, this.COUNT);

    return this.sortCardList(cardIndexArr);
};
/**
 * 排序规则：
 * 1、数值从大到小
 * 2、同数值按照花色黑红梅方
 * @param cardIndexArr
 */
gameLogic.sortCardList = function (cardIndexArr) {
    let self = this;
    cardIndexArr.sort(function (a, b) {
        if (self.getCardLogicValue(a) === self.getCardLogicValue(b)) {
            return self.getCardColorValue(a) < self.getCardColorValue(b);
        } else {
            return self.getCardLogicValue(a) < self.getCardLogicValue(b);
        }
    });

    return cardIndexArr;
};

/**
 * 返回值true,主家赢，false，被比的人赢
 * @param cardIndexArr
 * @param compareCardIndexArr
 * @returns {boolean}
 */
gameLogic.compareCards = function (cardIndexArr, compareCardIndexArr) {
    if (cardIndexArr.length === 0) {
        return false;
    }

    if (compareCardIndexArr.length === 0) {
        return true;
    }

    let cardType = this.getCardType(cardIndexArr);
    let cardLogicValue = this.getCardLogicValueArr(cardIndexArr);
    let compareCardType = this.getCardType(compareCardIndexArr);
    let compareCardLogicValue = this.getCardLogicValueArr(compareCardIndexArr);

    //若逻辑值数相等，则不论是什么牌型，都需要按另一个规则定大小
    let allEquals = true;
    for (let i = 0; i < cardLogicValue.length; i ++) {
        if (cardLogicValue[i] === compareCardLogicValue[i]){
        } else {
            allEquals = false;
        }
    }
    if (allEquals) {
        return this.compareOtherRule(cardIndexArr, compareCardIndexArr);
    }

    //同类型但数值不相等
    if (cardType === compareCardType) {
        switch(cardType) {
            case gameProto.CARD_TYPE_BAO_ZI:
            case gameProto.CARD_TYPE_TONG_HUA_SHUN:
            case gameProto.CARD_TYPE_TONG_HUA:
            case gameProto.CARD_TYPE_SHUN_ZI:
            case gameProto.CARD_TYPE_DAN_ZHANG: {
                for (let j = 0; j < cardLogicValue.length; j ++) {
                    if (cardLogicValue[j] === compareCardLogicValue[j]) {
                    } else {
                        return cardLogicValue[j] > compareCardLogicValue[j];
                    }
                }
                break;
            }

            case gameProto.CARD_TYPE_DUI_ZI: {
                //对子先对比对子的大小，再对比单张的大小
                if (cardLogicValue[1] === compareCardLogicValue[1]) {
                    for (let k = 0; k < cardLogicValue.length; k ++) {
                        if (cardLogicValue[k] === compareCardLogicValue[k]) {
                        } else {
                            return cardLogicValue[k] > compareCardLogicValue[k];
                        }
                    }
                } else {
                    return cardLogicValue[1] > compareCardLogicValue[1];
                }
                break;
            }
        }
    }

    //特殊处理：235比豹子大
    // if (cardType === gameProto.CARD_TYPE_ZASE_235 && compareCardType === gameProto.CARD_TYPE_BAO_ZI) {
    //     return true;
    // } else if (cardType === gameProto.CARD_TYPE_BAO_ZI && compareCardType === gameProto.CARD_TYPE_ZASE_235) {
    //     return false;
    // }

    return cardType > compareCardType;
};

//当牌型相同且数值相等时，则根据规则来定谁的大小，这个规则根据地方规则的不同可以自由定义
gameLogic.compareOtherRule = function (cardIndexArr, compareCardIndexArr) {
    //先开牌的人输
    // return false;

    //花色 黑红梅方 排序
    return this.getCardColorValue(cardIndexArr[0]) > this.getCardColorValue(compareCardIndexArr[0]);
};

gameLogic.getCardType = function (cardIndexArr) {
    let logicValue = this.getCardLogicValueArr(cardIndexArr);
    let colorValue = this.getCardColorValueArr(cardIndexArr);

    //豹子、对子、同花判断
    let isBaoZi = true;
    let isDuiZi = false;
    let isTongHua = true;
    for (let i = 0; i < cardIndexArr.length - 1; i ++) {
        if (logicValue[i] === logicValue[i + 1]) {
            isDuiZi = true;
        } else {
            isBaoZi = false;
        }

        if (colorValue[i] === colorValue[i + 1]) {
        } else {
            isTongHua = false;
        }
    }
    if (isBaoZi) {
        return gameProto.CARD_TYPE_BAO_ZI;
    } else if (isDuiZi) {
        return gameProto.CARD_TYPE_DUI_ZI;
    }

    //顺子
    let isShunZi = true;
    for (let j = 0; j < cardIndexArr.length - 1; j ++) {
        if ((logicValue[j] - logicValue[j + 1]) === 1) {
        } else {
            isShunZi = false;
        }
    }
    //特殊A32顺子
    if (logicValue[0] === 14 && logicValue[1] === 3 && logicValue[2] === 2) {
        isShunZi = true;
    }

    if (isShunZi && isTongHua) {
        return gameProto.CARD_TYPE_TONG_HUA_SHUN;
    } else if (isShunZi) {
        return gameProto.CARD_TYPE_SHUN_ZI;
    } else if (isTongHua) {
        return gameProto.CARD_TYPE_TONG_HUA;
    }

    //杂色235判断
    // if (logicValue[0] === 2 && logicValue[1] === 3 && logicValue[2] === 5) {
    //     return gameProto.CARD_TYPE_ZASE_235;
    // }

    return gameProto.CARD_TYPE_DAN_ZHANG;
};

gameLogic.getCardLogicValueArr = function (cardData) {
    let arr = [];
    for (let i = 0; i < cardData.length; i ++) {
        arr.push(this.getCardLogicValue(cardData[i]));
    }
    return arr;
};

gameLogic.getCardColorValueArr = function (cardData) {
    let arr = [];
    for (let i = 0; i < cardData.length; i ++) {
        arr.push(this.getCardColorValue(cardData[i]));
    }
    return arr;
};

gameLogic.getCardLogicValue = function (cardData) {
    let cardLogicValue = (cardData & this.LOGIC_MASK_VALUE);
    return (cardLogicValue === 1)? (cardLogicValue + 13): cardLogicValue;
};

gameLogic.getCardColorValue = function (cardData) {
    return (cardData & this.LOGIC_MASK_COLOR);
};