var logic = module.exports;
let utils = require('../../util/utils');
var gameProto = require('./LHDProto');

//扑克数据
logic.CARD_DATA_ARRAY = [
    0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0x0C,0x0D,	//方块 A - K
    0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x1A,0x1B,0x1C,0x1D,	//梅花 A - K
    0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2A,0x2B,0x2C,0x2D,	//红桃 A - K
    0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3A,0x3B,0x3C,0x3D	//黑桃 A - K
];

/* 获取牌 */
logic.getCards= function() {
	let card1, card2;
	do {
		card1 = logic.CARD_DATA_ARRAY[utils.getRandomNum(0, logic.CARD_DATA_ARRAY.length - 1)];
        card2 = logic.CARD_DATA_ARRAY[utils.getRandomNum(0, logic.CARD_DATA_ARRAY.length - 1)];
	}while(card1 === card2);
	return [card1, card2];
};

logic.getCardsEx = function (winType) {
    let card1, card2;
    do{
        card1 = logic.CARD_DATA_ARRAY[utils.getRandomNum(0, logic.CARD_DATA_ARRAY.length - 1)];
        card2 = logic.CARD_DATA_ARRAY[utils.getRandomNum(0, logic.CARD_DATA_ARRAY.length - 1)];
    }while ((card1 & 0x0F) === (card2 & 0x0F))
    if (winType === gameProto.LONG){
        if ((card1&0x0F) < (card2&0x0F)){
            let temp = card2;
            card2 = card1;
            card1 = temp;
        }
    }else if (winType === gameProto.HU){
        if ((card1&0x0F) > (card2&0x0F)){
            let temp = card2;
            card2 = card1;
            card1 = temp;
        }
    }
    return [card1, card2];
};

// 比较牌大小
logic.getWinType = function(longCardData, huCardData) {
    let numberLong = longCardData & 0x0F;
    let numberHu = huCardData & 0x0F;
    let temp = numberLong - numberHu;
    if (temp === 0){
        return gameProto.HE;
    }else if (temp > 0){
        return gameProto.LONG;
    }else if (temp < 0){
        return gameProto.HU;
    }
};