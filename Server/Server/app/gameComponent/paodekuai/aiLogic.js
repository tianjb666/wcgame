let logic = module.exports;
let gameProto = require('./PDKProto');
let gameLogic = require('./PDKGameLogic');
let utils = require('../../util/utils');

let MAX_COUNT = 16;
let GAME_PLAYER = 3;

logic.reSortCard = function (allUserCardArr, robotArr) {
    let robotCount = 0;
    for (let i = 0; i < robotArr.length; ++i){
        if (robotArr[i]){
            robotCount++;
            break;
        }
    }
    if (robotCount === 0 || robotCount === 3) return;
    let tmp;
    if (robotCount === 1){
        tmp = 0;
    }else{
        tmp = 4;
    }
    let index = 0;
    for (let i = 0; i < allUserCardArr.length; ++i){
        let score = this.landScore(i, 0, allUserCardArr);
        if (robotCount === 1){
            if (score > tmp) {
                tmp = score;
                index = i;
            }
        }else{
            if (score < tmp){
                tmp = score;
                index = i;
            }
        }
    }
    // 将最大的牌给机器人
    if (robotCount === 1){
        for(let i = 0; i < robotArr.length; ++i){
            if (!!robotArr[i]){
                if (index === i) return;
                let temp = allUserCardArr[i];
                allUserCardArr[i] = allUserCardArr[index];
                allUserCardArr[index] = temp;
            }
        }
    }
    // 最小的牌个玩家
    else{
        for(let i = 0; i < robotArr.length; ++i){
            if (!robotArr[i]){
                if (index === i) return;
                let temp = allUserCardArr[i];
                allUserCardArr[i] = allUserCardArr[index];
                allUserCardArr[index] = temp;
            }
        }
    }
};

logic.landScore = function(meChairID, currentLandScore, allUserCardDataArr){
    //大牌数目
    let largeCardCount = 0 ;
    let index=0 ;
    let cardDataArr = allUserCardDataArr[meChairID];
    while(index < cardDataArr.length) {
        if (gameLogic.getCardLogicValue(cardDataArr[index])>=15) ++largeCardCount ;
        index++;
    }

    //单牌个数
    let singleCardCount=this.analyseSingleCardCount(cardDataArr, null) ;

    // 获取炸弹数量
    let allBombCard = logic.getAllBombCard(cardDataArr);
    let bombCount = Math.ceil(allBombCard.length/4);

    //叫3分
    if(largeCardCount + bombCount>=4 && singleCardCount<=4) {
        return 3 ;
    }
    //叫2分
    if(largeCardCount + bombCount >= 3 && currentLandScore<=5 && currentLandScore < 2) return 2;

    // 叫1分
    if(largeCardCount + bombCount >= 2 && currentLandScore <= 5 && currentLandScore < 1) return 1;

    //放弃叫分
    return 0 ;
};
//出牌搜索
logic.searchOutCard = function(handCardDataArr, turnCardDataArr, nextCardDataArr) {
    //初始变量
    let outCardResult;

    //先出牌
    if(turnCardDataArr.length ===0) {
        outCardResult = this.outCardActive(handCardDataArr, nextCardDataArr);
    }
    //压牌
    else {
        outCardResult = this.outCardPassive(handCardDataArr, turnCardDataArr, nextCardDataArr) ;
    }

    return outCardResult ;
};

//分析单牌
logic.getAllSingleCard = function(handCardDataArr) {
    let tmpCardDataArr = gameLogic.sortCardList(handCardDataArr.slice());
    let singleCardDataArr = [];
    //扑克分析
    for (let i = 0; i < handCardDataArr.length; i++){
        //变量定义
        let sameCount=1;
        let logicValue=gameLogic.getCardLogicValue(tmpCardDataArr[i]);
        //搜索同牌
        for (let j = i+1; j < handCardDataArr.length; j++){
            //获取扑克
            if (gameLogic.getCardLogicValue(tmpCardDataArr[j])!== logicValue) break;
            //设置变量
            sameCount++;
            if(sameCount > 1) break;
        }
        if(sameCount === 1) singleCardDataArr.push(tmpCardDataArr[i]);

        //设置索引
        i += (sameCount-1);
    }
    return singleCardDataArr;
};

//分析对子
logic.getAllDoubleCard = function(handCardDataArr) {
    let tmpCardDataArr = gameLogic.sortCardList(handCardDataArr.slice());
    let doubleCardDataArr = [];
    //扑克分析
    for (let i=0;i<handCardDataArr.length;i++){
        let sameCount = 1;
        let logicValue=gameLogic.getCardLogicValue(tmpCardDataArr[i]);

        for (let j = i+1; j < handCardDataArr.length; ++j){
            //搜索同牌
            if (gameLogic.getCardLogicValue(tmpCardDataArr[j]) !== logicValue) break;
            sameCount++;
        }
        if (sameCount >= 2){
            doubleCardDataArr.push(tmpCardDataArr[i]);
            doubleCardDataArr.push(tmpCardDataArr[i+1]);
        }
        i += (sameCount-1);
    }
    return doubleCardDataArr;
};

//分析三条
logic.getAllThreeCard = function(handCardDataArr) {
    let tmpCardDataArr = gameLogic.sortCardList(handCardDataArr.slice());
    let threeCardDataArr = [];
    //扑克分析
    for (let i=0;i<handCardDataArr.length-2;i++){
        let sameCount=1;
        let logicValue=gameLogic.getCardLogicValue(tmpCardDataArr[i]);
        //搜索同牌
        for (let j=i+1;j<=i+3 && j<handCardDataArr.length;j++){
            //获取扑克
            if (gameLogic.getCardLogicValue(tmpCardDataArr[j]) !== logicValue) break;
            sameCount++;
        }
        if (sameCount >= 3){
            threeCardDataArr.push(tmpCardDataArr[i]);
            threeCardDataArr.push(tmpCardDataArr[i + 1]);
            threeCardDataArr.push(tmpCardDataArr[i + 2]);
        }
        i += (sameCount - 1);
    }
    return threeCardDataArr;
};

//分析顺子
logic.getAllLineCard = function(handCardDataArr){
    let temCardDataArr = gameLogic.sortCardList(handCardDataArr.slice());
    let lineCardDataArr = [];
    //数据校验
    if(handCardDataArr.length<5) return lineCardDataArr;
    let firstCard = 0 ;
    //去除2
    for(let i=0 ; i<handCardDataArr.length ; ++i){
        if(gameLogic.getCardLogicValue(temCardDataArr[i])<15)	{
            firstCard = i;
            break;
        }
    }
    let singleLineCardDataArr = [];
    let findSingleLine = true ;
    //连牌判断
    while ((temCardDataArr.length + firstCard)>=5 && findSingleLine) {
        findSingleLine = false ;
        singleLineCardDataArr = [temCardDataArr[firstCard]];
        let lastCard = temCardDataArr[firstCard];
        for (let i=firstCard+1; i<temCardDataArr.length; i++){
            let cardData=temCardDataArr[i];
            let logicValueDiff = gameLogic.getCardLogicValue(lastCard) - gameLogic.getCardLogicValue(cardData);
            if (logicValueDiff > 0){
                lastCard = cardData;
                // 非连续
                if (logicValueDiff > 1){
                    if(singleLineCardDataArr.length<5) {
                        singleLineCardDataArr = [lastCard];
                    } else{
                        break;
                    }
                }
                // 连续
                else{
                    singleLineCardDataArr.push(lastCard);
                }
            }
        }
        //保存数据
        if(singleLineCardDataArr.length>=5) {
            gameLogic.removeCard(singleLineCardDataArr, temCardDataArr);
            lineCardDataArr = lineCardDataArr.concat(singleLineCardDataArr);
            findSingleLine = true ;
        }
    }
    return lineCardDataArr;
};

