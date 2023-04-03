let logic = module.exports;
let utils = require('../../util/utils');
let gameProto = require('./DZProto');

//扑克数据
logic.CARD_DATA_ARRAY = [
    0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0x0C,0x0D,	//方块 A - K
    0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x1A,0x1B,0x1C,0x1D,	//梅花 A - K
    0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2A,0x2B,0x2C,0x2D,	//红桃 A - K
    0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3A,0x3B,0x3C,0x3D,	//黑桃 A - K
];

//数值掩码
let MASK_COLOR =                    0xF0;                               // 花色掩码
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
    return (cardValue === 1)?(cardValue+13):cardValue;
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

//排列扑克
logic.sortCardList = function(cardDataArr) {
    cardDataArr.sort(function (a, b) {
        let aLogicValue = logic.getCardLogicValue(a);
        let bLogicValue = logic.getCardLogicValue(b);
        if (aLogicValue !== bLogicValue) return bLogicValue - aLogicValue;
        else{
            return b - a;
        }
    });
};

//获取类型
logic.getCardType = function(cardDataArr){
    let isSameColor = true;
    let isLineCard = true;
    let firstColor = logic.getCardColor(cardDataArr[0]);
    let firstValue=logic.getCardLogicValue(cardDataArr[0]);

    //牌形分析
    for (let i=1;i < cardDataArr.length; i++){
        //数据分析
        if (isSameColor && (logic.getCardColor(cardDataArr[i]) !== firstColor)) isSameColor=false;
        if (isLineCard && (firstValue !== (logic.getCardLogicValue(cardDataArr[i])+i))) isLineCard=false;
        //结束判断
        if (!isSameColor && !isLineCard) break;
    }

    //最小同花顺
    if(!isLineCard && (firstValue === 14)) {
        for (let i = 1; i < cardDataArr.length; i++) {
            let logicValue = logic.getCardLogicValue(cardDataArr[i]);
            if ((firstValue !== (logicValue+i+8))) break;
            if( i === cardDataArr.length - 1) isLineCard =true;
        }
    }

    //皇家同花顺
    if (isSameColor && isLineCard && (logic.getCardLogicValue(cardDataArr[1]) === 13 )) return gameProto.cardType.KING_TONG_HUA_SHUN;
    //顺子类型
    if (!isSameColor && isLineCard) return gameProto.cardType.SHUN_ZI;
    //同花类型
    if (isSameColor && !isLineCard) return gameProto.cardType.TONG_HUA;
    //同花顺类型
    if (isSameColor && isLineCard) return gameProto.cardType.TONG_HUA_SHUN;
    //扑克分析
    let analyseResult = logic.analyseCardData(cardDataArr);

    //类型判断
    if (analyseResult.fourCount === 1) return gameProto.cardType.TIE_ZHI;
    if (analyseResult.doubleCount === 2) return gameProto.cardType.TWO_DOUBLE;
    if ((analyseResult.doubleCount === 1) && (analyseResult.threeCount === 1)) return gameProto.cardType.HU_LU;
    if ((analyseResult.threeCount === 1) && (analyseResult.doubleCount === 0)) return gameProto.cardType.THREE;
    if ((analyseResult.doubleCount === 1) && (analyseResult.singleCount === 3)) return gameProto.cardType.ONE_DOUBLE;
    return gameProto.cardType.SINGLE;
};

//分析扑克
logic.analyseCardData = function(cardDataArr){
    let result = {
        singleCount: 0,
        singleLogicValue: [],
        doubleCount: 0,
        doubleLogicValue: [],
        threeCount: 0,
        threeLogicValue: [],
        fourCount: 0,
        fourLogicValue: []
    };
    //扑克分析
    for (let i = 0; i < cardDataArr.length; i++){
        //变量定义
        let sameCount = 1;
        let sameCardData = [cardDataArr[i],0,0,0];
        let logicValue = logic.getCardLogicValue(cardDataArr[i]);
        //获取同牌
        for (let j = i+1; j < cardDataArr.length; j++){
            //逻辑对比
            if (logic.getCardLogicValue(cardDataArr[j])!== logicValue) break;
            //设置扑克
            sameCardData[sameCount++]=cardDataArr[j];
        }
        //保存结果
        switch (sameCount) {
            case 1:{
                result.singleCount++;
                result.singleLogicValue.push(logic.getCardLogicValue(sameCardData[0]));
                break;
            }
            case 2: {
                result.doubleCount++;
                result.doubleLogicValue.push(logic.getCardLogicValue(sameCardData[0]));
                break;
            }
            case 3: {
                result.threeCount++;
                result.threeLogicValue.push(logic.getCardLogicValue(sameCardData[0]));
                break;
            }
            case 4: {
                result.fourCount++;
                result.fourLogicValue.push(logic.getCardLogicValue(sameCardData[0]));
                break;
            }
        }
        //设置递增
        i+=(sameCount-1);
    }
    return result;
};

