let logic = module.exports;
let utils = require('../../util/utils');
let gameProto = require('./DDZProto');

//扑克数据
logic.CARD_DATA_ARRAY = [
    0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0x0C,0x0D,	//方块 A - K
    0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x1A,0x1B,0x1C,0x1D,	//梅花 A - K
    0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2A,0x2B,0x2C,0x2D,	//红桃 A - K
    0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3A,0x3B,0x3C,0x3D,	//黑桃 A - K
    0x4E,0x4F
];

//数值掩码
let MASK_COLOR = 				    0xF0;								//花色掩码
let MASK_VALUE =					0x0F;								//数值掩码


logic.getCardValue = function(cardData) {
    return cardData&MASK_VALUE;
};
//获取花色
logic.getCardColor = function(cardData) {
    return cardData&MASK_COLOR;
};
//逻辑数值
logic.getCardLogicValue = function (cardData) {
    //扑克属性
    let cardColor = this.getCardColor(cardData);
    let cardValue = this.getCardValue(cardData);

    if (cardValue <= 0 || cardValue > (MASK_VALUE&0x4f)){
        return 0;
    }

    //转换数值
    if (cardColor === 0x40) return cardValue+2;
    return (cardValue<=2)?(cardValue+13):cardValue;
};

logic.getCardLogicValueArr = function (cardDataArr) {
    let arr = [];
    for (let i = 0; i < cardDataArr.length; ++i){
        arr.push(logic.getCardLogicValue(cardDataArr[i]));
    }
    return arr;
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

logic.sortCardList = function (cardDataArr, isOrderByCount) {
    //数目过虑
    if (!cardDataArr || cardDataArr.length <= 1) return cardDataArr;
    let cardCount = cardDataArr.length;
    //转换数值
    let sortValueArr = [];
    for (let i = 0; i < cardDataArr.length; i++) {
        sortValueArr[i]= this.getCardLogicValue(cardDataArr[i]);
    }

    //排序操作
    for (let i = 0; i < cardCount; ++i){
        let sortValue = sortValueArr[i];
        let cardData = cardDataArr[i];
        for (let j = i+1; j < cardCount; ++j){
            if ((sortValueArr[j] > sortValue) || ((sortValue === sortValueArr[j]) && (cardDataArr[j] > cardData))){
                // 交换位置]
                sortValueArr[i] = sortValueArr[j];
                sortValueArr[j] = sortValue;
                sortValue = sortValueArr[i];
                cardDataArr[i] = cardDataArr[j];
                cardDataArr[j] = cardData;
                cardData = cardDataArr[i];
            }
        }
    }
    //数目排序
    if (!!isOrderByCount){
        //分析扑克
        let analyseResult = this.analyseCardDataArr(cardDataArr);

        cardDataArr = [];
        //拷贝四牌
        cardDataArr = cardDataArr.concat(analyseResult.fourCardData);

        //拷贝三牌
        cardDataArr = cardDataArr.concat(analyseResult.threeCardData);

        //拷贝对牌
        cardDataArr = cardDataArr.concat(analyseResult.doubleCardData);

        //拷贝单牌
        cardDataArr = cardDataArr.concat(analyseResult.singleCardData);
    }
    return cardDataArr;
};

logic.getCardType = function (cardDataArr) {
    if (!cardDataArr) return gameProto.cardType.ERROR;
    let cardCount = cardDataArr.length;
    //简单牌型
    switch (cardCount) {
        case 0:
        {
            return gameProto.cardType.ERROR;
        }
        case 1: //单牌
        {
            return gameProto.cardType.SINGLE;
        }
        case 2:	//对牌火箭
        {
            //牌型判断
            if ((cardDataArr[0] === 0x4F)&&(cardDataArr[1] === 0x4E)) return gameProto.cardType.MISSILE_CARD;
            if (this.getCardLogicValue(cardDataArr[0]) === this.getCardLogicValue(cardDataArr[1])) return gameProto.cardType.DOUBLE;

            return gameProto.cardType.ERROR;
        }
    }

    //分析扑克
    let analyseResult = this.analyseCardDataArr(cardDataArr);
    if (!analyseResult) return gameProto.cardType.ERROR;

    //四牌判断
    if (analyseResult.fourCardData.length > 0) {
        //牌型判断
        if ((analyseResult.fourCardData.length === 4)&&(cardCount === 4)) return gameProto.cardType.BOMB_CARD;
        if ((analyseResult.fourCardData.length === 4)&&(analyseResult.singleCardData.length === 2)&&(cardCount === 6)) return gameProto.cardType.FOUR_LINE_TAKE_ONE;
        if ((analyseResult.fourCardData.length === 4)&&(analyseResult.doubleCardData.length/2 === 2)&&(cardCount === 8)) return gameProto.cardType.FOUR_LINE_TAKE_TWO;
        return gameProto.cardType.ERROR;
    }

    //三牌判断
    if (analyseResult.threeCardData.length > 0) {
        let threeCount = analyseResult.threeCardData.length/3;
        //三条类型
        if(threeCount === 1 && cardCount === 3) return gameProto.cardType.THREE;
        //连牌判断
        if (threeCount > 1) {
            //变量定义
            let cardData = analyseResult.threeCardData[0];
            let firstLogicValue = this.getCardLogicValue(cardData);

            //错误过虑
            if (firstLogicValue >= 15) return gameProto.cardType.ERROR;

            //连牌判断
            for (let i = 1; i < threeCount; i++) {
                let tempCardData = analyseResult.threeCardData[i * 3];
                if (firstLogicValue !== (this.getCardLogicValue(tempCardData) + i)) return gameProto.cardType.ERROR;
            }
        }

        //牌形判断
        if (threeCount * 3 === cardCount) return gameProto.cardType.THREE_LINE;
        if (threeCount * 4 === cardCount) return gameProto.cardType.THREE_LINE_TAKE_ONE;
        if ((threeCount * 5 === cardCount)&&(analyseResult.doubleCardData.length/2 === threeCount)) return gameProto.cardType.THREE_LINE_TAKE_TWO;

        return gameProto.cardType.ERROR;
    }

    //两张类型
    if (analyseResult.doubleCardData.length/2 >= 3) {
        let doubleCount = analyseResult.doubleCardData.length/2;
        //变量定义
        let cardData = analyseResult.doubleCardData[0];
        let firstLogicValue = this.getCardLogicValue(cardData);

        //错误过虑
        if (firstLogicValue >= 15) return gameProto.cardType.ERROR;

        //连牌判断
        for (let i = 1; i < doubleCount; i++){
            let cardData = analyseResult.doubleCardData[i*2];
            if (firstLogicValue !== (this.getCardLogicValue(cardData)+i)) return gameProto.cardType.ERROR;
        }

        //二连判断
        if ((doubleCount*2) === cardCount) return gameProto.cardType.DOUBLE_LINE;

        return gameProto.cardType.ERROR;
    }

    //单张判断
    if ((analyseResult.singleCardData.length >= 5)&&(analyseResult.singleCardData.length === cardCount)) {
        //变量定义
        let cardData = analyseResult.singleCardData[0];
        let firstLogicValue = this.getCardLogicValue(cardData);

        //错误过虑
        if (firstLogicValue>=15) return gameProto.cardType.ERROR;

        //连牌判断
        for (let i = 1; i < analyseResult.singleCardData.length; i++){
            let cardData = analyseResult.singleCardData[i];
            if (firstLogicValue !== (this.getCardLogicValue(cardData)+i)) return gameProto.cardType.ERROR;
        }

        return gameProto.cardType.SINGLE_LINE;
    }
    return gameProto.cardType.ERROR;
};

logic.analyseCardDataArr = function (cardDataArr) {
    let cardCount = cardDataArr.length;
    let analyseResult = {
        fourCardData: [],
        threeCardData: [],
        doubleCardData: [],
        singleCardData: []
    };

    //扑克分析
    for (let i = 0; i < cardCount; i++) {
        //变量定义
        let sameCount = 1;
        let logicValue = this.getCardLogicValue(cardDataArr[i]);
        if(logicValue <= 0) return null;
        //搜索同牌
        for (let j=i+1; j < cardCount;j++){
            //获取扑克
            if (this.getCardLogicValue(cardDataArr[j]) !== logicValue) break;
            //设置变量
            sameCount++;
        }

        //设置结果
        switch (sameCount) {
            case 1:		//单张
            {
                analyseResult.singleCardData.push(cardDataArr[i]);
                break;
            }
            case 2:		//两张
            {
                analyseResult.doubleCardData.push(cardDataArr[i]);
                analyseResult.doubleCardData.push(cardDataArr[i + 1]);
                break;
            }
            case 3:		//三张
            {
                analyseResult.threeCardData.push(cardDataArr[i]);
                analyseResult.threeCardData.push(cardDataArr[i + 1]);
                analyseResult.threeCardData.push(cardDataArr[i + 2]);
                break;
            }
            case 4:		//四张
            {
                analyseResult.fourCardData.push(cardDataArr[i]);
                analyseResult.fourCardData.push(cardDataArr[i + 1]);
                analyseResult.fourCardData.push(cardDataArr[i + 2]);
                analyseResult.fourCardData.push(cardDataArr[i + 3]);
                break;
            }
        }

        //设置索引
        i+=(sameCount-1);
    }
    return analyseResult;
};

logic.compareCard = function (firstCardArr, nextCardArr) {
    //获取类型
    let nextType = this.getCardType(nextCardArr);
    //类型判断
    if (nextType === gameProto.cardType.ERROR) return false;
    if (nextType === gameProto.cardType.MISSILE_CARD) return true;

    let firstType = this.getCardType(firstCardArr);
    if (firstType === gameProto.cardType.MISSILE_CARD) return false ;

    //炸弹判断
    if ((firstType !== gameProto.cardType.BOMB_CARD)&&(nextType === gameProto.cardType.BOMB_CARD)) return true;
    if ((firstType === gameProto.cardType.BOMB_CARD)&&(nextType !== gameProto.cardType.BOMB_CARD)) return false;

    //规则判断
    if ((firstType !== nextType)||(firstCardArr.length !== nextCardArr.length)) return false;

    //开始对比
    switch (nextType) {
        case gameProto.cardType.SINGLE:
        case gameProto.cardType.DOUBLE:
        case gameProto.cardType.THREE:
        case gameProto.cardType.SINGLE_LINE:
        case gameProto.cardType.DOUBLE_LINE:
        case gameProto.cardType.THREE_LINE:
        case gameProto.cardType.BOMB_CARD: {
            //获取数值
            let nextLogicValue = this.getCardLogicValue(nextCardArr[0]);
            let firstLogicValue = this.getCardLogicValue(firstCardArr[0]);
            //对比扑克
            return nextLogicValue > firstLogicValue;
        }
        case gameProto.cardType.THREE_LINE_TAKE_ONE:
        case gameProto.cardType.THREE_LINE_TAKE_TWO: {
            //分析扑克
            let nextResult = this.analyseCardDataArr(nextCardArr);
            let firstResult = this.analyseCardDataArr(firstCardArr);
            //获取数值
            let nextLogicValue = this.getCardLogicValue(nextResult.threeCardData[0]);
            let firstLogicValue = this.getCardLogicValue(firstResult.threeCardData[0]);
            //对比扑克
            return nextLogicValue > firstLogicValue;
        }
        case gameProto.cardType.FOUR_LINE_TAKE_ONE:
        case gameProto.cardType.FOUR_LINE_TAKE_TWO: {
            //分析扑克
            let nextResult = this.analyseCardDataArr(nextCardArr);
            let firstResult = this.analyseCardDataArr(firstCardArr);
            //获取数值
            let nextLogicValue = this.getCardLogicValue(nextResult.fourCardData[0]);
            let firstLogicValue = this.getCardLogicValue(firstResult.fourCardData[0]);

            //对比扑克
            return nextLogicValue > firstLogicValue;
        }
    }
    return false;
};

logic.removeCard = function (removeCardArr, cardDataArr) {
    if (removeCardArr.length > cardDataArr.length) return false;

    let tempCardDataArr = cardDataArr.slice();

    //置零扑克
    let deleteCount = 0;
    for (let i = 0; i < removeCardArr.length; i++){
        for (let j = 0; j < cardDataArr.length; j++){
            if (removeCardArr[i] === tempCardDataArr[j]) {
                tempCardDataArr[j] = 0;
                deleteCount++;
                break;
            }
        }
    }
    if(deleteCount !== removeCardArr.length) return false;

    let index = 0;
    for(let i = 0; i < tempCardDataArr.length; ++i){
        if (tempCardDataArr[i] !== 0){
            cardDataArr[index++] = tempCardDataArr[i];
        }
    }
    cardDataArr.splice(index, cardDataArr.length - index);
    return true;
};

logic.removeCardByValue = function (removeCardValueArr, cardDataArr) {
    if (removeCardValueArr.length > cardDataArr.length) return false;

    let tempCardDataArr = cardDataArr.slice();

    //置零扑克
    let deleteCount = 0;
    for (let i = 0; i < removeCardValueArr.length; i++){
        let isDelete = false;
        for (let j = 0; j < cardDataArr.length; j++){
            if (removeCardValueArr[i] === this.getCardLogicValue(tempCardDataArr[j])) {
                tempCardDataArr[j] = 0;
                isDelete = true;
            }
        }
        if (isDelete) deleteCount++;
    }
    if(deleteCount !== removeCardValueArr.length) return false;

    let index = 0;
    for(let i = 0; i < tempCardDataArr.length; ++i){
        if (tempCardDataArr[i] !== 0){
            cardDataArr[index++] = tempCardDataArr[i];
        }
    }
    cardDataArr.splice(index, cardDataArr.length - index);
    return true;
};

//出牌搜索
logic.searchOutCard = function(handCardDataArr, turnCardDataArr) {
    let resultCardArr = [];

    //构造扑克
    let cardDataArr = handCardDataArr.slice();
    let cardCount = handCardDataArr.length;

    cardDataArr = this.sortCardList(cardDataArr);

    let turnCardCount = turnCardDataArr.length;

    //获取类型
    let turnOutCardType = this.getCardType(turnCardDataArr);

    //出牌分析
    switch (turnOutCardType) {
        case gameProto.cardType.ERROR: {
            return resultCardArr;
        }
        case gameProto.cardType.SINGLE:					//单牌类型
        case gameProto.cardType.DOUBLE:					//对牌类型
        case gameProto.cardType.THREE:					//三条类型
        {
            //获取数值
            let logicValue = this.getCardLogicValue(turnCardDataArr[0]);

            //分析扑克
            let analyseResult = this.analyseCardDataArr(cardDataArr);

            //寻找单牌
            if (turnCardCount <= 1) {
                for (let i = 0;i < analyseResult.singleCardData.length; i++) {
                    let index = analyseResult.singleCardData.length-i-1;
                    if (this.getCardLogicValue(analyseResult.singleCardData[index])>logicValue) {
                        //设置结果
                        resultCardArr.push(analyseResult.singleCardData[index]);
                        return resultCardArr;
                    }
                }
            }

            //寻找对牌
            if (turnCardCount <= 2) {
                for (let i=0;i<analyseResult.doubleCardData.length;i++){
                    let index=(analyseResult.doubleCardData.length/2-i-1)*2;
                    if (this.getCardLogicValue(analyseResult.doubleCardData[index])>logicValue) {
                        //设置结果
                        resultCardArr = analyseResult.doubleCardData.slice(index, index + turnCardCount);
                        return resultCardArr;
                    }
                }
            }

            //寻找三牌
            if (turnCardCount<=3) {
                for (let i=0;i<analyseResult.threeCardData.length;i++){
                    let index=(analyseResult.threeCardData.length/3-i-1)*3;
                    if (this.getCardLogicValue(analyseResult.threeCardData[index])>logicValue) {
                        //设置结果
                        resultCardArr = analyseResult.threeCardData.slice(index, index + turnCardCount);
                        return resultCardArr;
                    }
                }
            }

            break;
        }
        case gameProto.cardType.SINGLE_LINE:		//单连类型
        {
            //长度判断
            if (cardCount < turnCardCount) break;

            //获取数值
            let logicValue=this.getCardLogicValue(turnCardDataArr[0]);

            //搜索连牌
            for (let i=(turnCardCount-1);i<cardCount;i++){
                //获取数值
                let handLogicValue=this.getCardLogicValue(cardDataArr[cardCount-i-1]);

                //构造判断
                if (handLogicValue>=15) break;
                if (handLogicValue<=logicValue) continue;

                //搜索连牌
                let lineCount=0;
                for (let j=(cardCount-i-1);j<cardCount;j++){
                    if ((this.getCardLogicValue(cardDataArr[j])+lineCount)===handLogicValue) {
                        //增加连数
                        resultCardArr[lineCount++] = cardDataArr[j];
                        //完成判断
                        if (lineCount===turnCardCount) {
                            return resultCardArr;
                        }
                    }
                }
            }

            break;
        }
        case gameProto.cardType.DOUBLE_LINE:		//对连类型
        {
            //长度判断
            if (cardCount < turnCardCount) break;

            //获取数值
            let logicValue=this.getCardLogicValue(turnCardDataArr[0]);

            //搜索连牌
            for (let i=(turnCardCount-1);i<cardCount;i++){
                //获取数值
                let handLogicValue=this.getCardLogicValue(cardDataArr[cardCount-i-1]);

                //构造判断
                if (handLogicValue<=logicValue) continue;
                if ((handLogicValue>=15)) break;

                //搜索连牌
                let lineCount=0;
                for (let j=(cardCount-i-1);j<(cardCount-1);j++){
                    if (((this.getCardLogicValue(cardDataArr[j])+lineCount)===handLogicValue)
                        &&((this.getCardLogicValue(cardDataArr[j+1])+lineCount)===handLogicValue)) {
                        //增加连数
                        resultCardArr[lineCount * 2] = cardDataArr[j];
                        resultCardArr[lineCount * 2 + 1] = cardDataArr[j + 1];
                        lineCount++;
                        //完成判断
                        if (lineCount*2===turnCardCount) {
                            return resultCardArr;
                        }
                    }
                }
            }

            break;
        }
        case gameProto.cardType.THREE_LINE:				//三连类型
        case gameProto.cardType.THREE_LINE_TAKE_ONE:	//三带一单
        case gameProto.cardType.THREE_LINE_TAKE_TWO:	//三带一对
        {
            //长度判断
            if (cardCount<turnCardCount) break;

            //获取数值
            let logicValue=0;
            for (let i=0;i<turnCardCount-2;i++){
                logicValue=this.getCardLogicValue(turnCardDataArr[i]);
                if (this.getCardLogicValue(turnCardDataArr[i+1])!==logicValue) continue;
                if (this.getCardLogicValue(turnCardDataArr[i+2])!==logicValue) continue;
                break;
            }

            //属性数值
            let turnLineCount=0;
            if (turnOutCardType === gameProto.cardType.THREE_LINE_TAKE_ONE) turnLineCount=turnCardCount/4;
            else if (turnOutCardType === gameProto.cardType.THREE_LINE_TAKE_TWO) turnLineCount=turnCardCount/5;
            else turnLineCount=turnCardCount/3;

            //搜索连牌
            for (let i=turnLineCount*3-1;i<cardCount;i++){
                //获取数值
                let handLogicValue=this.getCardLogicValue(cardDataArr[cardCount-i-1]);
                //构造判断
                if (handLogicValue<=logicValue) continue;
                if ((turnLineCount>1)&&(handLogicValue>=15)) break;

                //搜索连牌
                let lineCount=0;
                for (let j=(cardCount-i-1);j<(cardCount-2);j++){
                    //三牌判断
                    if ((this.getCardLogicValue(cardDataArr[j])+lineCount)!==handLogicValue) continue;
                    if ((this.getCardLogicValue(cardDataArr[j+1])+lineCount)!==handLogicValue) continue;
                    if ((this.getCardLogicValue(cardDataArr[j+2])+lineCount)!==handLogicValue) continue;

                    //增加连数
                    resultCardArr[lineCount*3]=cardDataArr[j];
                    resultCardArr[lineCount*3+1]=cardDataArr[j+1];
                    resultCardArr[lineCount*3+2]=cardDataArr[j+2];
                    lineCount++;

                    //完成判断
                    if (lineCount === turnLineCount) {
                        //构造扑克
                        let leftCardDataArr = cardDataArr.slice();
                        this.removeCard(resultCardArr, leftCardDataArr);

                        //分析扑克
                        let analyseResultLeft = this.analyseCardDataArr(leftCardDataArr);

                        //单牌处理
                        if (turnOutCardType === gameProto.cardType.THREE_LINE_TAKE_ONE) {
                            //提取单牌
                            for (let k=0; k<analyseResultLeft.singleCardData.length; k++){
                                //中止判断
                                if (resultCardArr.length === turnCardCount) break;

                                //设置扑克
                                let index=analyseResultLeft.singleCardData.length-k-1;
                                let singleCard=analyseResultLeft.singleCardData[index];
                                resultCardArr.push(singleCard);
                            }

                            //提取对牌
                            for (let k=0; k < analyseResultLeft.doubleCardData.length;k++){
                                //中止判断
                                if (resultCardArr.length === turnCardCount) break;

                                //设置扑克
                                let index=(analyseResultLeft.doubleCardData.length-k-1);
                                let singleCard=analyseResultLeft.doubleCardData[index];
                                resultCardArr.push(singleCard);
                            }

                            //提取三牌
                            for (let k=0;k<analyseResultLeft.threeCardData.length;k++){
                                //中止判断
                                if (resultCardArr.length === turnCardCount) break;

                                //设置扑克
                                let index=(analyseResultLeft.threeCardData.length-k-1);
                                let singleCard=analyseResultLeft.threeCardData[index];
                                resultCardArr.push(singleCard);
                            }

                            //提取四牌
                            for (let k=0;k<analyseResultLeft.fourCardData.length;k++){
                                //中止判断
                                if (resultCardArr.length === turnCardCount) break;

                                //设置扑克
                                let index=(analyseResultLeft.fourCardData.length-k-1);
                                let singleCard=analyseResultLeft.fourCardData[index];
                                resultCardArr.push(singleCard);
                            }
                        }

                        //对牌处理
                        if (turnOutCardType === gameProto.cardType.THREE_LINE_TAKE_TWO) {
                            //提取对牌
                            for (let k=0;k<analyseResultLeft.doubleCardData.length;k++){
                                //中止判断
                                if (resultCardArr.length === turnCardCount) break;
                                //设置扑克
                                let index=(analyseResultLeft.doubleCardData.length/2-k-1)*2;
                                let cbCardData1=analyseResultLeft.doubleCardData[index];
                                let cbCardData2=analyseResultLeft.doubleCardData[index + 1];
                                resultCardArr.push(cbCardData1);
                                resultCardArr.push(cbCardData2);
                            }

                            //提取三牌
                            for (let k=0;k<analyseResultLeft.threeCardData.length;k++){
                                //中止判断
                                if (resultCardArr.length === turnCardCount) break;
                                //设置扑克
                                let index=(analyseResultLeft.threeCardData.length/3-k-1)*3;
                                let cbCardData1=analyseResultLeft.threeCardData[index];
                                let cbCardData2=analyseResultLeft.threeCardData[index + 1];
                                resultCardArr.push(cbCardData1);
                                resultCardArr.push(cbCardData2);
                            }

                            //提取四牌
                            for (let k=0;k<analyseResultLeft.fourCardData.length;k++){
                                //中止判断
                                if (resultCardArr.length === turnCardCount) break;

                                //设置扑克
                                let index=(analyseResultLeft.fourCardData.length/4-k-1)*4;
                                let cbCardData1=analyseResultLeft.fourCardData[index];
                                let cbCardData2=analyseResultLeft.fourCardData[index + 1];
                                resultCardArr.push(cbCardData1);
                                resultCardArr.push(cbCardData2);
                            }
                        }

                        //完成判断
                        if (resultCardArr.length === turnCardCount) return resultCardArr;
                    }
                }
            }

            break;
        }
    }

    //搜索炸弹
    if ((cardCount>=4)&&(turnOutCardType!== gameProto.cardType.MISSILE_CARD)) {
        //变量定义
        let logicValue=0;
        if (turnOutCardType===gameProto.cardType.BOMB_CARD) logicValue=this.getCardLogicValue(turnCardDataArr[0]);

        //搜索炸弹
        for (let i=3;i<cardCount;i++){
            //获取数值
            let handLogicValue=this.getCardLogicValue(cardDataArr[cardCount-i-1]);

            //构造判断
            if (handLogicValue<=logicValue) continue;

            //炸弹判断
            let j = 1;
            for (j=1;j<4;j++) {
                if (this.getCardLogicValue(cardDataArr[cardCount+j-i-1])!==handLogicValue) break;
            }
            if (j!==4) continue;

            //设置结果
            resultCardArr = [];
            resultCardArr[0]=cardDataArr[cardCount-i-1];
            resultCardArr[1]=cardDataArr[cardCount-i];
            resultCardArr[2]=cardDataArr[cardCount-i+1];
            resultCardArr[3]=cardDataArr[cardCount-i+2];
            return resultCardArr;
        }
    }

    //搜索火箭
    if ((cardCount>=2)&&(cardDataArr[0]===0x4F)&&(cardDataArr[1]===0x4E)) {
        //设置结果
        resultCardArr = [];
        resultCardArr[0]=cardDataArr[0];
        resultCardArr[1]=cardDataArr[1];
        return resultCardArr;
    }
    return [];
};