//分析炸弹
logic.getAllBombCard = function(handCardDataArr) {
    let boomCardArr = [];
    if(handCardDataArr.length < 4) return boomCardArr;
    //大小排序
    let temCardDataArr = gameLogic.sortCardList(handCardDataArr.slice());
    //扑克分析
    for (let i=0; i < handCardDataArr.length - 3;i++){
        //变量定义
        let sameCount = 1;
        let logicValue = gameLogic.getCardLogicValue(temCardDataArr[i]);
        //搜索同牌
        for (let j=i+1;j<=i+3 && j < handCardDataArr.length;j++) {
            //获取扑克
            if (gameLogic.getCardLogicValue(temCardDataArr[j]) !== logicValue) break;
            sameCount++;
        }
        if (sameCount === 4) {
            boomCardArr.push(temCardDataArr[i]);
            boomCardArr.push(temCardDataArr[i + 1]);
            boomCardArr.push(temCardDataArr[i + 2]);
            boomCardArr.push(temCardDataArr[i + 3]);
        }
    }
    return boomCardArr;
};

// 获取所有单张类型
logic.getAllSingleCardType = function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.SINGLE,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };
    let handCardCount = handCardDataArr.length;
    for(let i=0; i<handCardCount; ++i){
        if(!!turnCardData && turnCardData.length > 0){
            if (gameLogic.getCardLogicValue(handCardDataArr[i]) <= gameLogic.getCardLogicValue(turnCardData[0])) continue;
        }
        let index = cardTypeResult.cardTypeCount ;
        cardTypeResult.cardDataArr[index] = [];
        cardTypeResult.cardType = gameProto.cardType.SINGLE ;
        cardTypeResult.cardDataArr[index][0] = handCardDataArr[i] ;
        cardTypeResult.eachHandCardCount[index] = 1 ;
        cardTypeResult.cardTypeCount++;
    }
    return cardTypeResult;
};

// 获取所有对子类型
logic.getAllDoubleCardType = function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.DOUBLE,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };
    let doubleCardDataArr = this.getAllDoubleCard(handCardDataArr) ;

    for(let i=0; i<doubleCardDataArr.length; i+=2){
        if (!!turnCardData && turnCardData.length > 0){
            if (gameLogic.getCardLogicValue(doubleCardDataArr[i]) <= gameLogic.getCardLogicValue(turnCardData[0])) continue;
        }
        let index = cardTypeResult.cardTypeCount ;
        cardTypeResult.cardDataArr[index] = [];
        cardTypeResult.cardType = gameProto.cardType.DOUBLE ;
        cardTypeResult.cardDataArr[index][0] = doubleCardDataArr[i] ;
        cardTypeResult.cardDataArr[index][1] = doubleCardDataArr[i+1] ;
        cardTypeResult.eachHandCardCount[index] = 2 ;
        cardTypeResult.cardTypeCount++ ;
    }
    return cardTypeResult;
};

// 获取单连类型
logic.getAllLineCardType = function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.SINGLE_LINE,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };
    let turnFirstCardLogicValue = !turnCardData?0:gameLogic.getCardLogicValue(turnCardData[0]);
    //恢复扑克，防止分析时改变扑克
    let tmpCardDataArr = handCardDataArr.slice();
    let handCardCount = tmpCardDataArr.length;
    let firstCard = 0 ;
    //去除2
    for(let i=0 ; i<handCardCount ; ++i){
        if(gameLogic.getCardLogicValue(tmpCardDataArr[i])<15) {
            firstCard = i ;
            break ;
        }
    }
    let singleLineCardArr = [];
    let leftCardCount = handCardCount ;
    let isFindSingleLine = true ;

    //连牌判断
    while ((leftCardCount + firstCard)>=5 && isFindSingleLine) {
        isFindSingleLine = false ;
        let lastCard = tmpCardDataArr[firstCard] ;
        singleLineCardArr = [lastCard];
        for (let i=firstCard+1; i<leftCardCount; i++){
            let cardData = tmpCardDataArr[i];
            let logicValueDiff = gameLogic.getCardLogicValue(lastCard)-gameLogic.getCardLogicValue(cardData);
            if (logicValueDiff !== 0) {
                lastCard = tmpCardDataArr[i] ;
                if (logicValueDiff !== 1){
                    //连续判断
                    if(singleLineCardArr.length<5) {
                        singleLineCardArr = [lastCard]
                    }
                    else break ;
                }else{
                    singleLineCardArr.push(lastCard);
                }
            }
        }

        //保存数据
        if(singleLineCardArr.length>=5 && (!turnCardData || (turnCardData.length <= singleLineCardArr.length))) {
            let index ;
            //所有连牌
            let curLineCount = 5;
            let curLineIndex = 0;
            while (curLineCount <= singleLineCardArr.length) {
                if (!!turnCardData && turnCardData.length > 0){
                    if (curLineCount !== turnCardData.length){
                        curLineIndex++;
                        if (curLineIndex + curLineCount > singleLineCardArr.length){
                            curLineIndex = 0;
                            curLineCount++;
                        }
                        continue;
                    }
                    if(gameLogic.getCardLogicValue(singleLineCardArr[curLineIndex]) <= turnFirstCardLogicValue){
                        curLineIndex = 0;
                        curLineCount++;
                        continue;
                    }
                }
                index = cardTypeResult.cardTypeCount ;
                if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                cardTypeResult.cardType = gameProto.cardType.SINGLE_LINE ;
                cardTypeResult.cardDataArr[index] = singleLineCardArr.slice(curLineIndex, curLineIndex + curLineCount);
                cardTypeResult.eachHandCardCount[index] = curLineCount;
                cardTypeResult.cardTypeCount++ ;

                curLineIndex++;
                if (curLineIndex + curLineCount > singleLineCardArr.length){
                    curLineIndex = 0;
                    curLineCount++;
                }
            }

            gameLogic.removeCard(singleLineCardArr, tmpCardDataArr) ;
            leftCardCount -= singleLineCardArr.length;
            isFindSingleLine = true ;
        }
    }
    return cardTypeResult;
};