//最大牌型
logic.fiveFromSeven = function(handCardDataArr, centerCardDataArr) {
    let tempCardDataArr = handCardDataArr.concat(centerCardDataArr);
    if (tempCardDataArr.length < 5) {
        console.error("fiveFromSeven err count < 5");
    }
    //排列扑克
    logic.sortCardList(tempCardDataArr);

    // 获取组合index
    let combinationFlagArrs = utils.getCombinationFlagArrs(tempCardDataArr.length, 5);
    // 检索最大组合
    let maxCardType = -1;
    let maxCardDataArr = [];
    for (let i = 0; i < combinationFlagArrs.length; ++i){
        let arr = combinationFlagArrs[i];
        let cardData = [];
        for (let j = 0; j < arr.length; ++j){
            if (!arr[j]) continue;
            cardData.push(tempCardDataArr[j]);
        }
        let cardType = logic.getCardType(cardData);
        if (maxCardType < cardType){
            maxCardType = cardType;
            maxCardDataArr = cardData;
        }else if (maxCardType === cardType){
            if (logic.compareCard(cardData, maxCardDataArr) === 2){
                maxCardType = cardType;
                maxCardDataArr = cardData;
            }
        }
    }
    return maxCardDataArr;
};

//对比扑克
logic.compareCard = function(firstDataArr, nextDataArr) {
    if (firstDataArr.length !== nextDataArr.length){
        console.error("compareCard err: card count err");
        return 0;
    }
    //获取类型
    let nextType = logic.getCardType(nextDataArr);
    let firstType = logic.getCardType(firstDataArr);
    //类型判断
    //大
    if(firstType > nextType) return 2;
    //小
    if(firstType < nextType) return 1;
    //简单类型
    switch(firstType) {
        case gameProto.cardType.SINGLE: {
            for (let i = 0; i < firstDataArr.length; i++) {
                let nextValue = logic.getCardLogicValue(nextDataArr[i]);
                let firstValue = logic.getCardLogicValue(firstDataArr[i]);
                // 大
                if(firstValue > nextValue) return 2;
                // 小
                else if(firstValue <nextValue) return 1;
                // 平
                else if(i === firstDataArr.length -1) return 0;
            }
            break;
        }
        case gameProto.cardType.ONE_DOUBLE:
        case gameProto.cardType.TWO_DOUBLE:
        case gameProto.cardType.THREE:
        case gameProto.cardType.TIE_ZHI:
        case gameProto.cardType.HU_LU: {
            //分析扑克
            let analyseResultNext = logic.analyseCardData(nextDataArr);
            let analyseResultFirst = logic.analyseCardData(firstDataArr);
            //四条数值
            if (analyseResultFirst.fourCount > 0) {
                let nextValue = analyseResultNext.fourLogicValue[0];
                let firstValue = analyseResultFirst.fourLogicValue[0];
                //比较四条
                if(firstValue !== nextValue) return (firstValue > nextValue)?2:1;
                //比较单牌
                firstValue = analyseResultFirst.singleLogicValue[0];
                nextValue = analyseResultFirst.singleLogicValue[0];
                if(firstValue !== nextValue) return (firstValue > nextValue)?2:1;
                else return 0;
            }
            //三条数值
            if (analyseResultFirst.threeCount>0) {
                let nextValue = analyseResultNext.threeLogicValue[0];
                let firstValue = analyseResultFirst.threeLogicValue[0];
                //比较三条
                if(firstValue !== nextValue) return (firstValue > nextValue)?2:1;
                //葫芦牌型
                if(gameProto.cardType.HU_LU === firstType) {
                    //比较对牌
                    firstValue = analyseResultFirst.doubleLogicValue[0];
                    nextValue = analyseResultFirst.doubleLogicValue[0];
                    if(firstValue !== nextValue) return (firstValue > nextValue)?2:1;
                    else return 0;
                } else {
                    //散牌数值
                    for (let i = 0; i < analyseResultFirst.singleLogicValue.length; i++) {
                        let nextValue = analyseResultNext.singleLogicValue[i];
                        let firstValue = analyseResultFirst.singleLogicValue[i];
                        //大
                        if(firstValue > nextValue) return 2;
                        //小
                        else if(firstValue < nextValue) return 1;
                        //等
                        else if (i === (analyseResultFirst.singleCount - 1)) return 0
                    }
                }
            }

            //对子数值
            for (let i = 0; i  < analyseResultFirst.doubleCount; i++) {
                let nextValue = analyseResultNext.doubleLogicValue[i];
                let firstValue = analyseResultFirst.doubleLogicValue[i];
                //大
                if(firstValue > nextValue) return 2;
                //小
                else if(firstValue <nextValue) return 1;
            }

            //比较单牌
            {
                //散牌数值
                for (let i = 0; i < analyseResultFirst.singleCount; i++) {
                    let nextValue = analyseResultNext.singleLogicValue[i];
                    let firstValue = analyseResultFirst.singleLogicValue[i];
                    // 大
                    if(firstValue > nextValue) return 2;
                    // 小
                    else if(firstValue <nextValue) return 1;
                    // 等
                    else if (i === (analyseResultFirst.singleCount - 1)) return 0
                }
            }
            break;
        }
        case gameProto.cardType.SHUN_ZI:
        case gameProto.cardType.TONG_HUA_SHUN: {
            // 数值判断
            let nextValue = logic.getCardLogicValue(nextDataArr[0]);
            let firstValue = logic.getCardLogicValue(firstDataArr[0]);

            let isFirstmin = (firstValue ===(logic.getCardLogicValue(firstDataArr[1])+9));
            let isNextmin = (nextValue ===(logic.getCardLogicValue(nextDataArr[1])+9));

            //大小顺子
            if (isFirstmin && !isNextmin) return 1;
            //大小顺子
            else if (!isFirstmin && isNextmin) return 2;
            //等同顺子
            else {
                //平
                if(firstValue === nextValue)return 0;
                return (firstValue > nextValue)?2:1;
            }
        }
        case gameProto.cardType.TONG_HUA:{
            //散牌数值
            for (let i=0; i < firstDataArr.length; i++){
                let nextValue = logic.getCardLogicValue(nextDataArr[i]);
                let firstValue = logic.getCardLogicValue(firstDataArr[i]);
                // 大
                if(firstValue > nextValue) return 2;
                // 小
                else if(firstValue <nextValue) return 1;
                // 平
                else if(i === firstDataArr.length -1) return 0;
            }
        }
    }
    return  0;
};