// 获取对连类型
logic.getAllDoubleLineCardType = function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.DOUBLE_LINE,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };

    let turnFirstCardLogicValue = !turnCardData?0:gameLogic.getCardLogicValue(turnCardData[0]);

    //恢复扑克，防止分析时改变扑克
    let tmpCardDataArr = handCardDataArr.slice();
    let handCardCount = tmpCardDataArr.length;

    //连牌判断
    let firstCard = 0;
    //去除2
    for(let i=0 ; i<handCardCount ; ++i)	{
        if(gameLogic.getCardLogicValue(tmpCardDataArr[i])<15){
            firstCard = i ;
            break ;
        }
    }

    let leftCardCount = handCardCount-firstCard ;
    let isFindDoubleLine = true ;
    let doubleLineCount = 0 ;
    let doubleLineCard = [];
    //开始判断
    while (leftCardCount>=4 && isFindDoubleLine) {
        let lastCard = tmpCardDataArr[firstCard] ;
        let sameCount = 1 ;
        doubleLineCount = 0 ;
        isFindDoubleLine=false ;
        for(let i=firstCard+1 ; i<leftCardCount+firstCard ; ++i){
            //搜索同牌
            while (gameLogic.getCardLogicValue(lastCard)===gameLogic.getCardLogicValue(tmpCardDataArr[i]) && i<leftCardCount+firstCard) {
                ++sameCount;
                ++i ;
            }

            let lastDoubleCardValue = 0;
            if(doubleLineCount>0) lastDoubleCardValue = gameLogic.getCardLogicValue(doubleLineCard[doubleLineCount-1]) ;
            //重新开始
            if((sameCount<2 || (doubleLineCount>0 && (lastDoubleCardValue-gameLogic.getCardLogicValue(lastCard))!==1)) && i<=leftCardCount+firstCard) {
                if(doubleLineCount>=4) break ;
                //回退
                if(sameCount>=2) i-=sameCount ;
                lastCard = tmpCardDataArr[i] ;
                doubleLineCount = 0 ;
            }
            //保存数据
            else if(sameCount>=2) {
                doubleLineCard[doubleLineCount] = tmpCardDataArr[i-sameCount];
                doubleLineCard[doubleLineCount+1] = tmpCardDataArr[i-sameCount+1];
                doubleLineCount += 2 ;

                //结尾判断
                if(i===(leftCardCount+firstCard-2))
                    if((gameLogic.getCardLogicValue(lastCard)-gameLogic.getCardLogicValue(tmpCardDataArr[i]))===1 && (gameLogic.getCardLogicValue(tmpCardDataArr[i])===gameLogic.getCardLogicValue(tmpCardDataArr[i+1]))) {
                        doubleLineCard[doubleLineCount] = tmpCardDataArr[i] ;
                        doubleLineCard[doubleLineCount+1] = tmpCardDataArr[i+1] ;
                        doubleLineCount += 2 ;
                        break ;
                    }

            }
            lastCard = tmpCardDataArr[i] ;
            sameCount = 1 ;
        }

        //保存数据
        if(doubleLineCount>=4) {
            let index ;

            //所有连牌
            let currentDoubleLineCount = 4 ;
            let currentDoubleLineIndex = 0;
            while ( currentDoubleLineCount <= doubleLineCount ) {
                if (!!turnCardData && turnCardData.length > 0){
                    if (currentDoubleLineCount !== turnCardData.length){
                        currentDoubleLineIndex+=2;
                        if (currentDoubleLineIndex + currentDoubleLineCount > doubleLineCount){
                            currentDoubleLineIndex = 0;
                            currentDoubleLineCount+=2;
                        }
                        continue;
                    }
                    if(gameLogic.getCardLogicValue(doubleLineCard[currentDoubleLineIndex]) <= turnFirstCardLogicValue){
                        currentDoubleLineIndex = 0;
                        currentDoubleLineCount+=2;
                        continue;
                    }
                }

                index = cardTypeResult.cardTypeCount;
                if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                cardTypeResult.cardType = gameProto.cardType.DOUBLE_LINE ;
                cardTypeResult.cardDataArr[index] = doubleLineCard.slice(currentDoubleLineIndex, currentDoubleLineIndex + currentDoubleLineCount);
                cardTypeResult.eachHandCardCount[index] = currentDoubleLineCount;
                cardTypeResult.cardTypeCount++;

                currentDoubleLineIndex+=2;
                if (currentDoubleLineIndex + currentDoubleLineCount > doubleLineCount){
                    currentDoubleLineIndex = 0;
                    currentDoubleLineCount += 2 ;
                }
            }

            gameLogic.removeCard(doubleLineCard, tmpCardDataArr);
            isFindDoubleLine=true ;
            leftCardCount -= doubleLineCount ;
        }
    }
    return cardTypeResult;
};

// 获取三连类型
logic.getAllThreeLineCardType = function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.THREE_LINE,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };
    let turnFirstCardLogicValue = !turnCardData?0:gameLogic.getCardLogicValue(turnCardData[0]);
    //恢复扑克，防止分析时改变扑克
    let tmpCardDataArr = handCardDataArr.slice();
    let handCardCount = tmpCardDataArr.length;
    //连牌判断
    let firstCard = 0 ;
    //去除2和王
    for(let i=0 ; i<handCardCount ; ++i)	if(gameLogic.getCardLogicValue(tmpCardDataArr[i])<15)	{firstCard = i ; break ;}

    let leftCardCount = handCardCount-firstCard ;
    let isFindThreeLine = true ;
    let threeLineCount = 0 ;
    let threeLineCardArr = [] ;
    //开始判断
    while (leftCardCount>=6 && isFindThreeLine) {
        let lastCard = tmpCardDataArr[firstCard] ;
        let sameCount = 1 ;
        threeLineCount = 0 ;
        isFindThreeLine = false ;
        for(let i=firstCard+1 ; i<leftCardCount+firstCard ; ++i){
            //搜索同牌
            while (gameLogic.getCardLogicValue(lastCard)===gameLogic.getCardLogicValue(tmpCardDataArr[i]) && i<leftCardCount+firstCard) {
                ++sameCount;
                ++i ;
            }

            let lastThreeCardValue ;
            if(threeLineCount>0) lastThreeCardValue = gameLogic.getCardLogicValue(threeLineCardArr[threeLineCount-1]) ;

            //重新开始
            if((sameCount<3 || (threeLineCount>0&&(lastThreeCardValue-gameLogic.getCardLogicValue(lastCard))!==1)) && i<=leftCardCount+firstCard) {
                if(threeLineCount>=6) break ;
                if(sameCount>=3) i-=sameCount ;
                lastCard = tmpCardDataArr[i] ;
                threeLineCount = 0 ;
            }
            //保存数据
            else if(sameCount>=3) {
                threeLineCardArr[threeLineCount] = tmpCardDataArr[i-sameCount] ;
                threeLineCardArr[threeLineCount+1] = tmpCardDataArr[i-sameCount+1] ;
                threeLineCardArr[threeLineCount+2] = tmpCardDataArr[i-sameCount+2] ;
                threeLineCount += 3 ;

                //结尾判断
                if(i===(leftCardCount+firstCard-3))
                    if((gameLogic.getCardLogicValue(lastCard)-gameLogic.getCardLogicValue(tmpCardDataArr[i]))===1 && (gameLogic.getCardLogicValue(tmpCardDataArr[i])===gameLogic.getCardLogicValue(tmpCardDataArr[i+1])) && (gameLogic.getCardLogicValue(tmpCardDataArr[i])===gameLogic.getCardLogicValue(tmpCardDataArr[i+2]))) {
                        threeLineCardArr[threeLineCount] = tmpCardDataArr[i] ;
                        threeLineCardArr[threeLineCount+1] = tmpCardDataArr[i+1] ;
                        threeLineCardArr[threeLineCount+2] = tmpCardDataArr[i+2] ;
                        threeLineCount += 3 ;
                        break ;
                    }

            }
            lastCard = tmpCardDataArr[i];
            sameCount = 1 ;
        }

        //保存数据
        if(threeLineCount>=6) {
            let index ;

            //所有连牌
            let currentCount = 6 ;
            let currentIndex = 0;
            while ( currentCount <= threeLineCount ) {
                if (!!turnCardData && turnCardData.length > 0) {
                    if (currentCount !== turnCardData.length) {
                        currentIndex += 3;
                        if (currentIndex + currentCount > threeLineCount) {
                            currentIndex = 0;
                            currentCount += 3;
                        }
                        continue;
                    }
                    if (gameLogic.getCardLogicValue(threeLineCardArr[currentIndex]) <= turnFirstCardLogicValue) {
                        currentIndex = 0;
                        currentCount += 3;
                        continue;
                    }
                }

                index = cardTypeResult.cardTypeCount;
                if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                cardTypeResult.cardType = gameProto.cardType.THREE_LINE;
                cardTypeResult.cardDataArr[index] = threeLineCardArr.slice(currentIndex, currentIndex + currentCount);
                cardTypeResult.eachHandCardCount[index] = currentCount;
                cardTypeResult.cardTypeCount++;

                currentIndex += 3;
                if (currentIndex + currentCount > threeLineCount) {
                    currentIndex = 0;
                    currentCount += 3;
                }
            }

            gameLogic.removeCard(threeLineCardArr, tmpCardDataArr) ;
            isFindThreeLine=true ;
            leftCardCount -= threeLineCount ;
        }
    }
    return cardTypeResult;
};

// 获取三带1类型
logic.getAllThreeLineTakeOneCardType = function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.THREE_LINE_TAKE_ONE,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };

    let turnFirstCardLogicValue = 0;
    let turnCardThree;
    if (!!turnCardData){
        turnCardThree = this.getAllThreeCard(turnCardData);
        turnFirstCardLogicValue = gameLogic.getCardLogicValue(turnCardThree[0]);
    }

    //恢复扑克，防止分析时改变扑克
    let tmpCardDataArr = handCardDataArr.slice();

    //移除炸弹
    let allBomCardDataArr = this.getAllBombCard(tmpCardDataArr);
    gameLogic.removeCard(allBomCardDataArr, tmpCardDataArr);

    let handThreeCardArr = this.getAllThreeCard(tmpCardDataArr);
    let handThreeCount=handThreeCardArr.length;
    if (!turnCardData || (turnCardData.length === 4)) {
        let index ;
        //去掉三条
        let remainCardDataArr = tmpCardDataArr.slice();
        gameLogic.removeCard(handThreeCardArr, remainCardDataArr);
        let remainCardCount = remainCardDataArr.length;
        //三条带一张
        for(let i=0; i<handThreeCount; i+=3){
            if (!!turnCardData && (gameLogic.getCardLogicValue(handThreeCardArr[i])<=turnFirstCardLogicValue)) continue;
            //三条带一张
            for(let j=0; j<remainCardCount; ++j) {
                index = cardTypeResult.cardTypeCount ;
                if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                cardTypeResult.cbCardType = gameProto.cardType.THREE_LINE_TAKE_ONE ;
                cardTypeResult.cardDataArr[index][0] = handThreeCardArr[i] ;
                cardTypeResult.cardDataArr[index][1] = handThreeCardArr[i+1] ;
                cardTypeResult.cardDataArr[index][2] = handThreeCardArr[i+2] ;
                cardTypeResult.cardDataArr[index][3] = remainCardDataArr[j] ;
                cardTypeResult.eachHandCardCount[index] = 4 ;
                cardTypeResult.cardTypeCount++ ;
            }
        }
    }

    //三连带单
    let leftThreeCardCount=handThreeCount ;
    let isFindThreeLine=true ;
    let lastIndex=0 ;
    if(gameLogic.getCardLogicValue(handThreeCardArr[0])===15) lastIndex=3 ;
    while (leftThreeCardCount + lastIndex>=6 && isFindThreeLine) {
        let lastLogicCard=gameLogic.getCardLogicValue(handThreeCardArr[lastIndex]);
        let threeLineCard = [];
        let threeLineCardCount=3;
        threeLineCard[0]=handThreeCardArr[lastIndex];
        threeLineCard[1]=handThreeCardArr[lastIndex+1];
        threeLineCard[2]=handThreeCardArr[lastIndex+2];

        isFindThreeLine = false ;
        for(let j=3+lastIndex; j<leftThreeCardCount; j+=3){
            //连续判断
            if(1!==(lastLogicCard-(gameLogic.getCardLogicValue(handThreeCardArr[j])))) {
                lastIndex = j ;
                if(leftThreeCardCount-j>=6) isFindThreeLine = true ;
                break;
            }
            lastLogicCard=gameLogic.getCardLogicValue(handThreeCardArr[j]);
            threeLineCard[threeLineCardCount]=handThreeCardArr[j];
            threeLineCard[threeLineCardCount+1]=handThreeCardArr[j+1];
            threeLineCard[threeLineCardCount+2]=handThreeCardArr[j+2];
            threeLineCardCount += 3;
        }
        if(threeLineCardCount>3) {
            //移除三条（还应该移除炸弹王等）
            let remainCard = tmpCardDataArr.slice();
            gameLogic.removeCard(handThreeCardArr, remainCard);
            let remainCardCount = remainCard.length;

            for(let start=0; start<threeLineCardCount-3; start+=3){
                //本顺数目
                let thisTreeLineCardCount = threeLineCardCount-start ;
                if(!!turnCardThree && (thisTreeLineCardCount!== turnCardThree.length || gameLogic.getCardLogicValue(threeLineCard[0])<=turnFirstCardLogicValue)){
                    continue;
                }
                //单牌个数
                let singleCardCount=(thisTreeLineCardCount)/3;
                //单牌不够
                if(remainCardCount < singleCardCount) continue ;

                let flagArrs = utils.getCombinationFlagArrs(remainCardCount, singleCardCount);
                for (let k = 0; k < flagArrs.length; ++k){
                    let index = cardTypeResult.cardTypeCount ;
                    if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                    cardTypeResult.cardType = gameProto.cardType.THREE_LINE_TAKE_ONE ;
                    //保存三条
                    cardTypeResult.cardDataArr[index] = threeLineCard.slice(start, threeLineCardCount);
                    let flagArr = flagArrs[k];
                    for (let h = 0; h < flagArr.length; h++){
                        if (!!flagArr[h]){
                            cardTypeResult.cardDataArr[index].push(remainCard[h]);
                        }
                    }
                    cardTypeResult.eachHandCardCount[index] = cardTypeResult.cardDataArr[index].length;
                    cardTypeResult.cardTypeCount++ ;
                }
            }

            //移除三连
            isFindThreeLine = true ;
            gameLogic.removeCard(threeLineCard, handThreeCardArr) ;
            leftThreeCardCount -= threeLineCardCount;
        }
    }
    return cardTypeResult;
};