logic.selectMaxUser = function(allUserCardArr) {
    let winnerList = [];
    //First数据
    let winnerID;
    for (let i = 0; i < allUserCardArr.length; i++){
        if(!!allUserCardArr[i]) {
            winnerID=i;
            break;
        }
        //过滤全零
        if (i === allUserCardArr.length - 1) return winnerList;
    }
    //查找最大用户
    for(let i = winnerID + 1; i < allUserCardArr.length; i++){
        if(!allUserCardArr[i])continue;
        if(logic.compareCard(allUserCardArr[i],allUserCardArr[winnerID]) > 1) {
            winnerID = i;
        }
    }

    //查找相同数据
    winnerList.push(winnerID);
    for(let i = 0; i < allUserCardArr.length; i++){
        if(i === winnerID || !allUserCardArr[i])continue;
        if(logic.compareCard(allUserCardArr[i], allUserCardArr[winnerID]) === 0) {
            winnerList.push(i);
        }
    }
    return winnerList;
};

logic.getKeyCardArr = function (cardDataArr) {
    if (cardDataArr.length < 5) return;
    let cardType = logic.getCardType(cardDataArr);
    // 单牌显示最大的一张
    switch (cardType){
        case gameProto.cardType.SINGLE:
            let maxCardData = cardDataArr[0];
            for (let i = 1; i < cardDataArr.length; ++i){
                if (logic.getCardLogicValue(maxCardData) < logic.getCardLogicValue(cardDataArr[i])){
                    maxCardData = cardDataArr[i];
                }
            }
            return [maxCardData];
            break;
        case gameProto.cardType.ONE_DOUBLE:
        case gameProto.cardType.TWO_DOUBLE:
        case gameProto.cardType.THREE:
        case gameProto.cardType.TIE_ZHI:
            let result = {
                singleCardData: [],
                doubleCardData: [],
                threeCardData: [],
                fourCardData: []
            };
            //扑克分析
            for (let i = 0; i < cardDataArr.length; i++){
                //变量定义
                let sameCount = 1;
                let sameCardData = [cardDataArr[i],0,0,0];
                let logicValue = logic.getCardLogicValue(cardDataArr[i]);
                //获取同牌
                for (let j = i+1; j < cardDataArr.length; j++){
                    //逻辑对比
                    if (logic.getCardLogicValue(cardDataArr[j])!== logicValue) break;
                    //设置扑克
                    sameCardData[sameCount++]=cardDataArr[j];
                }
                //保存结果
                switch (sameCount) {
                    case 1:{
                        result.singleCardData.push(sameCardData[0]);
                        break;
                    }
                    case 2: {
                        result.doubleCardData.push(sameCardData[0]);
                        result.doubleCardData.push(sameCardData[1]);
                        break;
                    }
                    case 3: {
                        result.threeCardData.push(sameCardData[0]);
                        result.threeCardData.push(sameCardData[1]);
                        result.threeCardData.push(sameCardData[2]);
                        break;
                    }
                    case 4: {
                        result.fourCardData.push(sameCardData[0]);
                        result.fourCardData.push(sameCardData[1]);
                        result.fourCardData.push(sameCardData[2]);
                        result.fourCardData.push(sameCardData[3]);
                        break;
                    }
                }
                //设置递增
                i+=(sameCount-1);
            }
            if (cardType === gameProto.cardType.ONE_DOUBLE || cardType === gameProto.cardType.TWO_DOUBLE){
                return result.doubleCardData;
            }else if (cardType === gameProto.cardType.THREE){
                return result.threeCardData;
            }else if (cardType === gameProto.cardType.TIE_ZHI){
                return result.fourCardData;
            }
            break;
        default:
            return cardDataArr;
    }
};