// 获取三带2类型
logic.getAllThreeLineTakeTwoCardType = function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.THREE_LINE_TAKE_TWO,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };

    let turnFirstCardLogicValue = 0;
    let turnCardThree;
    if (!!turnCardData){
        turnCardThree = this.getAllThreeCard(turnCardData);
        turnFirstCardLogicValue = gameLogic.getCardLogicValue(turnCardThree[0]);
    }

    //恢复扑克，防止分析时改变扑克
    let tmpCardDataArr = handCardDataArr.slice();

    //移除炸弹
    let allBomCardDataArr = this.getAllBombCard(tmpCardDataArr);
    gameLogic.removeCard(allBomCardDataArr, tmpCardDataArr);

    let handThreeCardArr = this.getAllThreeCard(tmpCardDataArr);
    let handThreeCount=handThreeCardArr.length;
    if (!turnCardData || (turnCardData.length === 5)) {
        //去掉三条
        let remainCardDataArr = tmpCardDataArr.slice();
        gameLogic.removeCard(handThreeCardArr, remainCardDataArr);
        let remainCardCount = remainCardDataArr.length;
        //三条带2张
        for(let i = 0; i < handThreeCount; i+=3){
            if (!!turnCardData && (gameLogic.getCardLogicValue(handThreeCardArr[i])<=turnFirstCardLogicValue)) continue;
            let flagArrs = utils.getCombinationFlagArrs(remainCardCount, 2);
            for (let j = 0; j < flagArrs.length; ++j){
                let index = cardTypeResult.cardTypeCount ;
                if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                cardTypeResult.cbCardType = gameProto.cardType.THREE_LINE_TAKE_ONE ;
                cardTypeResult.cardDataArr[index][0] = handThreeCardArr[i] ;
                cardTypeResult.cardDataArr[index][1] = handThreeCardArr[i+1] ;
                cardTypeResult.cardDataArr[index][2] = handThreeCardArr[i+2] ;
                let flagArr = flagArrs[j];
                for (let k = 0; k < flagArr.length; ++k){
                    if (!!flagArr[k]){
                        cardTypeResult.cardDataArr[index].push(remainCardDataArr[k]);
                    }
                }
                cardTypeResult.eachHandCardCount[index] = 5;
                cardTypeResult.cardTypeCount++ ;
            }
        }
    }

    //三连带2
    let leftThreeCardCount=handThreeCount ;
    let isFindThreeLine=true ;
    let lastIndex=0 ;
    if(gameLogic.getCardLogicValue(handThreeCardArr[0])===15) lastIndex=3 ;
    while (leftThreeCardCount + lastIndex>=6 && isFindThreeLine) {
        let lastLogicCard=gameLogic.getCardLogicValue(handThreeCardArr[lastIndex]);
        let threeLineCard = [];
        let threeLineCardCount=3;
        threeLineCard[0]=handThreeCardArr[lastIndex];
        threeLineCard[1]=handThreeCardArr[lastIndex+1];
        threeLineCard[2]=handThreeCardArr[lastIndex+2];

        isFindThreeLine = false ;
        for(let j=3+lastIndex; j<leftThreeCardCount; j+=3){
            //连续判断
            if(1!==(lastLogicCard-(gameLogic.getCardLogicValue(handThreeCardArr[j])))) {
                lastIndex = j ;
                if(leftThreeCardCount-j>=6) isFindThreeLine = true ;
                break;
            }
            lastLogicCard=gameLogic.getCardLogicValue(handThreeCardArr[j]);
            threeLineCard[threeLineCardCount]=handThreeCardArr[j];
            threeLineCard[threeLineCardCount+1]=handThreeCardArr[j+1];
            threeLineCard[threeLineCardCount+2]=handThreeCardArr[j+2];
            threeLineCardCount += 3;
        }
        if(threeLineCardCount>3) {
            //移除三条（还应该移除炸弹王等）
            let remainCard = tmpCardDataArr.slice();
            gameLogic.removeCard(handThreeCardArr, remainCard);
            let remainCardCount = remainCard.length;

            for(let start=0; start<threeLineCardCount-3; start+=3){
                //本顺数目
                let thisTreeLineCardCount = threeLineCardCount-start ;
                if(!!turnCardThree && (thisTreeLineCardCount!== turnCardThree.length || gameLogic.getCardLogicValue(threeLineCard[0])<=turnFirstCardLogicValue)){
                    continue;
                }
                //单牌个数
                let singleCardCount=(thisTreeLineCardCount)/3*2;
                //单牌不够
                if(remainCardCount < singleCardCount) continue ;

                let flagArrs = utils.getCombinationFlagArrs(remainCardCount, singleCardCount);
                for (let k = 0; k < flagArrs.length; ++k){
                    let index = cardTypeResult.cardTypeCount ;
                    if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                    cardTypeResult.cardType = gameProto.cardType.THREE_LINE_TAKE_ONE ;
                    //保存三条
                    cardTypeResult.cardDataArr[index] = threeLineCard.slice(start, threeLineCardCount);
                    let flagArr = flagArrs[k];
                    for (let h = 0; h < flagArr.length; h++){
                        if (!!flagArr[h]){
                            cardTypeResult.cardDataArr[index].push(remainCard[h]);
                        }
                    }
                    cardTypeResult.eachHandCardCount[index] = cardTypeResult.cardDataArr[index].length;
                    cardTypeResult.cardTypeCount++ ;
                }
            }

            //移除三连
            isFindThreeLine = true ;
            gameLogic.removeCard(threeLineCard, handThreeCardArr) ;
            leftThreeCardCount -= threeLineCardCount;
        }
    }
    return cardTypeResult;
};

// 获取四带单类型
logic.getAllFourLineTakeXCardType = function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.FOUR_LINE_TAKE_X,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };
    if (handCardDataArr.length < 5) return cardTypeResult;
    //恢复扑克，防止分析时改变扑克
    let tmpCardDataArr = handCardDataArr.slice();
    let handCardCount = tmpCardDataArr.length;

    let handAllFourCardData = this.getAllBombCard(tmpCardDataArr.slice());
    let handAllFourCardCount = handCardDataArr.length;

    if (handAllFourCardCount <= 0) return cardTypeResult;

    let turnAllFourCardData = [];
    let turnFirstCardLogicValue = 0;
    if (!!turnCardData){
        turnAllFourCardData = this.getAllBombCard(turnCardData);
        turnFirstCardLogicValue = gameLogic.getCardLogicValue(turnAllFourCardData[0]);
    }

    if(!!turnCardData && gameLogic.getCardLogicValue(handAllFourCardData[0]) <= turnFirstCardLogicValue) return cardTypeResult;


    let canOutFourCardData = [];
    let canOutFourCardCount = 0;
    if (!!turnCardData){
        //可出的牌
        for(let i=0; i<handAllFourCardCount; i+=4) {
            if(gameLogic.getCardLogicValue(handAllFourCardData[i])>turnFirstCardLogicValue) {
                canOutFourCardData[canOutFourCardCount] = handAllFourCardData[i] ;
                canOutFourCardData[canOutFourCardCount+1] = handAllFourCardData[i+1] ;
                canOutFourCardData[canOutFourCardCount+2] = handAllFourCardData[i+2] ;
                canOutFourCardData[canOutFourCardCount+3] = handAllFourCardData[i+3] ;
                canOutFourCardCount += 4 ;
            }
        }
        if((handCardCount-canOutFourCardCount) < (turnCardData.length-turnAllFourCardData.length)) return cardTypeResult;
    }else{
        canOutFourCardData = handAllFourCardData;
        canOutFourCardCount = handCardDataArr.length;
    }

    let remainCard = tmpCardDataArr.slice();
    gameLogic.removeCard(canOutFourCardData, remainCard);
    for(let start=0; start<canOutFourCardCount; start += 4){
        for (let  i = 1; i <=4; ++i){
            let flagArrs = utils.getCombinationFlagArrs(remainCard.length, i);
            for (let j = 0; j < flagArrs.length; ++j){
                let flagArr = flagArrs[j];
                let index=cardTypeResult.cardTypeCount ;
                cardTypeResult.cardDataArr[index] = canOutFourCardData.slice(start, start + 4);
                for (let k = 0; k < flagArr.length; ++k){
                    if (!!flagArr[k]){
                        cardTypeResult.cardDataArr[index].push(remainCard[k]);
                    }
                }
                cardTypeResult.eachHandCardCount[index] = cardTypeResult.cardDataArr[index].length;
                cardTypeResult.cardTypeCount++ ;
            }
        }
    }
    return cardTypeResult;
};

// 获取炸弹类型
logic.getAllBombCardType= function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.BOMB_CARD,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };
    let fourCardData = this.getAllBombCard(handCardDataArr) ;
    for (let i=0; i< fourCardData.length; i+=4){
        if (!!turnCardData && turnCardData.length > 0){
            if (gameLogic.getCardLogicValue(fourCardData[i])<=gameLogic.getCardLogicValue(turnCardData[0])) continue;
        }
        let index = cardTypeResult.cardTypeCount ;
        if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
        cardTypeResult.cardType = gameProto.cardType.BOMB_CARD ;
        cardTypeResult.cardDataArr[index][0] = fourCardData[i] ;
        cardTypeResult.cardDataArr[index][1] = fourCardData[i+ 1] ;
        cardTypeResult.cardDataArr[index][2] = fourCardData[i + 2] ;
        cardTypeResult.cardDataArr[index][3] = fourCardData[i + 3] ;
        cardTypeResult.eachHandCardCount[index] = 4 ;
        cardTypeResult.cardTypeCount++ ;
    }
    return cardTypeResult;
};

logic.analyseOutCardTypeActive = function(handCardDataArr, cardTypeResultArr){
    // 初始化结果
    for (let i = 0; i <= 12; ++i){
        cardTypeResultArr.push({
            cardTypeCount: 0,
            cardDataArr: [],
            eachHandCardCount: [],
            cardType: i
        })
    }
    cardTypeResultArr[gameProto.cardType.SINGLE] = this.getAllSingleCardType(handCardDataArr);

    cardTypeResultArr[gameProto.cardType.DOUBLE] = this.getAllDoubleCardType(handCardDataArr);

    cardTypeResultArr[gameProto.cardType.BOMB_CARD] = this.getAllBombCardType(handCardDataArr);

    cardTypeResultArr[gameProto.cardType.SINGLE_LINE] = this.getAllLineCardType(handCardDataArr);

    cardTypeResultArr[gameProto.cardType.DOUBLE_LINE] = this.getAllDoubleLineCardType(handCardDataArr);

    cardTypeResultArr[gameProto.cardType.THREE_LINE] = this.getAllThreeLineCardType(handCardDataArr);

    cardTypeResultArr[gameProto.cardType.THREE_LINE_TAKE_ONE] = this.getAllThreeLineTakeOneCardType(handCardDataArr);

    cardTypeResultArr[gameProto.cardType.THREE_LINE_TAKE_TWO] = this.getAllThreeLineTakeTwoCardType(handCardDataArr);
};

logic.analyseOutCardTypePassive = function(handCardDataArr, turnCardData, cardTypeResultArr) {
    // 初始化结果
    for (let i = 0; i <= 12; ++i){
        cardTypeResultArr.push({
            cardTypeCount: 0,
            cardDataArr: [],
            eachHandCardCount: [],
            cardType: i
        })
    }

    let tmpCardDataArr = gameLogic.sortCardList(handCardDataArr.slice());
    let turnCardType = gameLogic.getCardType(turnCardData);
    if(turnCardType === gameProto.cardType.ERROR){
        console.error("turnCardType err");
        return ;
    }
    if(turnCardType!==gameProto.cardType.BOMB_CARD) {
        cardTypeResultArr[gameProto.cardType.BOMB_CARD] = this.getAllBombCardType(tmpCardDataArr);
    }

    switch(turnCardType)
    {
        case gameProto.cardType.SINGLE:				//单牌类型
        {
            cardTypeResultArr[gameProto.cardType.SINGLE] = this.getAllSingleCardType(tmpCardDataArr, turnCardData);
            break ;
        }
        case gameProto.cardType.DOUBLE:				//对牌类型
        {
            cardTypeResultArr[gameProto.cardType.DOUBLE] = this.getAllDoubleCardType(tmpCardDataArr, turnCardData);
            break ;
        }
        case gameProto.cardType.SINGLE_LINE:		//单连类型
        {
            cardTypeResultArr[gameProto.cardType.SINGLE_LINE] = this.getAllLineCardType(handCardDataArr, turnCardData);
            break ;
        }
        case gameProto.cardType.DOUBLE_LINE:		//对连类型
        {
            cardTypeResultArr[gameProto.cardType.DOUBLE_LINE] = this.getAllDoubleLineCardType(handCardDataArr, turnCardData);
            break;
        }
        case gameProto.cardType.THREE_LINE:			//三连类型
        {
            cardTypeResultArr[gameProto.cardType.THREE_LINE] = this.getAllThreeLineCardType(handCardDataArr, turnCardData);
            break;
        }
        case gameProto.cardType.THREE_LINE_TAKE_ONE://三带一单
        {
            cardTypeResultArr[gameProto.cardType.THREE_LINE_TAKE_ONE] = this.getAllThreeLineTakeOneCardType(handCardDataArr, turnCardData);
            break;
        }
        case gameProto.cardType.THREE_LINE_TAKE_TWO://三带一对
        {
            cardTypeResultArr[gameProto.cardType.THREE_LINE_TAKE_TWO] = this.getAllThreeLineTakeTwoCardType(handCardDataArr, turnCardData);
            break;
        }
        case gameProto.cardType.FOUR_LINE_TAKE_X://四带两单
        {
            cardTypeResultArr[gameProto.cardType.FOUR_LINE_TAKE_X] = this.getAllFourLineTakeXCardType(handCardDataArr, turnCardData);
            break;
        }
        case gameProto.cardType.BOMB_CARD:			//炸弹类型
        {
            cardTypeResultArr[gameProto.cardType.BOMB_CARD] = this.getAllBombCardType(handCardDataArr, turnCardData);
            break;
        }
        default:
            break;
    }

};

/********************************************************************
 函数名：Combination
 参数：
 cbCombineCardData：存储单个的组合结果
 cbResComLen：已得到的组合长度，开始调用时此参数为0
 cbResultCardData：存储所有的组合结果
 cbResCardLen：cbResultCardData的第一下标的长度，组合结果的个数
 cbSrcCardData：需要做组合的数据
 cbSrcLen：cbSrcCardData的数据数目
 cbCombineLen2，cbCombineLen1：组合的长度，开始调用时两者相等。
 *********************************************************************/
//组合算法
logic.combination = function(combineCardDataArr, resComLen, resultCardData, srcCardData, combineLen1, combineLen2){
    if( resComLen === combineLen2 ) {
        resultCardData.push(combineCardDataArr.slice(0, resComLen));
    }
    else {
        if(combineLen1 >= 1 && srcCardData.length > 0){
            combineCardDataArr[combineLen2-combineLen1] =  srcCardData[0];
            ++resComLen;
            this.combination(combineCardDataArr, resComLen, resultCardData, srcCardData.slice(1, srcCardData.length),combineLen1-1, combineLen2);

            --resComLen;
            this.combination(combineCardDataArr, resComLen, resultCardData, srcCardData.slice(1, srcCardData.length),combineLen1, combineLen2);
        }
    }
};

//排列算法
logic.permutation = function(list, m, n, result) {
    let j,temp;
    if(m === n){
        let arr = [];
        for(j = 0; j < n; j++){
            arr[j]=list[j];
        }
        if (arr.length > 0) result.push(arr);
    }
    else{
        for(j = m; j < n; j++){
            temp = list[m] ;
            list[m] = list[j];
            list[j] = temp ;
            this.permutation(list,m+1,n,result);
            temp = list[m] ;
            list[m] = list[j];
            list[j] = temp ;
        }
    }
};

// 分析单排数量
logic.analyseSingleCardCount = function(handCardDataArr, wantOutCardDataArr,  singleCardDataArr) {
    //参数判断
    if (handCardDataArr.length <= 0) return MAX_COUNT + 5;

    let remainCard = gameLogic.sortCardList(handCardDataArr.slice());

    let wantOutCardCount = 0;
    if (!!wantOutCardDataArr) wantOutCardCount = wantOutCardDataArr.length;
    //移除扑克
    if (wantOutCardCount !== 0) gameLogic.removeCard(wantOutCardDataArr, remainCard);

    let getAllCardFunArray = [];
    getAllCardFunArray[0] = this.getAllBombCard.bind(this);
    getAllCardFunArray[1] = this.getAllLineCard.bind(this);
    getAllCardFunArray[2] = this.getAllThreeCard.bind(this);
    getAllCardFunArray[3] = this.getAllDoubleCard.bind(this);

    //指针数组下标
    let indexArray = [0, 1, 2, 3];
    //排列结果
    let permutationRes = [];
    //计算排列
    this.permutation(indexArray, 0, 4, permutationRes);
    if (permutationRes.length !== 24) return MAX_COUNT + 5;

    //单牌数目
    let minSingleCardCount = MAX_COUNT + 5;
    //计算最小值
    for (let i = 0; i < 24; ++i) {
        //保留数据
        let tmpCardDataArr = remainCard.slice();

        for (let j = 0; j < 4; ++j) {
            let index = permutationRes[i][j];
            if (index < 0 || index >= 4) {
                console.error("ai logic arr err: index<0 || index>=4");
                return MAX_COUNT + 5;
            }
            let tmpGetAllCardFun = getAllCardFunArray[index];
            //提取扑克
            let getCardData = tmpGetAllCardFun(tmpCardDataArr);
            //删除扑克
            if (getCardData.length !== 0) gameLogic.removeCard(getCardData, tmpCardDataArr);
        }

        //计算单牌
        let singleCard = this.getAllSingleCard(tmpCardDataArr);
        if (minSingleCardCount > singleCard.length) {
            minSingleCardCount = singleCard.length;
            //保存单牌
            if (!!singleCardDataArr) {
                singleCardDataArr.splice(0, singleCardDataArr.length);
                for (let k = 0; k < singleCard.length; ++k){
                    singleCardDataArr.push(singleCard[k])
                }
            }
        }
    }

    let wantOutCardType = gameLogic.getCardType(wantOutCardDataArr);
    //带大牌判断
    if (wantOutCardCount > 0) {
        //出牌类型
        if (wantOutCardType === gameProto.cardType.THREE_LINE_TAKE_ONE || wantOutCardType === gameProto.cardType.THREE_LINE_TAKE_TWO) {
            for (let i = 3; i < wantOutCardCount; ++i) {
                if (gameLogic.getCardLogicValue(wantOutCardDataArr[i]) >= 14) minSingleCardCount += 3;
            }
        }
    }

    //三条类型判断
    if (wantOutCardCount > 0){
        // 出牌类型
        if (wantOutCardType === gameProto.cardType.THREE_LINE){
            minSingleCardCount += (wantOutCardCount/3);
        }
    }

    //拆三条判断
    if (wantOutCardType === gameProto.cardType.DOUBLE) {
        let allThreeCardData = this.getAllThreeCard(handCardDataArr);
        let allThreeCount = allThreeCardData.length;
        let allLineCardData = this.getAllLineCard(handCardDataArr);
        let allLineCount = allLineCardData.length;

        let threeCardValue = 0;
        for (let i = 0; i < allThreeCount; ++i) {
            for (let j = 0; j < wantOutCardCount; ++j) {
                if (gameLogic.getCardLogicValue(wantOutCardDataArr[j]) === gameLogic.getCardLogicValue(allThreeCardData[i])) {
                    threeCardValue = gameLogic.getCardValue(wantOutCardDataArr[j]);
                    break;
                }
            }
        }

        //是否有连牌
        let isInLineCard = false;
        for (let lineCardIndex = 0; lineCardIndex < allLineCount; ++lineCardIndex) {
            if (gameLogic.getCardValue(allLineCardData[lineCardIndex]) === threeCardValue) {
                isInLineCard = true;
                break;
            }
        }

        if (!isInLineCard && threeCardValue !== 0) minSingleCardCount += 2;
    }

    //拆炸判断
    if (wantOutCardCount !== 0) {
        //炸弹扑克
        let bombCard = this.getAllBombCard(handCardDataArr);
        let bombCardCount = bombCard.length;

        //出牌类型
        let cardType = wantOutCardType;

        if (bombCardCount > 0 && cardType < gameProto.cardType.BOMB_CARD) {
            //寻找相同
            for (let i = (gameLogic.getCardColor(bombCard[0]) === 4 ? 2 : 0); i < bombCardCount; i += 4) {
                for (let j = 0; j < wantOutCardCount; ++j) {
                    if (gameLogic.getCardValue(bombCard[i]) === gameLogic.getCardValue(wantOutCardDataArr[j]) && gameLogic.getCardLogicValue(wantOutCardDataArr[j]) < 15){
                        if (cardType !== gameProto.cardType.SINGLE_LINE && cardType !== gameProto.cardType.DOUBLE_LINE){
                            return MAX_COUNT + 5; // 不拆炸弹
                        }else{
                            minSingleCardCount += 2; // 不拆炸弹
                        }
                    }
                }
            }

            //多个炸弹判断
            if (cardType === gameProto.cardType.SINGLE_LINE) {
                let bombCount = 0;

                for (let i = gameLogic.getCardColor(bombCard[0]) === 4 ? 2 : 0; i < bombCount; i += 4)
                    for (let j = 0; j < wantOutCardCount; ++j)
                        if (gameLogic.getCardValue(bombCard[i]) === gameLogic.getCardValue(wantOutCardDataArr[j])) ++bombCount;

                if (bombCount >= 2) return MAX_COUNT; //不拆炸弹

                //三条个数
                let analyseResult = gameLogic.analyseCardDataArr(handCardDataArr);

                let threeCount = 0;

                for (let i = 0; i < analyseResult.threeCardData.length; ++i)
                    for (let j = 0; j < wantOutCardCount; ++j)
                        if (gameLogic.getCardValue(wantOutCardDataArr[j]) === gameLogic.getCardValue(analyseResult.threeCardData[3 * i])) ++threeCount;

                if (threeCount + bombCount >= 2) return MAX_COUNT + 5;

            }
        }
    }
    return minSingleCardCount;
};

// 主动出牌
logic.outCardActive = function (handCardDataArr, nextCardDataArr) {
    let outCardResult = {
        cardCount: 0,
        resultCard: []
    };

    let handCardCount = handCardDataArr.length;

    let cardType = gameLogic.getCardType(handCardDataArr.slice());
    //只剩一手牌
    if (cardType !== gameProto.cardType.ERROR){
        outCardResult.cardCount = handCardCount ;
        outCardResult.resultCard = handCardDataArr.slice();
        return outCardResult;
    }

    let nextCardType = gameLogic.getCardType(nextCardDataArr);

    //判断可否出完
    let isFindOutCard = false;
    let cardTypeResultArr = [];
    this.analyseOutCardTypeActive(handCardDataArr, cardTypeResultArr);
    let minSingleCardCount = MAX_COUNT;
    for(let cardType= gameProto.cardType.SINGLE; cardType<=gameProto.cardType.BOMB_CARD; ++cardType) {
        let cardTypeResult = cardTypeResultArr[cardType];
        if(cardTypeResult.cardTypeCount>0) {
            for(let index=0; index<cardTypeResult.cardTypeCount; ++index) {
                //计算单牌
                let tmpSingleCount = this.analyseSingleCardCount(handCardDataArr, cardTypeResult.cardDataArr[index]) ;

                //结果判断
                if (tmpSingleCount >= MAX_COUNT) continue ;

                //炸弹优先级排后
                let bombCardType = gameLogic.getCardType(cardTypeResult.cardDataArr[index]) ;
                if (bombCardType === gameProto.cardType.BOMB_CARD) tmpSingleCount += 4 ;
                else if (bombCardType === gameProto.cardType.MISSILE_CARD) tmpSingleCount += 5 ;
                else if ( 14 === gameLogic.getCardLogicValue( cardTypeResult.cardDataArr[ index ][ 0 ] ) ) tmpSingleCount += 2;
                else if ( 14 < gameLogic.getCardLogicValue(cardTypeResult.cardDataArr[ index ][ 0 ] ) ) tmpSingleCount += 3;

                if (nextCardType !== gameProto.cardType.ERROR && gameLogic.compareCard(nextCardDataArr, cardTypeResult.cardDataArr[index]) === 2) continue;
                if (tmpSingleCount <= minSingleCardCount) {
                    //设置变量
                    outCardResult.cardCount=cardTypeResult.eachHandCardCount[index];
                    outCardResult.resultCard = cardTypeResult.cardDataArr[index].slice();
                    minSingleCardCount = tmpSingleCount ;
                    isFindOutCard = true;
                }
            }
        }
    }
    if (!isFindOutCard){
        // 没有能出的牌，出最多的一手牌
        let maxCardCount = -1;
        for(let cardType= gameProto.cardType.SINGLE; cardType<=gameProto.cardType.BOMB_CARD; ++cardType) {
            let cardTypeResult = cardTypeResultArr[cardType];
            if(cardTypeResult.cardTypeCount>0) {
                for(let index=0; index<cardTypeResult.cardTypeCount; ++index) {
                    if (cardTypeResult.cardDataArr[index].length > maxCardCount){
                        outCardResult.cardCount=cardTypeResult.eachHandCardCount[index];
                        outCardResult.resultCard = cardTypeResult.cardDataArr[index].slice();
                        maxCardCount = outCardResult.resultCard.length;
                    }
                }
            }
        }
        // 如果下家已经报单，出单牌时出最大单排
        if (nextCardType === gameProto.cardType.SINGLE && outCardResult.count === 1){
            outCardResult.cardCount= 1;
            outCardResult.resultCard = [handCardDataArr[0]];
        }
    }
    return outCardResult;
};

// 被动出牌
logic.outCardPassive = function (handCardDataArr, turnCardDataArr, nextCardDataArr) {
    let outCardResult = {
        cardCount: 0,
        resultCard: []
    };

    let handCardCount = handCardDataArr.length;

    //出牌类型
    let outCardType = gameLogic.getCardType(turnCardDataArr) ;

    let nextCardType = gameLogic.getCardType(nextCardDataArr);

    let cardTypeResultArr = [];
    this.analyseOutCardTypePassive(handCardDataArr,turnCardDataArr, cardTypeResultArr);

    //只剩炸弹
    if(handCardCount===cardTypeResultArr[gameProto.cardType.BOMB_CARD].eachHandCardCount[0] && (outCardType<gameProto.cardType.BOMB_CARD ||
            gameLogic.getCardLogicValue(cardTypeResultArr[gameProto.cardType.BOMB_CARD].cardDataArr[0][0])>gameLogic.getCardLogicValue(turnCardDataArr[0]))) {
        outCardResult.cardCount = cardTypeResultArr[gameProto.cardType.BOMB_CARD].eachHandCardCount[0] ;
        outCardResult.resultCard = cardTypeResultArr[gameProto.cardType.BOMB_CARD].cardDataArr[0].slice();
        return outCardResult;
    }

    //判断可否出完
    let minSingleCardCount = MAX_COUNT;
    for(let cardType=gameProto.cardType.SINGLE; cardType<=gameProto.cardType.BOMB_CARD; ++cardType)
    if(cardTypeResultArr[cardType].cardTypeCount>0) {
        let cardTypeResult = cardTypeResultArr[cardType];
        for(let i=0; i<cardTypeResult.cardTypeCount; ++i){
            //计算单牌
            let tmpSingleCount = this.analyseSingleCardCount(handCardDataArr, cardTypeResult.cardDataArr[i]) ;
            //结果判断
            if (tmpSingleCount >= MAX_COUNT) continue ;

            //炸弹优先级排后
            let bombCardType = gameLogic.getCardType(cardTypeResult.cardDataArr[i], cardTypeResult.eachHandCardCount[i]) ;
            if (bombCardType === gameProto.cardType.BOMB_CARD) tmpSingleCount += 4 ;

            if (tmpSingleCount <= minSingleCardCount) {
                //设置变量
                outCardResult.cardCount=cardTypeResult.eachHandCardCount[i];
                outCardResult.resultCard = cardTypeResult.cardDataArr[i].slice();
                minSingleCardCount = tmpSingleCount;
            }
        }
    }

    // 如果下家已经报单，出单牌时出最大单排
    if (nextCardType === gameProto.cardType.SINGLE && outCardResult.count === 1){
        outCardResult.cardCount= 1;
        outCardResult.resultCard = [handCardDataArr[0]];
    }

    return outCardResult;
};
