let logic = module.exports;
let gameProto = require('./DDZProto');
let gameLogic = require('./gameLogic');
let utils = require('../../util/utils');

let MAX_COUNT = 20;
let NORMAL_COUNT = 17;
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
logic.searchOutCard = function(handCardDataArr, turnCardDataArr, outCardChairID, curChairID, bankerUserChairID, allUserCardDataArr) {
    //玩家判断
    let undersideOfBanker = (bankerUserChairID+1)%3 ;	//地主下家
    let upsideOfBanker = (undersideOfBanker+1)%3 ;	    //地主上家

    //初始变量
    let outCardResult = {};

    //先出牌
    if(turnCardDataArr.length ===0) {
        //地主出牌
        if(curChairID === bankerUserChairID) outCardResult = this.bankerOutCardActive(handCardDataArr, bankerUserChairID, allUserCardDataArr) ;
        //地主下家
        else if(curChairID===undersideOfBanker) outCardResult = this.undersideOfBankerOutCardActive(handCardDataArr,curChairID, bankerUserChairID, allUserCardDataArr) ;
        //地主上家
        else if(curChairID===upsideOfBanker) outCardResult = this.upsideOfBankerOutCardActive(handCardDataArr, curChairID, bankerUserChairID, allUserCardDataArr) ;
        //错误 ID
        else{
            console.error("chairID err");
        }
    }
    //压牌
    else
    {
        //地主出牌
        if(curChairID===bankerUserChairID) outCardResult = this.bankerOutCardPassive(handCardDataArr, outCardChairID, turnCardDataArr, bankerUserChairID, allUserCardDataArr) ;
        //地主下家
        else if(curChairID===undersideOfBanker) outCardResult = this.undersideOfBankerOutCardPassive(handCardDataArr, outCardChairID, turnCardDataArr, bankerUserChairID, allUserCardDataArr) ;
        //地主上家
        else if(curChairID===upsideOfBanker) outCardResult = this.upsideOfBankerOutCardPassive(handCardDataArr, outCardChairID, turnCardDataArr, bankerUserChairID, allUserCardDataArr) ;
        //错误 ID
        else{
            console.error("chairID err");
        }
    }

    return outCardResult ;
};

//分析单牌
logic.getAllSingleCard = function(handCardDataArr) {
    let tmpCardDataArr = gameLogic.sortCardList(handCardDataArr.slice());
    let handCardCount = handCardDataArr.length;

    let singleCardDataArr = [];

    //扑克分析
    for (let i=0;i<handCardCount;i++){
        //变量定义
        let sameCount=1;
        let logicValue=gameLogic.getCardLogicValue(tmpCardDataArr[i]);
        //搜索同牌
        for (let j=i+1;j<handCardCount;j++){
            //获取扑克
            if (gameLogic.getCardLogicValue(tmpCardDataArr[j])!== logicValue) break;

            //设置变量
            sameCount++;
            if(sameCount > 1) break;
        }

        if(sameCount===1) {
            singleCardDataArr.push(tmpCardDataArr[i]);
        }

        //设置索引
        i+=(sameCount-1);
    }
    return singleCardDataArr;
};

//分析对子
logic.getAllDoubleCard = function(handCardDataArr) {
    let tmpCardDataArr = gameLogic.sortCardList(handCardDataArr.slice());
    let handCardCount = handCardDataArr.length;

    let doubleCardDataArr = [];

    //扑克分析
    for (let i=0;i<handCardCount;i++){
        let sameCount = 1;
        let logicValue=gameLogic.getCardLogicValue(tmpCardDataArr[i]);

        for (let j = i+1; j < handCardCount; ++j){
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
    let handCardCount = handCardDataArr.length;

    let threeCardDataArr = [];

    //扑克分析
    for (let i=0;i<handCardCount-2;i++){
        let sameCount=1;
        let logicValue=gameLogic.getCardLogicValue(tmpCardDataArr[i]);

        //搜索同牌
        for (let j=i+1;j<=i+3 && j<handCardCount;j++){
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
    let handCardCount = handCardDataArr.length;
    let temCardDataArr = gameLogic.sortCardList(handCardDataArr.slice());

    let lineCardDataArr = [];
    //数据校验
    if(handCardCount<5) return lineCardDataArr;

    let firstCard = 0 ;
    //去除2和王
    for(let i=0 ; i<handCardCount ; ++i){
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
    let handCardCount = handCardDataArr.length;
    //大小排序
    let temCardDataArr = gameLogic.sortCardList(handCardDataArr.slice());

    let boomCardArr = [];
    if(handCardDataArr.length<2) return boomCardArr;

    //双王炸弹
    if(0x4F===temCardDataArr[0] && 0x4E===temCardDataArr[1]) {
        boomCardArr.push(temCardDataArr[0]);
        boomCardArr.push(temCardDataArr[1]);
    }

    if (handCardCount >= 4){
        //扑克分析
        for (let i=0; i < handCardCount - 3;i++){
            //变量定义
            let sameCount = 1;
            let logicValue = gameLogic.getCardLogicValue(temCardDataArr[i]);
            //搜索同牌
            for (let j=i+1;j<=i+3 && j < handCardCount;j++) {
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

// 获取所有三条类型
logic.getAllThreeCardType = function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.THREE,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };
    let cardDataArr = this.getAllThreeCard(handCardDataArr) ;

    for(let i=0; i<cardDataArr.length; i+=3){
        if (!!turnCardData && turnCardData.length > 0){
            if (gameLogic.getCardLogicValue(cardDataArr[i]) <= gameLogic.getCardLogicValue(turnCardData[0])) continue;
        }
        let index = cardTypeResult.cardTypeCount ;
        cardTypeResult.cardDataArr[index] = [];
        cardTypeResult.cardType = gameProto.cardType.THREE ;
        cardTypeResult.cardDataArr[index][0] = cardDataArr[i] ;
        cardTypeResult.cardDataArr[index][1] = cardDataArr[i+1] ;
        cardTypeResult.cardDataArr[index][2] = cardDataArr[i+2] ;
        cardTypeResult.eachHandCardCount[index] = 3;
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
    //去除2和王
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
    //去除2和王
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
    while (leftCardCount>=6 && isFindDoubleLine) {
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
                if(doubleLineCount>=6) break ;
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
        if(doubleLineCount>=6) {
            let index ;

            //所有连牌
            let currentDoubleLineCount = 6 ;
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

// 获取三带单类型
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
            let index ;

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
                if(remainCardCount<singleCardCount) continue ;

                //单牌组合
                let comCard = [];
                let comResCard = [];
                this.combination(comCard, 0, comResCard, remainCard, singleCardCount, singleCardCount);
                let comResLen= comResCard.length;
                for(let i=0; i<comResLen; ++i){
                    index = cardTypeResult.cardTypeCount ;
                    if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                    cardTypeResult.cardType = gameProto.cardType.THREE_LINE_TAKE_ONE ;
                    //保存三条
                    let arr = threeLineCard.slice(start, threeLineCardCount);
                    cardTypeResult.cardDataArr[index] = arr;
                    //保存单牌
                    cardTypeResult.cardDataArr[index] = arr.concat(comResCard[i].slice(0, singleCardCount));

                    cardTypeResult.eachHandCardCount[index] = thisTreeLineCardCount+singleCardCount ;
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

// 获取三带对类型
logic.getAllThreeLineTakeTwoCardType = function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.THREE_LINE_TAKE_TWO,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };
    //恢复扑克，防止分析时改变扑克
    let tmpCardDataArr = handCardDataArr.slice();

    let turnFirstCardLogicValue = 0;
    let turnCardThree;
    if (!!turnCardData){
        turnCardThree = this.getAllThreeCard(turnCardData);
        turnFirstCardLogicValue = gameLogic.getCardLogicValue(turnCardThree[0]);
    }

    let handThreeCard = this.getAllThreeCard(tmpCardDataArr);
    let handThreeCount = handThreeCard.length ;
    let remainCarData = tmpCardDataArr.slice();

    //移除三条（还应该移除炸弹王等）
    gameLogic.removeCard(handThreeCard, remainCarData) ;
    let remainCardCount = remainCarData.length;

    //抽取对牌
    let allDoubleCardData = this.getAllDoubleCard(remainCarData);
    let allDoubleCardCount= allDoubleCardData.length;

    if (!turnCardData || (turnCardData.length === 5)){
        //三条带一对
        for(let i=0; i<handThreeCount; i+=3){
            let index ;
            if (!!turnCardData && (gameLogic.getCardLogicValue(handThreeCard[i] <= turnFirstCardLogicValue))) continue;
            //三条带一对
            for(let j=0; j<allDoubleCardCount; j+=2){
                index = cardTypeResult.cardTypeCount ;
                if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                cardTypeResult.cardType = gameProto.cardType.THREE_LINE_TAKE_TWO ;
                cardTypeResult.cardDataArr[index][0] = handThreeCard[i] ;
                cardTypeResult.cardDataArr[index][1] = handThreeCard[i+1] ;
                cardTypeResult.cardDataArr[index][2] = handThreeCard[i+2] ;
                cardTypeResult.cardDataArr[index][3] = allDoubleCardData[j] ;
                cardTypeResult.cardDataArr[index][4] = allDoubleCardData[j+1] ;
                cardTypeResult.eachHandCardCount[index] = 5 ;
                cardTypeResult.cardTypeCount++ ;
            }
        }
    }

    //三连带对
    let leftThreeCardCount=handThreeCount ;
    let isFindThreeLine=true ;
    let lastIndex=0 ;
    if(gameLogic.getCardLogicValue(handThreeCard[0])===15) lastIndex=3 ;
    while (leftThreeCardCount>=6 && isFindThreeLine) {
        let lastLogicCard=gameLogic.getCardLogicValue(handThreeCard[lastIndex]);
        let threeLineCard = [];
        let threeLineCardCount=3;
        threeLineCard[0]=handThreeCard[lastIndex];
        threeLineCard[1]=handThreeCard[lastIndex+1];
        threeLineCard[2]=handThreeCard[lastIndex+2];

        isFindThreeLine=false ;
        for(let j=3+lastIndex; j<leftThreeCardCount; j+=3){
            //连续判断
            if(1!==(lastLogicCard-(gameLogic.getCardLogicValue(handThreeCard[j])))) {
                lastIndex = j ;
                if(leftThreeCardCount-j>=6) isFindThreeLine = true ;
                break;
            }

            lastLogicCard=gameLogic.getCardLogicValue(handThreeCard[j]);
            threeLineCard[threeLineCardCount]=handThreeCard[j];
            threeLineCard[threeLineCardCount+1]=handThreeCard[j+1];
            threeLineCard[threeLineCardCount+2]=handThreeCard[j+2];
            threeLineCardCount += 3;
        }
        if(threeLineCardCount>3) {
            let index ;

            for(let start=0; start<threeLineCardCount-3; start+=3){
                //本顺数目
                let thisTreeLineCardCount = threeLineCardCount-start ;
                if (!!turnCardData){
                    if (thisTreeLineCardCount !== turnCardThree.length) continue;
                    if (gameLogic.getCardLogicValue(threeLineCard[start]) <= turnFirstCardLogicValue) break;
                }
                //对牌张数
                let doubleCardCount=((thisTreeLineCardCount)/3);
                //对牌不够
                if(remainCardCount<doubleCardCount) continue ;

                let doubleCardIndex = []; //对牌下标
                for(let i=0, j=0; i<allDoubleCardCount; i+=2, ++j){
                    doubleCardIndex[j]=i ;
                }

                //对牌组合
                let comCard = [];
                let comResCard = [];
                //利用对牌的下标做组合，再根据下标提取出对牌
                this.combination(comCard, 0, comResCard, doubleCardIndex, doubleCardCount, doubleCardCount);
                let comResLen = comResCard.length;

                for(let i=0; i<comResLen; ++i){
                    index = cardTypeResult.cardTypeCount ;
                    if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                    cardTypeResult.cardType = gameProto.cardType.THREE_LINE_TAKE_TWO ;
                    //保存三条
                    cardTypeResult.cardDataArr[index] = threeLineCard.slice(start, threeLineCardCount);
                    //保存对牌
                    for(let j=0, k=0; j<doubleCardCount; ++j, k+=2){
                        cardTypeResult.cardDataArr[index][thisTreeLineCardCount+k] = allDoubleCardData[comResCard[i][j]];
                        cardTypeResult.cardDataArr[index][thisTreeLineCardCount+k+1] = allDoubleCardData[comResCard[i][j]+1];
                    }
                    cardTypeResult.eachHandCardCount[index] = thisTreeLineCardCount+2*doubleCardCount ;
                    cardTypeResult.cardTypeCount++ ;
                }
            }
            //移除三连
            isFindThreeLine = true ;
            gameLogic.removeCard(threeLineCard, handThreeCard) ;
            leftThreeCardCount -= threeLineCardCount ;
        }
    }
    return cardTypeResult;
};

// 获取四带单类型
logic.getAllFourLineTakeOneCardType = function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.FOUR_LINE_TAKE_ONE,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };
    if (handCardDataArr.length < 6) return cardTypeResult;
    //恢复扑克，防止分析时改变扑克
    let tmpCardDataArr = handCardDataArr.slice();
    let handCardCount = tmpCardDataArr.length;

    let firstCard = 0 ;
    //去除王牌
    for(let i=0 ; i<handCardCount && i < 3; ++i){
        if(gameLogic.getCardColor(tmpCardDataArr[i])!==0x40){
            firstCard = i ;
            break ;
        }
    }

    let handAllFourCardData = this.getAllBombCard(tmpCardDataArr.slice(firstCard));
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
        let index ;
        //单牌组合
        let comCard = [];
        let comResCard = [];
        //单牌组合
        this.combination(comCard, 0, comResCard, remainCard, 2, 2);
        for(let i=0; i<comResCard.length; ++i){
            //不能带对
            if(gameLogic.getCardValue(comResCard[i][0])=== gameLogic.getCardValue(comResCard[i][1])) continue;

            index=cardTypeResult.cardTypeCount ;
            cardTypeResult.cardDataArr[index] = canOutFourCardData.slice(start, start + 4);
            cardTypeResult.cardDataArr[index][4] = comResCard[i][0] ;
            cardTypeResult.cardDataArr[index][4+1] = comResCard[i][1] ;
            cardTypeResult.eachHandCardCount[index] = 6 ;
            cardTypeResult.cardTypeCount++ ;
        }
    }
    return cardTypeResult;
};

// 获取四带对类型
logic.getAllFourLineTakeTwoCardType = function (handCardDataArr, turnCardData) {
    let cardTypeResult = {
        cardType: gameProto.cardType.FOUR_LINE_TAKE_TWO,
        cardTypeCount: 0,
        cardDataArr: [],
        eachHandCardCount: [],
    };

    if (handCardDataArr.length < 8) return cardTypeResult;
    //恢复扑克，防止分析时改变扑克
    let tmpCardDataArr = handCardDataArr.slice();
    let handCardCount = tmpCardDataArr.length;

    let firstCard = 0 ;
    //去除王牌
    for(let i=0 ; i<handCardCount && i<3 ; ++i)	if(gameLogic.getCardColor(tmpCardDataArr[i])!==0x40)	{firstCard = i ; break ;}

    let handAllFourCardData = this.getAllBombCard(tmpCardDataArr.slice(firstCard));
    let handAllFourCardCount = handCardDataArr.length;

    if (handAllFourCardCount <= 0) return cardTypeResult;

    let turnAllFourCardData = [];
    let turnFirstCardLogicValue = 0;
    if (!!turnCardData){
        turnAllFourCardData = this.getAllBombCard(turnCardData);
        turnFirstCardLogicValue = gameLogic.getCardLogicValue(turnAllFourCardData[0]);
    }

    if(!!turnCardData && gameLogic.getCardLogicValue(handAllFourCardData[0])<turnFirstCardLogicValue) return cardTypeResult;


    let canOutFourCardData = [] ;
    let canOutFourCardCount=0 ;
    //可出的牌
    if (!!turnCardData){
        for(let i=0; i<handAllFourCardCount; i+=4){
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
        canOutFourCardCount = handCardCount;
    }

    let remainCard = tmpCardDataArr.slice();
    gameLogic.removeCard(canOutFourCardData, remainCard);
    for(let start=0; start<canOutFourCardCount; start += 4){
        let allDoubleCardData = this.getAllDoubleCard(remainCard);
        let allDoubleCardCount= allDoubleCardData.length;

        let doubleCardIndex = [];
        for(let i=0, j=0; i<allDoubleCardCount; i+=2, ++j)
            doubleCardIndex[j]=i ;

        //对牌组合
        let comCard = [];
        let comResCard = [];

        //利用对牌的下标做组合，再根据下标提取出对牌
        this.combination(comCard, 0, comResCard, doubleCardIndex, 2, 2);
        for(let i=0; i<comResCard.length; ++i){
            let index = cardTypeResult.cardTypeCount ;
            cardTypeResult.cardDataArr[index] = canOutFourCardData.slice(start, start + 4);
            //保存对牌
            for(let j=0, k=0; j<2; ++j, k+=2){
                cardTypeResult.cardDataArr[index][4+k] = allDoubleCardData[comResCard[i][j]];
                cardTypeResult.cardDataArr[index][4+k+1] = allDoubleCardData[comResCard[i][j]+1];
            }

            cardTypeResult.eachHandCardCount[index] = 8 ;
            cardTypeResult.cardTypeCount++ ;
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
    let fourCardData = [];
    if(handCardDataArr.length>=2 && 0x4F===handCardDataArr[0] && 0x4E===handCardDataArr[1]) {
        let index = cardTypeResult.cardTypeCount ;
        cardTypeResult.cardDataArr[index] = [];
        cardTypeResult.cardType = gameProto.cardType.BOMB_CARD ;
        cardTypeResult.cardDataArr[index][0] = handCardDataArr[0] ;
        cardTypeResult.cardDataArr[index][1] = handCardDataArr[1] ;
        cardTypeResult.eachHandCardCount[index] = 2 ;
        cardTypeResult.cardTypeCount++ ;
        fourCardData = this.getAllBombCard(handCardDataArr.slice(2, handCardDataArr.length)) ;
    } else {
        fourCardData = this.getAllBombCard(handCardDataArr) ;
    }
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
    /*let cardTypeResult;
    //单牌类型
    {
        cardTypeResult = cardTypeResultArr[gameProto.cardType.SINGLE];
        for(let i=0; i<handCardCount; ++i){
            let index = cardTypeResult.cardTypeCount ;
            cardTypeResult.cardDataArr[index] = [];
            cardTypeResult.cardType = gameProto.cardType.SINGLE ;
            cardTypeResult.cardDataArr[index][0] = tmpCardDataArr[i] ;
            cardTypeResult.eachHandCardCount[index] = 1 ;
            cardTypeResult.cardTypeCount++;
        }
    }*/

    cardTypeResultArr[gameProto.cardType.DOUBLE] = this.getAllDoubleCardType(handCardDataArr);
    /*//对牌类型
    {
        cardTypeResult = cardTypeResultArr[gameProto.cardType.DOUBLE];
        let doubleCardDataArr = this.getAllDoubleCard(tmpCardDataArr) ;

        for(let i=0; i<doubleCardDataArr.length; i+=2){
            let index = cardTypeResult.cardTypeCount ;
            cardTypeResult.cardDataArr[index] = [];
            cardTypeResult.cardType = gameProto.cardType.DOUBLE ;
            cardTypeResult.cardDataArr[index][0] = doubleCardDataArr[i] ;
            cardTypeResult.cardDataArr[index][1] = doubleCardDataArr[i+1] ;
            cardTypeResult.eachHandCardCount[index] = 2 ;
            cardTypeResult.cardTypeCount++ ;
        }
    }*/

    cardTypeResultArr[gameProto.cardType.THREE] = this.getAllThreeCardType(handCardDataArr);
    /*//三条类型
    {
        cardTypeResult = cardTypeResultArr[gameProto.cardType.THREE];
        let threeCardDataArr = this.getAllThreeCard(tmpCardDataArr);
        for(let i=0; i<threeCardDataArr.length; i+=3){
            let index = cardTypeResult.cardTypeCount ;
            cardTypeResult.cardDataArr[index] = [];
            cardTypeResult.cardType = gameProto.cardType.THREE ;
            cardTypeResult.cardDataArr[index][0] = threeCardDataArr[i] ;
            cardTypeResult.cardDataArr[index][1] = threeCardDataArr[i+1] ;
            cardTypeResult.cardDataArr[index][2] = threeCardDataArr[i+2] ;
            cardTypeResult.eachHandCardCount[index] = 3 ;
            cardTypeResult.cardTypeCount++;
        }
    }*/

    cardTypeResultArr[gameProto.cardType.BOMB_CARD] = this.getAllBombCardType(handCardDataArr);
    /*//炸弹类型
    {
        cardTypeResult = cardTypeResultArr[gameProto.cardType.BOMB_CARD];
        let fourCardData = [];
        if(handCardCount>=2 && 0x4F===tmpCardDataArr[0] && 0x4E===tmpCardDataArr[1]) {
            let index = cardTypeResult.cardTypeCount ;
            cardTypeResult.cardDataArr[index] = [];
            cardTypeResult.cardType = gameProto.cardType.BOMB_CARD ;
            cardTypeResult.cardDataArr[index][0] = tmpCardDataArr[0] ;
            cardTypeResult.cardDataArr[index][1] = tmpCardDataArr[1] ;
            cardTypeResult.eachHandCardCount[index] = 2 ;
            cardTypeResult.cardTypeCount++ ;
            fourCardData = this.getAllBombCard(tmpCardDataArr.slice(2, tmpCardDataArr.length)) ;
        } else {
            fourCardData = this.getAllBombCard(tmpCardDataArr) ;
        }
        for (let i=0; i< fourCardData.length; i+=4){
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
    }*/

    cardTypeResultArr[gameProto.cardType.SINGLE_LINE] = this.getAllLineCardType(handCardDataArr);
    /*//单连类型
    {
        cardTypeResult = cardTypeResultArr[gameProto.cardType.SINGLE_LINE];
        //恢复扑克，防止分析时改变扑克
        tmpCardDataArr = reserveCardData.slice();
        let firstCard = 0 ;
        //去除2和王
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
            if(singleLineCardArr.length>=5) {
                let index ;
                //所有连牌
                let curLineCount = 5;
                let curLineIndex = 0;
                while (curLineCount <= singleLineCardArr.length) {
                    index = cardTypeResult.cardTypeCount ;
                    if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                    //let thisLineCount = singleLineCardArr.length-start ;
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

                /!*!//从小到大
                start = singleLineCardArr.length - 5;
                while (start >= 0)
                {
                    index = cardTypeResult.cardTypeCount ;
                    if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                    let thisLineCount = singleLineCardArr.length-start ;
                    cardTypeResult.cardType = gameProto.cardType.SINGLE_LINE ;
                    cardTypeResult.cardDataArr[index] = singleLineCardArr.slice(start, start + thisLineCount);
                    cardTypeResult.eachHandCardCount[index] = thisLineCount;
                    cardTypeResult.cardTypeCount++ ;
                    start-- ;
                }*!/

                gameLogic.removeCard(singleLineCardArr, tmpCardDataArr) ;
                leftCardCount -= singleLineCardArr.length;
                isFindSingleLine = true ;
            }
        }

    }*/

    cardTypeResultArr[gameProto.cardType.DOUBLE_LINE] = this.getAllDoubleLineCardType(handCardDataArr);
    /*//对连类型
    {
        cardTypeResult = cardTypeResultArr[gameProto.cardType.DOUBLE_LINE];
        //恢复扑克，防止分析时改变扑克
        tmpCardDataArr = reserveCardData.slice();

        //连牌判断
        let firstCard = 0;
        //去除2和王
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
        while (leftCardCount>=6 && isFindDoubleLine) {
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
                    if(doubleLineCount>=6) break ;
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
            if(doubleLineCount>=6) {
                let index ;

                //所有连牌
                let currentDoubleLineCount = 6 ;
                let currentDoubleLineIndex = 0;
                while ( currentDoubleLineCount <= doubleLineCount ) {
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

                /!*!//从小到大
                if ( doubleLineCount >= 6 ) {
                    //所有连牌
                    let leftLen = doubleLineCount - 6 ;
                    while ( leftLen >= 0 ) {
                        index = cardTypeResult.cardTypeCount ;
                        if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                        cardTypeResult.cardType = gameProto.cardType.DOUBLE_LINE;
                        cardTypeResult.cardDataArr[index] = doubleLineCard.slice(leftLen, doubleLineCount);
                        cardTypeResult.eachHandCardCount[index] = doubleLineCount - leftLen;
                        cardTypeResult.cardTypeCount++ ;

                        leftLen -= 2 ;
                    }
                }*!/

                gameLogic.removeCard(doubleLineCard, tmpCardDataArr);
                isFindDoubleLine=true ;
                leftCardCount -= doubleLineCount ;
            }
        }
    }*/

    cardTypeResultArr[gameProto.cardType.THREE_LINE] = this.getAllThreeLineCardType(handCardDataArr);
    /*//三连类型
    {
        cardTypeResult = cardTypeResultArr[gameProto.cardType.THREE_LINE];
        //恢复扑克，防止分析时改变扑克
        tmpCardDataArr = reserveCardData.slice();

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
                let index = cardTypeResult.cardTypeCount;
                if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                cardTypeResult.cardType = gameProto.cardType.THREE_LINE ;
                cardTypeResult.cardDataArr[index] = threeLineCardArr.slice(0, threeLineCount);
                cardTypeResult.eachHandCardCount[index] = threeLineCount;
                cardTypeResult.cardTypeCount++;

                gameLogic.removeCard(threeLineCardArr, tmpCardDataArr) ;
                isFindThreeLine=true ;
                leftCardCount -= threeLineCount ;
            }
        }

    }*/

    cardTypeResultArr[gameProto.cardType.THREE_LINE_TAKE_ONE] = this.getAllThreeLineTakeOneCardType(handCardDataArr);
    /*//三带一单
    {
        cardTypeResult = cardTypeResultArr[gameProto.cardType.THREE_LINE_TAKE_ONE];
        //恢复扑克，防止分析时改变扑克
        tmpCardDataArr = reserveCardData.slice();

        //移除炸弹
        let allBomCardDataArr = this.getAllBombCard(tmpCardDataArr);
        gameLogic.removeCard(allBomCardDataArr, tmpCardDataArr);

        let handThreeCardArr = this.getAllThreeCard(tmpCardDataArr);
        let handThreeCount=handThreeCardArr.length;
        {
            let index ;
            //去掉三条
            let remainCardDataArr = tmpCardDataArr.slice();
            gameLogic.removeCard(handThreeCardArr, remainCardDataArr);
            let remainCardCount = remainCardDataArr.length;
            //三条带一张
            for(let i=0; i<handThreeCount; i+=3){
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
                let index ;

                //移除三条（还应该移除炸弹王等）
                let remainCard = tmpCardDataArr.slice();
                gameLogic.removeCard(handThreeCardArr, remainCard);
                let remainCardCount = remainCard.length;

                for(let start=0; start<threeLineCardCount-3; start+=3){
                    //本顺数目
                    let thisTreeLineCardCount = threeLineCardCount-start ;
                    //单牌个数
                    let singleCardCount=(thisTreeLineCardCount)/3;

                    //单牌不够
                    if(remainCardCount<singleCardCount) continue ;

                    //单牌组合
                    let comCard = [];
                    let comResCard = [];
                    this.combination(comCard, 0, comResCard, remainCard, singleCardCount, singleCardCount);
                    let comResLen= comResCard.length;
                    for(let i=0; i<comResLen; ++i){
                        index = cardTypeResult.cardTypeCount ;
                        if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                        cardTypeResult.cbCardType = gameProto.cardType.THREE_LINE_TAKE_ONE ;
                        //保存三条
                        let arr = threeLineCard.slice(start, thisTreeLineCardCount);
                        cardTypeResult.cardDataArr[index] = arr;
                        //保存单牌
                        cardTypeResult.cardDataArr[index] = arr.concat(comResCard[i].slice(0, singleCardCount));

                        cardTypeResult.eachHandCardCount[index] = thisTreeLineCardCount+singleCardCount ;
                        cardTypeResult.cardTypeCount++ ;
                    }
                }

                //移除三连
                isFindThreeLine = true ;
                gameLogic.removeCard(threeLineCard, handThreeCardArr) ;
                leftThreeCardCount -= threeLineCardCount;
            }
        }
    }*/

    cardTypeResultArr[gameProto.cardType.THREE_LINE_TAKE_TWO] = this.getAllThreeLineTakeTwoCardType(handCardDataArr);
    /*//三带一对
    {
        cardTypeResult = cardTypeResultArr[gameProto.cardType.THREE_LINE_TAKE_TWO];
        //恢复扑克，防止分析时改变扑克
        tmpCardDataArr = reserveCardData.slice();

        let handThreeCard = this.getAllThreeCard(tmpCardDataArr);
        let handThreeCount = handThreeCard.length ;
        let remainCarData = tmpCardDataArr.slice();

        //移除三条（还应该移除炸弹王等）
        gameLogic.removeCard(handThreeCard, remainCarData) ;
        let remainCardCount = remainCarData.length;

        //抽取对牌
        let allDoubleCardData = this.getAllDoubleCard(remainCarData);
        let allDoubleCardCount= allDoubleCardData.length;

        //三条带一对
        for(let i=0; i<handThreeCount; i+=3){
            let index ;

            //三条带一张
            for(let j=0; j<allDoubleCardCount; j+=2){
                index = cardTypeResult.cardTypeCount ;
                if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                cardTypeResult.cardType = gameProto.cardType.THREE_LINE_TAKE_TWO ;
                cardTypeResult.cardDataArr[index][0] = handThreeCard[i] ;
                cardTypeResult.cardDataArr[index][1] = handThreeCard[i+1] ;
                cardTypeResult.cardDataArr[index][2] = handThreeCard[i+2] ;
                cardTypeResult.cardDataArr[index][3] = allDoubleCardData[j] ;
                cardTypeResult.cardDataArr[index][4] = allDoubleCardData[j+1] ;
                cardTypeResult.eachHandCardCount[index] = 5 ;
                cardTypeResult.cardTypeCount++ ;
            }
        }

        //三连带对
        let leftThreeCardCount=handThreeCount ;
        let isFindThreeLine=true ;
        let lastIndex=0 ;
        if(gameLogic.getCardLogicValue(handThreeCard[0])===15) lastIndex=3 ;
        while (leftThreeCardCount>=6 && isFindThreeLine) {
            let lastLogicCard=gameLogic.getCardLogicValue(handThreeCard[lastIndex]);
            let threeLineCard = [];
            let threeLineCardCount=3;
            threeLineCard[0]=handThreeCard[lastIndex];
            threeLineCard[1]=handThreeCard[lastIndex+1];
            threeLineCard[2]=handThreeCard[lastIndex+2];

            isFindThreeLine=false ;
            for(let j=3+lastIndex; j<leftThreeCardCount; j+=3){
                //连续判断
                if(1!==(lastLogicCard-(gameLogic.getCardLogicValue(handThreeCard[j])))) {
                    lastIndex = j ;
                    if(leftThreeCardCount-j>=6) isFindThreeLine = true ;
                    break;
                }

                lastLogicCard=gameLogic.getCardLogicValue(handThreeCard[j]);
                threeLineCard[threeLineCardCount]=handThreeCard[j];
                threeLineCard[threeLineCardCount+1]=handThreeCard[j+1];
                threeLineCard[threeLineCardCount+2]=handThreeCard[j+2];
                threeLineCardCount += 3;
            }
            if(threeLineCardCount>3) {
                let index ;

                for(let start=0; start<threeLineCardCount-3; start+=3){
                    //本顺数目
                    let thisTreeLineCardCount = threeLineCardCount-start ;
                    //对牌张数
                    let doubleCardCount=((thisTreeLineCardCount)/3);
                    //对牌不够
                    if(remainCardCount<doubleCardCount) continue ;

                    let doubleCardIndex = []; //对牌下标
                    for(let i=0, j=0; i<allDoubleCardCount; i+=2, ++j){
                        doubleCardIndex[j]=i ;
                    }

                    //对牌组合
                    let comCard = [];
                    let comResCard = [];
                    //利用对牌的下标做组合，再根据下标提取出对牌
                    this.combination(comCard, 0, comResCard, doubleCardIndex, doubleCardCount, doubleCardCount);
                    let comResLen = comResCard.length;

                    for(let i=0; i<comResLen; ++i){
                        index = cardTypeResult.cardTypeCount ;
                        if (!cardTypeResult.cardDataArr[index]) cardTypeResult.cardDataArr[index] = [];
                        cardTypeResult.cardType = gameProto.cardType.THREE_LINE_TAKE_TWO ;
                        //保存三条
                        cardTypeResult.cardDataArr[index] = threeLineCard.slice(start, thisTreeLineCardCount);
                        //保存对牌
                        for(let j=0, k=0; j<doubleCardCount; ++j, k+=2){
                            cardTypeResult.cardDataArr[index][thisTreeLineCardCount+k] = allDoubleCardData[comResCard[i][j]];
                            cardTypeResult.cardDataArr[index][thisTreeLineCardCount+k+1] = allDoubleCardData[comResCard[i][j]+1];
                        }
                        cardTypeResult.eachHandCardCount[index] = thisTreeLineCardCount+2*doubleCardCount ;
                        cardTypeResult.cardTypeCount++ ;
                    }
                }
                //移除三连
                isFindThreeLine = true ;
                gameLogic.removeCard(threeLineCard, handThreeCard) ;
                leftThreeCardCount -= threeLineCardCount ;
            }
        }
    }*/
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

    if(turnCardType !== gameProto.cardType.MISSILE_CARD && turnCardType!==gameProto.cardType.BOMB_CARD) {
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
        case gameProto.cardType.THREE:				//三条类型
        {
            cardTypeResultArr[gameProto.cardType.THREE] = this.getAllThreeCardType(tmpCardDataArr, turnCardData);
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
        case gameProto.cardType.FOUR_LINE_TAKE_ONE://四带两单
        {
            cardTypeResultArr[gameProto.cardType.FOUR_LINE_TAKE_ONE] = this.getAllFourLineTakeOneCardType(handCardDataArr, turnCardData);
            break;
        }
        case gameProto.cardType.FOUR_LINE_TAKE_TWO://四带两对
        {
            cardTypeResultArr[gameProto.cardType.FOUR_LINE_TAKE_TWO] = this.getAllFourLineTakeTwoCardType(handCardDataArr, turnCardData);
            break;
        }
        case gameProto.cardType.BOMB_CARD:			//炸弹类型
        {
            cardTypeResultArr[gameProto.cardType.BOMB_CARD] = this.getAllBombCardType(handCardDataArr, turnCardData);
            break;
        }
        case gameProto.cardType.MISSILE_CARD:		//火箭类型
        {
            //没有比火箭更大的牌了
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
        if (wantOutCardType === gameProto.cardType.THREE || wantOutCardType === gameProto.cardType.THREE_LINE){
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

// 地主主动出牌
logic.bankerOutCardActive = function (handCardDataArr, bankerUserChairID, allUserCardDataArr) {
    let outCardResult = {
        cardCount: 0,
        resultCard: []
    };

    let handCardCount = handCardDataArr.length;

    let cardType = gameLogic.getCardType(handCardDataArr.slice());
    //只剩一手牌
    if (cardType !== gameProto.cardType.ERROR && cardType !== gameProto.cardType.FOUR_LINE_TAKE_ONE && cardType !== gameProto.cardType.FOUR_LINE_TAKE_TWO){
        outCardResult.cardCount = handCardCount ;
        outCardResult.resultCard = handCardDataArr.slice();
        return outCardResult;
    }

    let lineCardArr = this.getAllLineCard(handCardDataArr);
    let threeCardArr = this.getAllThreeCard(handCardDataArr);
    let doubleLineCardArr = this.getAllDoubleCard(handCardDataArr);

    let undersideOfBanker = (bankerUserChairID+1)%3 ;	//地主下家
    let upsideOfBanker = (undersideOfBanker+1)%3 ;	    //地主上家

    //判断可否出完
    let singleCardCount = MAX_COUNT+gameProto.cardType.MISSILE_CARD ;
    let isFindBestCard = false ;
    let cardTypeResultArr = [];
    this.analyseOutCardTypeActive(handCardDataArr, cardTypeResultArr) ;
    for(let cardType= gameProto.cardType.SINGLE; cardType<=gameProto.cardType.MISSILE_CARD; ++cardType) {
        let cardTypeResult = cardTypeResultArr[cardType];
        if(cardTypeResult.cardTypeCount>0) {
            for(let index=0; index<cardTypeResult.cardTypeCount; ++index) {
                if(this.testOutAllCard(bankerUserChairID, bankerUserChairID, cardTypeResult.cardDataArr[index], true, allUserCardDataArr)) {
                    //计算单牌
                    let tmpSingleCount = this.analyseSingleCardCount(handCardDataArr, cardTypeResult.cardDataArr[index]) ;

                    //结果判断
                    if (tmpSingleCount >= MAX_COUNT) continue ;

                    //炸弹优先级排后
                    let bombCardType = gameLogic.getCardType(cardTypeResult.cardDataArr[index]) ;
                    if (bombCardType === gameProto.cardType.BOMB_CARD) tmpSingleCount += 4 ;
                    else if (bombCardType === gameProto.cardType.MISSILE_CARD) tmpSingleCount += 5 ;
                    else if ( 15 === gameLogic.getCardLogicValue( cardTypeResult.cardDataArr[ index ][ 0 ] ) ) tmpSingleCount += 2;
                    else if ( 15 < gameLogic.getCardLogicValue(cardTypeResult.cardDataArr[ index ][ 0 ] ) ) tmpSingleCount += 3;


                    ////改变权值
                    //if (cbBombCardType != CT_ERROR) cbTmpSingleCount += cbBombCardType ;

                    if (tmpSingleCount <= singleCardCount) {
                        //设置变量
                        outCardResult.cardCount=cardTypeResult.eachHandCardCount[index];
                        outCardResult.resultCard = cardTypeResult.cardDataArr[index].slice();
                        singleCardCount = tmpSingleCount ;
                        isFindBestCard = true ;
                    }

                }
            }
        }
    }
    //直接返回
    if (isFindBestCard) return outCardResult;

    //对王和两单
    if ( handCardCount === 4 && gameLogic.getCardLogicValue(handCardDataArr[1]) === 16 && allUserCardDataArr[undersideOfBanker].length === 1 &&
        gameLogic.getCardLogicValue(handCardDataArr[2]) < gameLogic.getCardLogicValue(allUserCardDataArr[undersideOfBanker][0])) {
        outCardResult.cardCount = 1 ;
        outCardResult.resultCard[0] = handCardDataArr[2] ;
        return outCardResult;
    }

    //四带牌型判断
    if ( this.analyseFourCardType(handCardDataArr, allUserCardDataArr[undersideOfBanker], outCardResult) ) return outCardResult;

    //对王和两单
    if ( handCardCount === 4 && gameLogic.getCardLogicValue(handCardDataArr[1]) === 16 && allUserCardDataArr[upsideOfBanker].length === 1 &&
        gameLogic.getCardLogicValue(handCardDataArr[2]) < gameLogic.getCardLogicValue(allUserCardDataArr[upsideOfBanker][0])) {
        outCardResult.cardCount = 1 ;
        outCardResult.resultCard[0] = handCardDataArr[2] ;
        return outCardResult;
    }

    //四带牌型判断
    if ( this.analyseFourCardType(handCardDataArr, allUserCardDataArr[upsideOfBanker], outCardResult) ) return outCardResult;

    //如果只剩顺牌和单只，则先出顺
    {
        if(lineCardArr.length+1===handCardCount && gameLogic.getCardType(lineCardArr) === gameProto.cardType.SINGLE_LINE) {
            outCardResult.cardCount = lineCardArr.length ;
            outCardResult.resultCard = lineCardArr.slice();
        }
        else if(threeCardArr.length+1===handCardCount && gameLogic.getCardType(threeCardArr) === gameProto.cardType.THREE_LINE) {
            outCardResult.cardCount = threeCardArr.length;
            outCardResult.resultCard = threeCardArr.slice();
        }
        else if(doubleLineCardArr.length+1===handCardCount && gameLogic.getCardType(doubleLineCardArr) === gameProto.cardType.DOUBLE_LINE) {
            outCardResult.cardCount = doubleLineCardArr.length;
            outCardResult.resultCard = doubleLineCardArr.slice();
        }
        //双王炸弹和一手
        else if(handCardCount>2 && handCardDataArr[0]===0x4f && handCardDataArr[1]===0x4e) {
            let cardType = gameLogic.getCardType(handCardDataArr.slice(2));
            if (cardType !== gameProto.cardType.ERROR && cardType !== gameProto.cardType.FOUR_LINE_TAKE_ONE && cardType !== gameProto.cardType.FOUR_LINE_TAKE_TWO){
                outCardResult.cardCount = 2 ;
                outCardResult.resultCard[0] = 0x4f ;
                outCardResult.resultCard[1] = 0x4e ;
            }
        }

        if(outCardResult.cardCount>0) return outCardResult;
    }

    //对王加一只
    if(handCardCount===3 && handCardDataArr[0]===0x4f && handCardDataArr[1]===0x4e) {
        outCardResult.cardCount = 2 ;
        outCardResult.resultCard[0] = 0x4f ;
        outCardResult.resultCard[1] = 0x4e ;
        return outCardResult;
    }
    //对王
    else if(handCardCount===2 && handCardDataArr[0]===0x4f && handCardDataArr[1]===0x4e) {
        outCardResult.cardCount = 2 ;
        outCardResult.resultCard[0] = 0x4f ;
        outCardResult.resultCard[1] = 0x4e ;
        return outCardResult;
    }

    //只剩一张和一手
    if(handCardCount>=2) {
        //上家扑克
        let upsideCanOutCardType1 = [];
        let upsideCanOutCardType2 = [];

        //下家扑克
        let undersideCanOutCardType1 = [];
        let undersideCanOutCardType2 = [];

        let firstHandCardType = gameLogic.getCardType(handCardDataArr) ;
        let secondHandCardType = gameLogic.getCardType(handCardDataArr.slice(1)) ;

        //是否有炸
        let allBombCardData = this.getAllBombCard(handCardDataArr);

        //没有炸弹
        if (allBombCardData.length <= 0 && firstHandCardType!==gameProto.cardType.THREE_LINE_TAKE_ONE && firstHandCardType!==gameProto.cardType.THREE_LINE_TAKE_TWO) {
            if(gameProto.cardType.ERROR !== firstHandCardType && firstHandCardType!==gameProto.cardType.THREE_LINE_TAKE_ONE && firstHandCardType!== gameProto.cardType.THREE_LINE_TAKE_TWO) {
                this.analyseOutCardTypePassive(allUserCardDataArr[upsideOfBanker], handCardDataArr.slice(0, handCardDataArr.length - 1), upsideCanOutCardType1) ;
                this.analyseOutCardTypePassive(allUserCardDataArr[undersideOfBanker], handCardDataArr.slice(0, handCardDataArr.length - 1), undersideCanOutCardType1);
            }
            if(gameProto.cardType.ERROR!==secondHandCardType && secondHandCardType!==gameProto.cardType.THREE_LINE_TAKE_ONE && secondHandCardType!==gameProto.cardType.THREE_LINE_TAKE_TWO) {
                this.analyseOutCardTypePassive(allUserCardDataArr[upsideOfBanker], handCardDataArr.slice(1, handCardDataArr.length), upsideCanOutCardType2) ;
                this.analyseOutCardTypePassive(allUserCardDataArr[undersideOfBanker], handCardDataArr.slice(1, handCardDataArr.length), undersideCanOutCardType2) ;
            }

            if(gameProto.cardType.ERROR!==secondHandCardType && secondHandCardType!==gameProto.cardType.THREE_LINE_TAKE_ONE && secondHandCardType!==gameProto.cardType.THREE_LINE_TAKE_TWO && upsideCanOutCardType2[secondHandCardType].cardTypeCount===0 && undersideCanOutCardType2[secondHandCardType].cardTypeCount===0 &&
                upsideCanOutCardType2[gameProto.cardType.BOMB_CARD].cardTypeCount===0 && undersideCanOutCardType2[gameProto.cardType.BOMB_CARD].cardTypeCount===0) {
                outCardResult.cardCount = handCardCount-1 ;
                outCardResult.resultCard = handCardDataArr.slice(1, handCardDataArr.length);
                return outCardResult;
            }

            if(gameProto.cardType.ERROR !== firstHandCardType && firstHandCardType !== gameProto.cardType.THREE_LINE_TAKE_ONE && firstHandCardType !== gameProto.cardType.THREE_LINE_TAKE_TWO && upsideCanOutCardType1[firstHandCardType].cardTypeCount===0 && undersideCanOutCardType1[firstHandCardType].cardTypeCount===0 &&
                upsideCanOutCardType2[gameProto.cardType.BOMB_CARD].cardTypeCount===0 && undersideCanOutCardType2[gameProto.cardType.BOMB_CARD].cardTypeCount===0) {
                outCardResult.cardCount = handCardCount-1 ;
                outCardResult.resultCard = handCardDataArr.slice(0, handCardDataArr.length - 1);
                return outCardResult;
            }

            if(gameLogic.getCardLogicValue(handCardDataArr[0])>=gameLogic.getCardLogicValue(allUserCardDataArr[upsideOfBanker][0]) &&
                gameLogic.getCardLogicValue(handCardDataArr[0])>=gameLogic.getCardLogicValue(allUserCardDataArr[undersideOfBanker][0]) &&
                gameProto.cardType.ERROR!==secondHandCardType && secondHandCardType!==gameProto.cardType.THREE_LINE_TAKE_ONE && secondHandCardType!==gameProto.cardType.THREE_LINE_TAKE_TWO &&
                upsideCanOutCardType2[gameProto.cardType.BOMB_CARD].cardTypeCount===0 && undersideCanOutCardType2[gameProto.cardType.BOMB_CARD].cardTypeCount===0) {
                outCardResult.cardCount = 1;
                outCardResult.resultCard = handCardDataArr[0];
                return outCardResult;
            }

            if(gameProto.cardType.ERROR!==secondHandCardType && secondHandCardType!==gameProto.cardType.THREE_LINE_TAKE_ONE && secondHandCardType!==gameProto.cardType.THREE_LINE_TAKE_TWO &&
                upsideCanOutCardType2[gameProto.cardType.BOMB_CARD].cardTypeCount===0 && undersideCanOutCardType2[gameProto.cardType.BOMB_CARD].cardTypeCount===0) {
                outCardResult.cardCount = handCardCount-1 ;
                outCardResult.resultCard = handCardDataArr.slice(1, handCardDataArr.length);
                return outCardResult;
            }
        }
        //还有炸弹
        else
        {
            //除去炸后的牌
            let remainCard = handCardDataArr.slice();
            gameLogic.removeCard(allBombCardData, remainCard) ;
            if (gameLogic.getCardType(remainCard) !== gameProto.cardType.ERROR) {
                outCardResult.cardCount = remainCard.length;
                outCardResult.resultCard = remainCard.slice();
                return outCardResult;
            }
        }
    }

    {
        {
            //分析扑克
            let meOutCardTypeResult = [];
            this.analyseOutCardTypeActive(handCardDataArr, meOutCardTypeResult) ;

            //计算单牌
            let minSingleCardCountArr = [MAX_COUNT, MAX_COUNT, MAX_COUNT,MAX_COUNT];
            let index = [0, 0, 0, 0];
            let outCardType = [gameProto.cardType.ERROR,gameProto.cardType.ERROR,gameProto.cardType.ERROR,gameProto.cardType.ERROR];
            let minSingleCountInFour=MAX_COUNT ;
            let minCardType=gameProto.cardType.ERROR ;
            let minIndex=0 ;

            //除炸弹外的牌
            for(let cardType=gameProto.cardType.DOUBLE; cardType<gameProto.cardType.BOMB_CARD; ++cardType){
                //相同牌型，相同长度，单连，对连等相同牌型可能长度不一样
                let tmpCardResult = meOutCardTypeResult[cardType];
                let thisHandCardCount = MAX_COUNT ;
                //上家扑克
                let upsideOutCardTypeResult = [];
                //下家扑克
                let undersideOutCardTypeResult = [];

                for(let i=0; i<tmpCardResult.cardTypeCount; ++i){
                    //拆三条判断
                    if ( cardType === gameProto.cardType.DOUBLE ) {
                        let analyseResult = gameLogic.analyseCardDataArr(handCardDataArr);
                        if ( analyseResult.singleCardData.length + analyseResult.threeCardData.length === handCardCount ) {
                            let isContinue = false ;
                            for ( let threeIndex = 0; threeIndex < analyseResult.threeCardData.length/3; ++threeIndex )
                            if ( gameLogic.getCardValue(  tmpCardResult.cardDataArr[i][0] ) === gameLogic.getCardValue( analyseResult.threeCardData[3 * threeIndex] ) )
                            {
                                isContinue = true ;
                                break ;
                            }
                            if ( isContinue ) continue ;
                        }
                    }

                    let tmpCount = this.analyseSingleCardCount(handCardDataArr, tmpCardResult.cardDataArr[i]) ;

                    //重新分析
                    if(tmpCardResult.eachHandCardCount[i]!==thisHandCardCount) {
                        thisHandCardCount = tmpCardResult.eachHandCardCount[i] ;
                        this.analyseOutCardTypePassive(allUserCardDataArr[upsideOfBanker], tmpCardResult.cardDataArr[i] ,upsideOutCardTypeResult) ;
                        this.analyseOutCardTypePassive(allUserCardDataArr[undersideOfBanker], tmpCardResult.cardDataArr[i] ,undersideOutCardTypeResult) ;
                    }
                    let index = 0 ;

                    //针对顺子，三条的大牌
                    let currentCardType = gameLogic.getCardType(tmpCardResult.cardDataArr[i]) ;
                    if (thisHandCardCount !== handCardCount && currentCardType >= gameProto.cardType.SINGLE_LINE && currentCardType <= gameProto.cardType.THREE_LINE_TAKE_TWO &&
                        ( gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][thisHandCardCount-1]) > gameLogic.getCardLogicValue(handCardDataArr[handCardCount-2]) ||
                            gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0]) >= 11 ) ) {
                        let remainCardData = handCardDataArr.slice();
                        //移除扑克
                        gameLogic.removeCard(tmpCardResult.cardDataArr[i], remainCardData) ;
                        //最大扑克
                        let currentLargestLogicCard = gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0]) ;
                        if (gameLogic.getCardType(remainCardData) === gameProto.cardType.ERROR && (currentCardType >= gameProto.cardType.THREE_LINE_TAKE_ONE &&
                                currentCardType <= gameProto.cardType.THREE_LINE_TAKE_TWO && currentLargestLogicCard >= 11 && thisHandCardCount <=5 ||
                                currentCardType === gameProto.cardType.SINGLE_LINE && thisHandCardCount <= 6 && currentLargestLogicCard >= 12 ||
                                currentCardType >= gameProto.cardType.DOUBLE_LINE && currentCardType <= gameProto.cardType.THREE_LINE && currentLargestLogicCard >= 12 && thisHandCardCount <= 8)) {
                            //暂时不出
                            if ( currentCardType >= gameProto.cardType.SINGLE_LINE && currentCardType <= gameProto.cardType.THREE_LINE &&
                                gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][thisHandCardCount - 1]) > gameLogic.getCardLogicValue(handCardDataArr[handCardCount-3]) )
                                continue ;

                            if ( currentCardType >= gameProto.cardType.THREE_LINE_TAKE_ONE && currentCardType <= gameProto.cardType.THREE_LINE_TAKE_TWO &&
                                gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0]) > gameLogic.getCardLogicValue(handCardDataArr[handCardCount-3]) )
                                continue ;
                        }
                    }

                    //针对大对（不可先出）
                    if (cardType === gameProto.cardType.DOUBLE && gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0]) >= 11) {
                        let allSingleCardData = [];
                        let allSingleCount = this.analyseSingleCardCount(handCardDataArr, null, allSingleCardData) ;
                        if (allSingleCount >= 2 && gameLogic.getCardLogicValue(allSingleCardData[allSingleCount-2]) < 10) continue ;
                    }

                    //敌方可以压住牌
                    if(upsideOutCardTypeResult[cardType].cardTypeCount>0 || undersideOutCardTypeResult[cardType].cardTypeCount>0) {
                        //上家跑掉
                        if(upsideOutCardTypeResult[cardType].eachHandCardCount[0] > 0 && allUserCardDataArr[upsideOfBanker].length<=upsideOutCardTypeResult[cardType].eachHandCardCount[0]+1)
                            continue ;

                        //下家跑掉
                        if(undersideOutCardTypeResult[cardType].eachHandCardCount[0] > 0 && allUserCardDataArr[undersideOfBanker]<=undersideOutCardTypeResult[cardType].eachHandCardCount[0]+1)
                            continue ;

                        //自己不可以再拿回牌权
                        //if(UpsideOutCardTypeResult[cbCardType].cbCardTypeCount > 0 && GetCardLogicValue(tmpCardResult.cbCardData[0][0]) < GetCardLogicValue(UpsideOutCardTypeResult[cbCardType].cbCardData[0][0]) ||
                        //	UpsideOutCardTypeResult[cbCardType].cbCardTypeCount > 0 && GetCardLogicValue(tmpCardResult.cbCardData[0][0]) < GetCardLogicValue(UpsideOutCardTypeResult[cbCardType].cbCardData[0][0]))
                        //	continue ;
                    }
                    //是否有大牌
                    if(tmpCardResult.eachHandCardCount[i] !== handCardCount) {
                        let isHaveLargeCard=false ;
                        for(let j=0; j<tmpCardResult.eachHandCardCount[i]; ++j){
                            if(gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][j])>=15) isHaveLargeCard=true ;
                            if(cardType!==gameProto.cardType.SINGLE_LINE && cardType!==gameProto.cardType.DOUBLE_LINE  && gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0])===14) isHaveLargeCard=true ;
                        }

                        if(isHaveLargeCard)
                            continue ;
                    }

                    //搜索cbMinSingleCardCount[4]的最大值
                    for(let j=0; j<4; ++j){
                        if(minSingleCardCountArr[j]>=tmpCount) {
                            minSingleCardCountArr[j] = tmpCount ;
                            index[j] = i ;
                            outCardType[j] = cardType ;
                            break ;
                        }
                    }

                    //保存最小值
                    if(minSingleCountInFour>=tmpCount) {
                        //最小牌型
                        minCardType = cardType ;
                        //最小牌型中的最小单牌
                        minSingleCountInFour=tmpCount ;
                        //最小牌型中的最小牌
                        minIndex=i ;
                    }
                }
            }

            if(minSingleCountInFour>=this.analyseSingleCardCount(handCardDataArr,null)+3 &&
                (allUserCardDataArr[undersideOfBanker].length>=4 && allUserCardDataArr[upsideOfBanker].length>=4))
                minSingleCountInFour=MAX_COUNT ;

            if(minSingleCountInFour!==MAX_COUNT) {
                let tmpIndex = minIndex ;

                //选择最小牌
                for(let i=0; i<4; ++i){
                    if(outCardType[i]===minCardType && minSingleCardCountArr[i]<=minSingleCountInFour &&
                        gameLogic.getCardLogicValue(meOutCardTypeResult[minCardType].cardDataArr[index[i]][0])<gameLogic.getCardLogicValue(meOutCardTypeResult[minCardType].cardDataArr[tmpIndex][0]))
                        tmpIndex = index[i] ;
                }

                //对王加一只
                if(handCardCount===3 && gameLogic.getCardColor(handCardDataArr[0])===0x40 && gameLogic.getCardColor(handCardDataArr[1])===0x40) {
                    outCardResult.cardCount = 2 ;
                    outCardResult.resultCard[0] = 0x4f ;
                    outCardResult.resultCard[1] = 0x4e ;
                    return outCardResult;
                }
                //对王
                else if(handCardCount===3 && gameLogic.getCardColor(handCardDataArr[0])===0x40 && gameLogic.getCardColor(handCardDataArr[1])===0x40) {
                    outCardResult.cardCount = 2 ;
                    outCardResult.resultCard[0] = 0x4f ;
                    outCardResult.resultCard[1] = 0x4e ;
                    return outCardResult;
                }
                else {
                    //设置变量
                    outCardResult.cardCount=meOutCardTypeResult[minCardType].eachHandCardCount[tmpIndex];
                    outCardResult.resultCard = meOutCardTypeResult[minCardType].cardDataArr[tmpIndex].slice();
                    return outCardResult;
                }
            }

            //还没有找到适合的牌则从大出到小
            if(outCardResult.cardCount<=0 && (allUserCardDataArr[undersideOfBanker].length === 1 || allUserCardDataArr[upsideOfBanker].length === 1)) {
                //只有一张牌时不能放走
                if(meOutCardTypeResult[gameProto.cardType.SINGLE].cardTypeCount>0) {
                    let index=MAX_COUNT ;
                    for(let i=0; i<meOutCardTypeResult[gameProto.cardType.SINGLE].cardTypeCount; ++i){
                        if((allUserCardDataArr[undersideOfBanker] === 1 && gameLogic.getCardLogicValue(meOutCardTypeResult[gameProto.cardType.SINGLE].cardDataArr[i][0])>=gameLogic.getCardLogicValue(allUserCardDataArr[undersideOfBanker][0])) ||
                            (allUserCardDataArr[upsideOfBanker] === 1 && gameLogic.getCardLogicValue(meOutCardTypeResult[gameProto.cardType.SINGLE].cardDataArr[i][0])>=gameLogic.getCardLogicValue(allUserCardDataArr[upsideOfBanker][0]))) {
                            index=i ;
                        }
                        else break ;
                    }

                    if(MAX_COUNT!==index) {
                        outCardResult.cardCount = meOutCardTypeResult[gameProto.cardType.SINGLE].eachHandCardCount[index];
                        outCardResult.resultCard = meOutCardTypeResult[gameProto.cardType.SINGLE].cardDataArr[index].slice();
                        return outCardResult;
                    }
                }
            }
        }
    }
    let firstCard=0 ;
    //过滤王和2
    for(let i=0; i<handCardCount; ++i)
    if(gameLogic.getCardLogicValue(handCardDataArr[i])<15) {
        firstCard = i ;
        break ;
    }

    if(firstCard<handCardCount-1)
        this.analyseOutCardTypeActive(handCardDataArr.slice(firstCard), cardTypeResultArr) ;
    /*else
        AnalyseOutCardType(cbHandCardData, cbHandCardCount, CardTypeResult) ;*/

    //计算单牌
    let minSingleCardCount = [MAX_COUNT, MAX_COUNT, MAX_COUNT, MAX_COUNT];
    let index = [0, 0, 0, 0];
    let outCardType=[gameProto.cardType.ERROR, gameProto.cardType.ERROR, gameProto.cardType.ERROR, gameProto.cardType.ERROR];
    let minSingleCountInFour=MAX_COUNT ;
    let minCardType=gameProto.cardType.ERROR ;
    let minIndex=0 ;

    //除炸弹外的牌
    for(let cardType=gameProto.cardType.SINGLE; cardType<gameProto.cardType.BOMB_CARD; ++cardType){
        let tmpCardResult = cardTypeResultArr[cardType] ;
        for(let i=0; i<tmpCardResult.cardTypeCount; ++i){
            //闲家可以走掉
            if ( gameLogic.compareCard(tmpCardResult.cardDataArr[i], allUserCardDataArr[undersideOfBanker]) ||
                gameLogic.compareCard(tmpCardResult.cardDataArr[i],  allUserCardDataArr[upsideOfBanker]))
                continue ;

            //针对顺子，三条的大牌
            if ( tmpCardResult.eachHandCardCount[i] !== handCardCount && cardType >= gameProto.cardType.SINGLE_LINE && cardType <= gameProto.cardType.THREE_LINE_TAKE_TWO &&
                ( gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][tmpCardResult.eachHandCardCount[i]-1]) > gameLogic.getCardLogicValue(handCardDataArr[handCardCount-2]) ||
                    gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0]) >= 11 )) {
                let remainCardData = handCardDataArr.slice();
                gameLogic.removeCard(tmpCardResult.cardDataArr[i], remainCardData);
                //最大扑克
                let currentLargestLogicCard = gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0]) ;

                if (gameLogic.getCardType(remainCardData) === gameProto.cardType.ERROR && (cardType >= gameProto.cardType.THREE_LINE_TAKE_ONE &&
                        cardType <= gameProto.cardType.THREE_LINE_TAKE_TWO && currentLargestLogicCard >= 11 && tmpCardResult.eachHandCardCount[i] <=5 ||
                        cardType === gameProto.cardType.SINGLE_LINE && tmpCardResult.eachHandCardCount[i] <= 6 && currentLargestLogicCard >= 12 ||
                        cardType >= gameProto.cardType.DOUBLE_LINE && cardType <= gameProto.cardType.THREE_LINE && currentLargestLogicCard >= 12 && tmpCardResult.eachHandCardCount[i] <= 8)) {
                    //暂时不出
                    if ( cardType >= gameProto.cardType.SINGLE_LINE && cardType <= gameProto.cardType.THREE_LINE &&
                        gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][tmpCardResult.eachHandCardCount[i] - 1]) > gameLogic.getCardLogicValue(handCardDataArr[handCardCount-3]) )
                        continue ;

                    if (cardType >= gameProto.cardType.THREE_LINE_TAKE_ONE && cardType <= gameProto.cardType.THREE_LINE_TAKE_TWO &&
                        gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0]) > gameLogic.getCardLogicValue(handCardDataArr[handCardCount-3]) )
                        continue ;
                }
            }

            let tmpCount = this.analyseSingleCardCount(handCardDataArr, tmpCardResult.cardDataArr[i]) ;

            //搜索cbMinSingleCardCount[4]的最大值
            for(let j=0; j<4; ++j){
                if(minSingleCardCount[j]>=tmpCount) {
                    minSingleCardCount[j] = tmpCount ;
                    index[j] = i ;
                    outCardType[j] = cardType ;
                    break ;
                }
            }

            //保存最小值
            if(minSingleCountInFour>=tmpCount) {
                //最小牌型
                minCardType = cardType ;
                //最小牌型中的最小单牌
                minSingleCountInFour=tmpCount ;
                //最小牌型中的最小牌
                minIndex=i ;
            }
        }
    }

    if(minSingleCountInFour!==MAX_COUNT) {
        let tmpIndex = minIndex ;

        //选择最小牌
        for(let i=0; i<4; ++i){
            if(outCardType[i]===minCardType && minSingleCardCount[i]<=minSingleCountInFour &&
                gameLogic.getCardLogicValue(cardTypeResultArr[minCardType].cardDataArr[index[i]][0])<gameLogic.getCardLogicValue(cardTypeResultArr[minCardType].cardDataArr[tmpIndex][0]))
                tmpIndex = index[i] ;
        }

        //对王加一只
        if(handCardCount===3 && gameLogic.getCardColor(handCardDataArr[0])===0x40 && gameLogic.getCardColor(handCardDataArr[1])===0x40) {
            outCardResult.cardCount = 2 ;
            outCardResult.resultCard[0] = 0x4f ;
            outCardResult.resultCard[1] = 0x4e ;
            return outCardResult;
        }
        //对王
        else if(handCardCount===2 && gameLogic.getCardColor(handCardDataArr[0])===0x40 && gameLogic.getCardColor(handCardDataArr[1])===0x40) {
            outCardResult.cardCount = 2 ;
            outCardResult.resultCard[0] = 0x4f ;
            outCardResult.resultCard[1] = 0x4e ;
            return outCardResult;
        }
        else {
            //设置变量
            outCardResult.cardCount=cardTypeResultArr[minCardType].eachHandCardCount[tmpIndex];
            outCardResult.resultCard = cardTypeResultArr[minCardType].cardDataArr[tmpIndex].slice();
            return outCardResult;
        }
    }
   /* //如果只剩炸弹
    else if (CardTypeResult[CT_BOMB_CARD].cbCardTypeCount > 0)
    {
        //BYTE Index=0 ;
        //BYTE cbLogicCardValue = GetCardLogicValue(0x4F)+1 ;
        ////最小炸弹
        //for(BYTE i=0; i<CardTypeResult[CT_BOMB_CARD].cbCardTypeCount; ++i)
        //	if(cbLogicCardValue>GetCardLogicValue(CardTypeResult[CT_BOMB_CARD].cbCardData[i][0]))
        //	{
        //		cbLogicCardValue = GetCardLogicValue(CardTypeResult[CT_BOMB_CARD].cbCardData[i][0]) ;
        //		Index = i ;
        //	}

        //	//设置变量
        //	OutCardResult.cbCardCount=CardTypeResult[CT_BOMB_CARD].cbEachHandCardCount[Index];
        //	CopyMemory(OutCardResult.cbResultCard,CardTypeResult[CT_BOMB_CARD].cbCardData[Index],CardTypeResult[CT_BOMB_CARD].cbEachHandCardCount[Index]*sizeof(BYTE));

        //	return ;
    }*/

    let allSingleCardData = [];
    let allSingleCardCount = this.analyseSingleCardCount(handCardDataArr, null,allSingleCardData) ;

    if ( allSingleCardCount > 0 ) {
        //如果都没有搜索到就出最小的一张
        if ( ( 1 === allUserCardDataArr[undersideOfBanker].length || 1 === allUserCardDataArr[upsideOfBanker].length ) && allSingleCardCount >= 2 ) {
            outCardResult.cardCount = 1 ;
            outCardResult.resultCard[0] = allSingleCardData[allSingleCardCount-2] ;
        }
        else {
            outCardResult.cardCount = 1 ;
            outCardResult.resultCard[0] = allSingleCardData[allSingleCardCount-1] ;
        }
        return outCardResult;
    }

    //如果都没有搜索到就出最小的一张
    outCardResult.cardCount = 1 ;
    outCardResult.resultCard[0] = handCardDataArr[handCardCount-1] ;

    return outCardResult;

};

// 地主被动出牌
logic.bankerOutCardPassive = function (handCardDataArr, outCardUserChairID, turnCardDataArr, bankerUserChairID, allUserCardDataArr) {
    let outCardResult = {
        cardCount: 0,
        resultCard: []
    };

    let handCardCount = handCardDataArr.length;

    //出牌类型
    let outCardType = gameLogic.getCardType(turnCardDataArr) ;

    let cardTypeResultArr = [];
    this.analyseOutCardTypePassive(handCardDataArr,turnCardDataArr, cardTypeResultArr) ;

    let undersideUser = (bankerUserChairID+1)%GAME_PLAYER ;
    let upsideUser = (undersideUser+1)%GAME_PLAYER ;

    //只剩炸弹
    if(handCardCount===cardTypeResultArr[gameProto.cardType.BOMB_CARD].eachHandCardCount[0] && (outCardType<gameProto.cardType.BOMB_CARD ||
            gameLogic.getCardLogicValue(cardTypeResultArr[gameProto.cardType.BOMB_CARD].cardDataArr[0][0])>gameLogic.getCardLogicValue(turnCardDataArr[0]))) {
        outCardResult.cardCount = cardTypeResultArr[gameProto.cardType.BOMB_CARD].eachHandCardCount[0] ;
        outCardResult.resultCard = cardTypeResultArr[gameProto.cardType.BOMB_CARD].cardDataArr[0].slice();
        return outCardResult;
    }
    //双王炸弹和一手
    else if(handCardCount>2 && handCardDataArr[0]===0x4f && handCardDataArr[1]===0x4e ) {
        let leftCardType = gameLogic.getCardType(handCardDataArr.slice(2));
        if (leftCardType !== gameProto.cardType.ERROR && leftCardType !== gameProto.cardType.FOUR_LINE_TAKE_ONE && leftCardType !== gameProto.cardType.FOUR_LINE_TAKE_TWO){
            outCardResult.cardCount = 2;
            outCardResult.resultCard[0] = 0x4f ;
            outCardResult.resultCard[1] = 0x4e ;
            return outCardResult;
        }
    }

    //炸弹和一手
    let remainCard = [];
    let remainCount = 0;
    let allBombCard = this.getAllBombCard(handCardDataArr);
    let allBombCount = allBombCard.length;
    //出炸判断
    if(allBombCount>0) {
        //剩余扑克
        remainCard = handCardDataArr.slice();
        gameLogic.removeCard(allBombCard, remainCard);
        remainCount = remainCard.length;

        if(gameProto.cardType.ERROR !== gameLogic.getCardType(remainCard) ||
            (2===remainCount && gameLogic.getCardLogicValue(remainCard[0])>gameLogic.getCardLogicValue(allUserCardDataArr[undersideUser][0]) &&
                gameLogic.getCardLogicValue(remainCard[0])>gameLogic.getCardLogicValue(allUserCardDataArr[upsideUser][0]))) {
            if((outCardType<gameProto.cardType.BOMB_CARD || gameLogic.getCardLogicValue(allBombCard[0])>gameLogic.getCardLogicValue(turnCardDataArr[0])) &&
                ( cardTypeResultArr[outCardType].cardTypeCount <= 0 || gameProto.cardType.ERROR !== gameLogic.getCardType(remainCard) ) ) {
                //双王炸弹
                if(gameLogic.getCardColor(allBombCard[0])===0x40) {
                    outCardResult.cardCount = 2 ;
                    outCardResult.resultCard[0] = 0x4f ;
                    outCardResult.resultCard[1] = 0x4e ;
                    return outCardResult;
                }
                else {
                    //分析闲家牌
                    let underSideBankerAllBombCard = this.getAllBombCard(allUserCardDataArr[undersideUser]);
                    let underSideBankerAllBombCardCount = underSideBankerAllBombCard.length;

                    let upSideBankerAllBombCard = this.getAllBombCard(allUserCardDataArr[upsideUser]);
                    let upSideBankerAllBombCardCount = upSideBankerAllBombCard.length;

                    if ( !gameLogic.compareCard( turnCardDataArr, remainCard) ||  ( underSideBankerAllBombCardCount <= 0 && upSideBankerAllBombCardCount <= 0 )||
                        ( gameLogic.getCardLogicValue( allBombCard[0] ) > gameLogic.getCardLogicValue( underSideBankerAllBombCard[0] ) &&
                            gameLogic.getCardLogicValue( allBombCard[0] ) > gameLogic.getCardLogicValue( upSideBankerAllBombCard[0] )) ) {
                        outCardResult.cardCount = 4 ;
                        outCardResult.resultCard = allBombCard.slice(0, 4);
                        return outCardResult;
                    }
                }
            }
        }
    }

    //判断可否出完
    let singleCardCount = MAX_COUNT+gameProto.cardType.MISSILE_CARD ;
    let isFindBestCard = false ;
    for(let cardType=gameProto.cardType.SINGLE; cardType<=gameProto.cardType.MISSILE_CARD; ++cardType)
    if(cardTypeResultArr[cardType].cardTypeCount>0) {
        let cardTypeResult = cardTypeResultArr[cardType];
        for(let i=0; i<cardTypeResult.cardTypeCount; ++i){
            if(this.testOutAllCard(outCardUserChairID, bankerUserChairID, cardTypeResult.cardDataArr[i], false, allUserCardDataArr)) {
                //计算单牌
                let tmpSingleCount = this.analyseSingleCardCount(handCardDataArr, cardTypeResult.cardDataArr[i]) ;
                //结果判断
                if (tmpSingleCount >= MAX_COUNT) continue ;

                //炸弹优先级排后
                let bombCardType = gameLogic.getCardType(cardTypeResult.cardDataArr[i], cardTypeResult.eachHandCardCount[i]) ;
                if (bombCardType === gameProto.cardType.BOMB_CARD) tmpSingleCount += 4 ;
                else if (bombCardType === gameProto.cardType.MISSILE_CARD) tmpSingleCount += 5 ;

                ////改变权值
                //if (cbBombCardType != CT_ERROR) cbTmpSingleCount += cbBombCardType ;

                //不出炸弹
                //BYTE cbWantOutCardType = GetCardType(CardTypeResult[cbCardType].cbCardData[lIndex], CardTypeResult[cbCardType].cbEachHandCardCount[lIndex]) ;
                //if (CardTypeResult[cbOutCardType].cbCardTypeCount > 0 && cbOutCardType < CT_BOMB_CARD && cbWantOutCardType >= CT_BOMB_CARD) continue ;

                if (tmpSingleCount <= singleCardCount) {
                    //设置变量
                    outCardResult.cardCount=cardTypeResult.eachHandCardCount[i];
                    outCardResult.resultCard = cardTypeResult.cardDataArr[i].slice();
                    singleCardCount = tmpSingleCount ;
                    isFindBestCard = true ;
                }
            }
        }
    }
    //直接返回
    if (isFindBestCard) return outCardResult;

    //取出四个最小单牌
    let minSingleCardCount = [MAX_COUNT, MAX_COUNT, MAX_COUNT, MAX_COUNT];
    let indexArr = [0, 0, 0, 0];
    let minSingleCountInFour=MAX_COUNT ;

    //可出扑克（这里已经过滤掉炸弹了）
    let canOutCardTypeResult = cardTypeResultArr[outCardType];

    for(let i=0; i<canOutCardTypeResult.cardTypeCount; ++i){
        //最小单牌
        let tmpCount = this.analyseSingleCardCount(handCardDataArr,canOutCardTypeResult.cardDataArr[i]) ;
        //搜索cbMinSingleCardCount[4]的最大值
        for(let j=0; j<4; ++j){
            if(minSingleCardCount[j]>=tmpCount) {
                minSingleCardCount[j] = tmpCount ;
                indexArr[j] = i ;
                break ;
            }
        }

    }

    for(let i=0; i<4; ++i)
    if(minSingleCountInFour>minSingleCardCount[i]) minSingleCountInFour = minSingleCardCount[i] ;

    //原始单牌数
    let originSingleCardCount = this.analyseSingleCardCount(handCardDataArr, null) ;

    if(canOutCardTypeResult.cardTypeCount>0 && minSingleCountInFour < MAX_COUNT) {
        let minLogicCardValue = gameLogic.getCardLogicValue(0x4F)+1 ;
        let isFindCard = false ;
        let canOutIndex=0 ;
        for(let i=0; i<4; ++i){
            let tmpIndex = indexArr[i] ;

            if((minSingleCardCount[i]<originSingleCardCount+3)  &&  (minSingleCardCount[i]<=minSingleCountInFour || minSingleCardCount[i]<=minSingleCountInFour+1 &&
                    canOutCardTypeResult.cardType >= gameProto.cardType.THREE_LINE_TAKE_ONE && canOutCardTypeResult.cardType <= gameProto.cardType.THREE_LINE_TAKE_TWO ) &&
                minLogicCardValue>gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0])) {
                //针对大牌
                let isNoLargeCard = true ;

                //当出牌玩家手上牌数大于4，而且出的是小于K的牌而且不是出牌手上的最大牌时，不能出2去打
                if(allUserCardDataArr[outCardUserChairID].length>=4 && handCardCount>=5  && canOutCardTypeResult.eachHandCardCount[tmpIndex]>=2 &&
                    gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0])>=15 &&
                    gameLogic.getCardLogicValue(turnCardDataArr[0])<13 &&
                    (outCardUserChairID===undersideUser&&gameLogic.getCardLogicValue(turnCardDataArr[0])<gameLogic.getCardLogicValue(allUserCardDataArr[undersideUser][0]) || outCardUserChairID===upsideUser&&gameLogic.getCardLogicValue(turnCardDataArr[0])<gameLogic.getCardLogicValue(allUserCardDataArr[upsideUser][0])) &&
                    canOutCardTypeResult.eachHandCardCount[tmpIndex]!==handCardCount)
                    isNoLargeCard=false ;

                //搜索有没有大牌（针对飞机带翅膀后面的带牌）
                for(let k=3; k<canOutCardTypeResult.eachHandCardCount[tmpIndex]; ++k){
                    if(gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][k])>=15 &&
                        canOutCardTypeResult.eachHandCardCount[tmpIndex]!==handCardCount)
                        isNoLargeCard = false ;
                }
                if(isNoLargeCard) {
                    isFindCard = true ;
                    canOutIndex = tmpIndex ;
                    minLogicCardValue = gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0]) ;
                }
            }
        }

        if(isFindCard) {
            //最大牌
            let largestLogicCard ;
            if(outCardUserChairID===undersideUser) largestLogicCard = gameLogic.getCardLogicValue(allUserCardDataArr[undersideUser][0]);
            else if(outCardUserChairID===upsideUser) largestLogicCard = gameLogic.getCardLogicValue(allUserCardDataArr[upsideUser][0]);
            let isCanOut=true ;

            //王只压2
            if(gameLogic.getCardLogicValue(turnCardDataArr[0])<largestLogicCard) {
                if(gameLogic.getCardColor(canOutCardTypeResult.cardDataArr[canOutIndex][0])===0x40 && gameLogic.getCardLogicValue(turnCardDataArr[0])<=14 && handCardCount>5) {
                    isCanOut = false ;
                }
            }

            //双王判断
            if(gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[canOutIndex][0])>=16 && handCardCount>=2 && handCardDataArr[0]===0x4F && handCardDataArr[1]===0x4E) {
                let isOutMissileCard = false ;
                //一手牌和一个炸弹
                let remainCardData = handCardDataArr.slice();
                gameLogic.removeCard([0x4F, 0x4E], remainCardData) ;
                let remainCardCount = remainCardData.length;
                let remainCardType = gameLogic.getCardType(remainCardData);
                if(gameProto.cardType.ERROR!==remainCardType) isOutMissileCard = true;

                //只剩少量牌
                if (!isOutMissileCard){
                    if(remainCardCount<5 && gameLogic.getCardLogicValue(remainCardData[0])>=14) isOutMissileCard = true;
                }

                //炸后单牌数
                if (!isOutMissileCard){
                    let singleCardCount = this.analyseSingleCardCount(handCardDataArr, canOutCardTypeResult.cardDataArr[canOutIndex]) ;
                    if(singleCardCount<=1 && gameLogic.getCardLogicValue(remainCardData[0])>=11) isOutMissileCard = true;
                }

                //还有小牌
                if(isOutMissileCard){
                    if (gameLogic.getCardLogicValue(remainCardData[0]) <= 10 && gameProto.cardType.ERROR === remainCardType &&
                        (gameLogic.getCardLogicValue(allUserCardDataArr[undersideUser][0]) > 10 || gameLogic.getCardLogicValue(allUserCardDataArr[upsideUser][0]) > 10))
                        isOutMissileCard = false ;
                }


                //火箭扑克
                if(isOutMissileCard) {
                    //优先其他炸弹
                    let index = cardTypeResultArr[gameProto.cardType.BOMB_CARD].cardTypeCount - 1 ;
                    outCardResult.cardCount = cardTypeResultArr[gameProto.cardType.BOMB_CARD].eachHandCardCount[index] ;
                    outCardResult.resultCard = cardTypeResultArr[gameProto.cardType.BOMB_CARD].cardDataArr[index].slice();
                    return outCardResult;
                }
            }

            if(isCanOut) {
                //设置变量
                outCardResult.cardCount=canOutCardTypeResult.eachHandCardCount[canOutIndex];
                outCardResult.resultCard = canOutCardTypeResult.cardDataArr[canOutIndex].slice();
                return outCardResult;
            }
        }

        if(outCardType===gameProto.cardType.SINGLE) {
            //闲家的最大牌
            let largestLogicCard ;
            if(outCardUserChairID===undersideUser) largestLogicCard = gameLogic.getCardLogicValue(allUserCardDataArr[undersideUser][0]) ;
            else if(outCardUserChairID===upsideUser) largestLogicCard = gameLogic.getCardLogicValue(allUserCardDataArr[upsideUser][0]) ;

            if(gameLogic.getCardLogicValue(turnCardDataArr[0])===14 ||
                gameLogic.getCardLogicValue(turnCardDataArr[0])>=largestLogicCard ||
                (gameLogic.getCardLogicValue(turnCardDataArr[0])<largestLogicCard-1) ||
                (outCardUserChairID===undersideUser&&allUserCardDataArr[undersideUser].length<=5 || outCardUserChairID===upsideUser&&allUserCardDataArr[upsideUser]<=5)) {
                //取一张大于等于2而且要比闲家出的牌大的牌，
                let index=MAX_COUNT ;
                for(let i=0; i<handCardCount; ++i)
                if(gameLogic.getCardLogicValue(handCardDataArr[i])>gameLogic.getCardLogicValue(turnCardDataArr[0]) &&
                    gameLogic.getCardLogicValue(handCardDataArr[i])>=15) {
                    index = i ;
                }
                if(index!==MAX_COUNT) {
                    //设置变量
                    outCardResult.cardCount=1;
                    outCardResult.resultCard[0] = handCardDataArr[index] ;

                    return outCardResult;
                }
            }
        }


        let minSingleCount=MAX_COUNT ;
        let index=0 ;
        for(let i=0; i<cardTypeResultArr[outCardType].cardTypeCount; ++i) {
            let tmpCount = this.analyseSingleCardCount(handCardDataArr, cardTypeResultArr[outCardType].cardDataArr[i]) ;
            if(minSingleCount>=tmpCount) {
                minSingleCount = tmpCount ;
                index = i ;
            }
        }
        //设置变量
        outCardResult.cardCount=cardTypeResultArr[outCardType].eachHandCardCount[index];
        outCardResult.resultCard = cardTypeResultArr[outCardType].cardDataArr[index].slice();

        return outCardResult;
    }

    //还要考虑炸弹
    if(cardTypeResultArr[gameProto.cardType.BOMB_CARD].cardTypeCount>0) {
        let bombCardTypeResult = cardTypeResultArr[gameProto.cardType.BOMB_CARD] ;
        let minLogicValue = gameLogic.getCardLogicValue(bombCardTypeResult.cardDataArr[0][0]) ;
        let tmpIndex = 0 ;
        for(let i=0; i<bombCardTypeResult.cardTypeCount; ++i){
            if(minLogicValue>gameLogic.getCardLogicValue(bombCardTypeResult.cardDataArr[i][0])) {
                minLogicValue = gameLogic.getCardLogicValue(bombCardTypeResult.cardDataArr[i][0]) ;
                tmpIndex = i ;
            }
        }
        let isOutBomb=false ;

        //另一闲家
        //WORD wOtherUser=INVALID_CHAIR ;
        //for(WORD wUser=0; wUser<GAME_PLAYER; ++wUser)
        //	if(wUser!=wOutCardUser && wUser!=m_wBankerUser) wOtherUser=wOtherUser ;

        //一手牌和一个炸弹
        let remainCardData = handCardDataArr.slice();
        gameLogic.removeCard(bombCardTypeResult.cardDataArr[tmpIndex], remainCardData);
        let remainCardType = gameLogic.getCardType(remainCardData);
        let remainCardCount = remainCardData.length;
        if(gameProto.cardType.ERROR!==remainCardType) isOutBomb = true ;

        //炸后单牌数
        if (!isOutBomb){
            let singleCardCount = this.analyseSingleCardCount(handCardDataArr, bombCardTypeResult.cardDataArr[tmpIndex]) ;
            if(singleCardCount===0 && gameLogic.getCardLogicValue(remainCardData[0]) >
                gameLogic.getCardLogicValue(allUserCardDataArr[upsideUser === outCardUserChairID ? undersideUser : upsideUser][0])) isOutBomb = true ;
        }

        //只剩一手
        if (!isOutBomb){
            if(remainCardType>gameProto.cardType.ERROR && remainCardType<gameProto.cardType.FOUR_LINE_TAKE_ONE && gameLogic.getCardLogicValue(allUserCardDataArr[outCardUserChairID][0])<15 &&
                singleCardCount < 2 && (gameLogic.getCardLogicValue(remainCardData[0]) >= gameLogic.getCardLogicValue(allUserCardDataArr[undersideUser][0]) &&
                    gameLogic.getCardLogicValue(remainCardData[0]) >= gameLogic.getCardLogicValue(allUserCardDataArr[upsideUser][0]))) isOutBomb = true ;
        }

        //反春天
        //if (remainCardType !== gameProto.cardType.ERROR && m_lBankerOutCardCount == 1) bOutBomb = true ;

        //只剩少量牌
        if (!isOutBomb){
            let remainLargestCard = gameLogic.getCardLogicValue(remainCardData[0]) ;
            if(remainCardCount<5 && remainCardCount>0 && (remainLargestCard!==gameLogic.getCardLogicValue(bombCardTypeResult.cardDataArr[tmpIndex][0])) &&
                remainLargestCard>gameLogic.getCardLogicValue(allUserCardDataArr[outCardUserChairID][0]) && remainLargestCard > 14) isOutBomb = true ;
        }

        //分析扑克
        //let analyseResult = gameLogic.analyseCardDataArr(remainCardData);
        //if (m_cbUserCardCount[wOutCardUser] == 1 && (AnalyseResult.cbDoubleCount * 2 + AnalyseResult.cbThreeCount * 3 + AnalyseResult.cbFourCount * 4 + 1 >= cbRemainCardCount)) bOutBomb = true ;


        //设置变量
        if(isOutBomb) {
            outCardResult.cardCount = bombCardTypeResult.eachHandCardCount[tmpIndex];
            outCardResult.resultCard = bombCardTypeResult.cardDataArr[tmpIndex].slice();
        }
        return outCardResult;
    }

    return outCardResult;
};

// 地主上家（先出牌）
logic.upsideOfBankerOutCardActive = function(handCardDataArr, meChairID, bankerUserChairID, allUserCardDataArr) {
    let outCardResult = {
        cardCount: 0,
        resultCard: []
    };

    let handCardCount = handCardDataArr.length;
    //地主只有一张，从大到小出牌
    if (allUserCardDataArr[bankerUserChairID].length === 1) {
        let singleCardData = [];
        let singleCardCount = this.analyseSingleCardCount(handCardDataArr, null, singleCardData) ;

        //只剩单牌
        if (singleCardCount === handCardCount) {
            outCardResult.cardCount = 1 ;
            outCardResult.resultCard[0] = handCardDataArr[0] ;
            return outCardResult;
        }
    }

    let cardType = gameLogic.getCardType(handCardDataArr.slice());
    //只剩一手牌
    if (cardType !== gameProto.cardType.ERROR && cardType !== gameProto.cardType.FOUR_LINE_TAKE_ONE && cardType !== gameProto.cardType.FOUR_LINE_TAKE_TWO){
        outCardResult.cardCount = handCardCount ;
        outCardResult.resultCard = handCardDataArr.slice();
        return outCardResult;
    }

    let cardTypeResultArr = [];

    let lineCard = this.getAllLineCard(handCardDataArr);
    let threeLineCard = this.getAllThreeCard(handCardDataArr);
    let doubleLineCard = this.getAllDoubleCard(handCardDataArr);

    //判断可否出完
    let singleCardCount = MAX_COUNT+gameProto.cardType.MISSILE_CARD ;
    let isFindBestCard = false ;
    this.analyseOutCardTypeActive(handCardDataArr, cardTypeResultArr) ;
    for(let cardType=gameProto.cardType.SINGLE; cardType<=gameProto.cardType.MISSILE_CARD; ++cardType)
    if(cardTypeResultArr[cardType].cardTypeCount>0) {
        let cardTypeResult = cardTypeResultArr[cardType];
        for(let index=0; index<cardTypeResult.cardTypeCount; ++index) {
            let tmpChairID = (bankerUserChairID+2)%GAME_PLAYER ;
            if(this.testOutAllCard(tmpChairID, bankerUserChairID, cardTypeResult.cardDataArr[index], true, allUserCardDataArr)) {
                //计算单牌
                let tmpSingleCount = this.analyseSingleCardCount(handCardDataArr, cardTypeResult.cardDataArr[index]) ;

                //结果判断
                if (tmpSingleCount >= MAX_COUNT) continue ;

                //炸弹优先级排后
                let bombCardType = gameLogic.getCardType(cardTypeResult.cardDataArr[index]) ;
                if (bombCardType === gameProto.cardType.BOMB_CARD) tmpSingleCount += 4 ;
                else if (bombCardType === gameProto.cardType.MISSILE_CARD) tmpSingleCount += 5 ;
                else if ( 15 === gameLogic.getCardLogicValue( cardTypeResult.cardDataArr[ index ][ 0 ] ) ) tmpSingleCount += 2;
                else if ( 15 < gameLogic.getCardLogicValue(cardTypeResult.cardDataArr[ index ][ 0 ] ) ) tmpSingleCount += 3;


                ////改变权值
                //if (cbBombCardType != CT_ERROR) cbTmpSingleCount += cbBombCardType ;

                if (tmpSingleCount <= singleCardCount) {
                    //设置变量
                    outCardResult.cardCount=cardTypeResult.eachHandCardCount[index];
                    outCardResult.resultCard = cardTypeResult.cardDataArr[index].slice();
                    singleCardCount = tmpSingleCount ;
                    isFindBestCard = true ;
                }

            }
        }
    }
    //直接返回
    if (isFindBestCard) return outCardResult;

    //对王和两单
    if ( handCardCount === 4 && gameLogic.getCardLogicValue(handCardDataArr[1]) === 16 && allUserCardDataArr[bankerUserChairID].length === 1 &&
        gameLogic.getCardLogicValue(handCardDataArr[2]) < gameLogic.getCardLogicValue(allUserCardDataArr[bankerUserChairID][0])) {
        outCardResult.cardCount = 1 ;
        outCardResult.resultCard[0] = handCardDataArr[2] ;
        return outCardResult;
    }

    //四带牌型判断
    if ( this.analyseFourCardType(handCardDataArr, allUserCardDataArr[bankerUserChairID], outCardResult) ) return outCardResult;

    //如果只剩顺牌和单只，则先出顺
    {
        if(lineCard.length+1===handCardCount && gameLogic.getCardType(lineCard) === gameProto.cardType.SINGLE_LINE) {
            outCardResult.cardCount = lineCard.length ;
            outCardResult.resultCard = lineCard.slice();
        }
        else if(threeLineCard.length+1===handCardCount && gameLogic.getCardType(threeLineCard) === gameProto.cardType.THREE_LINE) {
            outCardResult.cardCount = threeLineCard.length;
            outCardResult.resultCard = threeLineCard.slice();
        }
        else if(doubleLineCard.length+1===handCardCount && gameLogic.getCardType(doubleLineCard) === gameProto.cardType.DOUBLE_LINE) {
            outCardResult.cardCount = doubleLineCard.length;
            outCardResult.resultCard = doubleLineCard.slice();
        }
        //双王炸弹和一手
        else if(handCardCount>2 && handCardDataArr[0]===0x4f && handCardDataArr[1]===0x4e) {
            let cardType = gameLogic.getCardType(handCardDataArr.slice(2));
            if (cardType !== gameProto.cardType.ERROR && cardType !== gameProto.cardType.FOUR_LINE_TAKE_ONE && cardType !== gameProto.cardType.FOUR_LINE_TAKE_TWO){
                outCardResult.cardCount = 2 ;
                outCardResult.resultCard[0] = 0x4f ;
                outCardResult.resultCard[1] = 0x4e ;
            }
        }

        if(outCardResult.cardCount>0) return outCardResult;
    }

    //对王加一只
    if(handCardCount===3 && handCardDataArr[0]===0x4f && handCardDataArr[1]===0x4e) {
        outCardResult.cardCount = 2 ;
        outCardResult.resultCard[0] = 0x4f ;
        outCardResult.resultCard[1] = 0x4e ;
        return outCardResult;
    }
    //对王
    else if(handCardCount===2 && handCardDataArr[0]===0x4f && handCardDataArr[1]===0x4e) {
        outCardResult.cardCount = 2 ;
        outCardResult.resultCard[0] = 0x4f ;
        outCardResult.resultCard[1] = 0x4e ;
        return outCardResult;
    }

    //只剩一张和一手
    if(handCardCount>=2) {
        // 庄家扑克
        let bankerCanOutCardType1 = [];
        let bankerCanOutCardType2 = [];

        let firstHandCardType = gameLogic.getCardType(handCardDataArr) ;
        let secondHandCardType = gameLogic.getCardType(handCardDataArr.slice(1)) ;

        //是否有炸
        let allBombCardData = this.getAllBombCard(handCardDataArr);

        //没有炸弹
        if (allBombCardData.length <= 0 && firstHandCardType!==gameProto.cardType.THREE_LINE_TAKE_ONE && firstHandCardType!==gameProto.cardType.THREE_LINE_TAKE_TWO) {
            if(gameProto.cardType.ERROR !== firstHandCardType) {
                this.analyseOutCardTypePassive(allUserCardDataArr[bankerUserChairID], handCardDataArr.slice(0, handCardDataArr.length - 1), bankerCanOutCardType1) ;
            }
            if(gameProto.cardType.ERROR!==secondHandCardType) {
                this.analyseOutCardTypePassive(allUserCardDataArr[bankerUserChairID], handCardDataArr.slice(1, handCardDataArr.length), bankerCanOutCardType2) ;
            }

            if(gameProto.cardType.ERROR!==secondHandCardType && secondHandCardType!==gameProto.cardType.THREE_LINE_TAKE_ONE && secondHandCardType!==gameProto.cardType.THREE_LINE_TAKE_TWO &&
                bankerCanOutCardType2[secondHandCardType].cardTypeCount===0 && bankerCanOutCardType2[gameProto.cardType.BOMB_CARD].cardTypeCount===0) {
                outCardResult.cardCount = handCardCount-1 ;
                outCardResult.resultCard = handCardDataArr.slice(1, handCardDataArr.length);
                return outCardResult;
            }

            if(gameProto.cardType.ERROR !== firstHandCardType && firstHandCardType !== gameProto.cardType.THREE_LINE_TAKE_ONE && firstHandCardType !== gameProto.cardType.THREE_LINE_TAKE_TWO &&
                bankerCanOutCardType2[firstHandCardType].cardTypeCount===0 && bankerCanOutCardType2[gameProto.cardType.BOMB_CARD].cardTypeCount===0) {
                outCardResult.cardCount = handCardCount-1 ;
                outCardResult.resultCard = handCardDataArr.slice(0, handCardDataArr.length - 1);
                return outCardResult;
            }

            if(gameLogic.getCardLogicValue(handCardDataArr[0])>=gameLogic.getCardLogicValue(allUserCardDataArr[bankerUserChairID][0]) &&
                gameProto.cardType.ERROR!==secondHandCardType && secondHandCardType!==gameProto.cardType.THREE_LINE_TAKE_ONE && secondHandCardType!==gameProto.cardType.THREE_LINE_TAKE_TWO &&
                bankerCanOutCardType2[gameProto.cardType.BOMB_CARD].cardTypeCount===0 ) {
                outCardResult.cardCount = 1;
                outCardResult.resultCard = handCardDataArr[0];
                return outCardResult;
            }

            if(gameProto.cardType.ERROR!==secondHandCardType && secondHandCardType!==gameProto.cardType.THREE_LINE_TAKE_ONE && secondHandCardType!==gameProto.cardType.THREE_LINE_TAKE_TWO &&
                bankerCanOutCardType2[gameProto.cardType.BOMB_CARD].cardTypeCount===0) {
                outCardResult.cardCount = handCardCount-1 ;
                outCardResult.resultCard = handCardDataArr.slice(1, handCardDataArr.length);
                return outCardResult;
            }
        }
        //还有炸弹
        else
        {
            //除去炸后的牌
            let remainCard = handCardDataArr.slice();
            gameLogic.removeCard(allBombCardData, remainCard) ;
            if (gameLogic.getCardType(remainCard) !== gameProto.cardType.ERROR) {
                outCardResult.cardCount = remainCard.length;
                outCardResult.resultCard = remainCard.slice();
                return outCardResult;
            }
        }
    }

    //对牌接牌判断
    let friendID = (bankerUserChairID + 1) % GAME_PLAYER ;
    if (1 === allUserCardDataArr[bankerUserChairID] && handCardCount >= 2 && allUserCardDataArr[friendID] >= 2) {
        let meAnalyseResult = gameLogic.analyseCardDataArr(handCardDataArr);

        let friendAnalyseResult = gameLogic.analyseCardDataArr(allUserCardDataArr[friendID]);

        //对牌判断
        if ((allUserCardDataArr[friendID].length === (friendAnalyseResult.doubleCardData.length + friendAnalyseResult.threeCardData.length + friendAnalyseResult.fourCardData.length) ||
                allUserCardDataArr[friendID].length === (friendAnalyseResult.doubleCardData.length + friendAnalyseResult.threeCardData.length + friendAnalyseResult.fourCardData.length + 1)) &&
            meAnalyseResult.doubleCardData.length > 0 && friendAnalyseResult.doubleCardData.length > 0) {
            //最小对子
            let meLeastDoubleCardLogic = gameLogic.getCardLogicValue(meAnalyseResult.doubleCardData[meAnalyseResult.doubleCardData.length-2]) ;
            //最大对子
            let friendLargestDoubleCardLogic = gameLogic.getCardLogicValue(friendAnalyseResult.doubleCardData[0]) ;

            //出对判断
            if (meLeastDoubleCardLogic < 14 && meLeastDoubleCardLogic < friendLargestDoubleCardLogic) {
                outCardResult.cardCount = 2 ;
                outCardResult.resultCard[0] = meAnalyseResult.doubleCardData[meAnalyseResult.doubleCardData.length-2] ;
                outCardResult.resultCard[1] = meAnalyseResult.doubleCardData[meAnalyseResult.doubleCardData.length-1] ;
                return outCardResult;
            }

        }
    }

    {
        {
            //分析扑克
            let meOutCardTypeResult = [];
            this.analyseOutCardTypeActive(handCardDataArr, meOutCardTypeResult) ;

            //计算单牌
            let minSingleCardCountArr = [MAX_COUNT, MAX_COUNT, MAX_COUNT,MAX_COUNT];
            let index = [0, 0, 0, 0];
            let outCardType = [gameProto.cardType.ERROR,gameProto.cardType.ERROR,gameProto.cardType.ERROR,gameProto.cardType.ERROR];
            let minSingleCountInFour=MAX_COUNT ;
            let minCardType=gameProto.cardType.ERROR ;
            let minIndex=0 ;

            //分析地主对牌
            let bankerDoubleCardData = this.getAllDoubleCard(allUserCardDataArr[bankerUserChairID]);
            let bankerDoubleCardCount = bankerDoubleCardData.length;

            //除炸弹外的牌
            for(let cardType=gameProto.cardType.DOUBLE; cardType<gameProto.cardType.BOMB_CARD; ++cardType){
                //相同牌型，相同长度，单连，对连等相同牌型可能长度不一样
                let tmpCardResult = meOutCardTypeResult[cardType];
                let thisHandCardCount = MAX_COUNT ;
                //庄家扑克
                let bankerOutCardTypeResult = [];
                //下家扑克
                let friendOutCardTypeResult = [];

                for(let i=0; i<tmpCardResult.cardTypeCount; ++i){
                    //拆三条判断
                    if ( cardType === gameProto.cardType.DOUBLE ) {
                        let analyseResult = gameLogic.analyseCardDataArr(handCardDataArr);
                        if ( analyseResult.singleCardData.length + analyseResult.threeCardData.length === handCardCount ) {
                            let isContinue = false ;
                            for ( let threeIndex = 0; threeIndex < analyseResult.threeCardData.length/3; ++threeIndex )
                                if ( gameLogic.getCardValue(  tmpCardResult.cardDataArr[i][0] ) === gameLogic.getCardValue( analyseResult.threeCardData[3 * threeIndex] ) )
                                {
                                    isContinue = true ;
                                    break ;
                                }
                            if ( isContinue ) continue ;
                        }
                    }

                    let tmpCount = this.analyseSingleCardCount(handCardDataArr, tmpCardResult.cardDataArr[i]) ;

                    //拦截对牌
                    if (cardType === gameProto.cardType.DOUBLE && bankerDoubleCardCount > 0 && gameLogic.getCardLogicValue(bankerDoubleCardData[bankerDoubleCardCount-1]) < 10 &&
                        gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0]) < gameLogic.getCardLogicValue(bankerDoubleCardData[bankerDoubleCardCount-1]) &&
                        gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[0][0]) >= 10 && gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[0][0]) < 14) continue ;

                    //重新分析
                    if(tmpCardResult.eachHandCardCount[i]!==thisHandCardCount) {
                        thisHandCardCount = tmpCardResult.eachHandCardCount[i] ;
                        this.analyseOutCardTypePassive(allUserCardDataArr[bankerUserChairID], tmpCardResult.cardDataArr[i] ,bankerOutCardTypeResult) ;
                        this.analyseOutCardTypePassive(allUserCardDataArr[friendID], tmpCardResult.cardDataArr[i] ,friendOutCardTypeResult) ;
                    }
                    let index = 0 ;

                    //针对顺子，三条的大牌
                    let currentCardType = gameLogic.getCardType(tmpCardResult.cardDataArr[i]) ;
                    if (thisHandCardCount !== handCardCount && currentCardType >= gameProto.cardType.SINGLE_LINE && currentCardType <= gameProto.cardType.THREE_LINE_TAKE_TWO &&
                        ( gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][thisHandCardCount-1]) > gameLogic.getCardLogicValue(handCardDataArr[handCardCount-2]) ||
                            gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0]) >= 11 ) ) {
                        let remainCardData = handCardDataArr.slice();
                        //移除扑克
                        gameLogic.removeCard(tmpCardResult.cardDataArr[i], remainCardData) ;
                        //最大扑克
                        let currentLargestLogicCard = gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0]) ;
                        if (gameLogic.getCardType(remainCardData) === gameProto.cardType.ERROR && (currentCardType >= gameProto.cardType.THREE_LINE_TAKE_ONE &&
                                currentCardType <= gameProto.cardType.THREE_LINE_TAKE_TWO && currentLargestLogicCard >= 11 && thisHandCardCount <=5 ||
                                currentCardType === gameProto.cardType.SINGLE_LINE && thisHandCardCount <= 6 && currentLargestLogicCard >= 12 ||
                                currentCardType >= gameProto.cardType.DOUBLE_LINE && currentCardType <= gameProto.cardType.THREE_LINE && currentLargestLogicCard >= 12 && thisHandCardCount <= 8)) {
                            //暂时不出
                            if ( currentCardType >= gameProto.cardType.SINGLE_LINE && currentCardType <= gameProto.cardType.THREE_LINE &&
                                gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][thisHandCardCount - 1]) > gameLogic.getCardLogicValue(handCardDataArr[handCardCount-3]) )
                                continue ;

                            if ( currentCardType >= gameProto.cardType.THREE_LINE_TAKE_ONE && currentCardType <= gameProto.cardType.THREE_LINE_TAKE_TWO &&
                                gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0]) > gameLogic.getCardLogicValue(handCardDataArr[handCardCount-3]) )
                                continue ;
                        }
                    }

                    //针对大对（不可先出）
                    if (cardType === gameProto.cardType.DOUBLE && gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0]) >= 11) {
                        let allSingleCardData = [];
                        let allSingleCount = this.analyseSingleCardCount(handCardDataArr, null, allSingleCardData) ;
                        if (allSingleCount >= 2 && gameLogic.getCardLogicValue(allSingleCardData[allSingleCount-2]) < 10) continue ;
                    }

                    //敌方可以压住牌
                    if((bankerOutCardTypeResult[cardType].cardTypeCount>0 && friendOutCardTypeResult[cardType].cardTypeCount === 0) ||
                        (bankerOutCardTypeResult[cardType].cardTypeCount>0 && friendOutCardTypeResult[cardType].cardTypeCount > 0 &&
                            gameLogic.getCardLogicValue(friendOutCardTypeResult[cardType].cardDataArr[0][0]) <= gameLogic.getCardLogicValue(bankerOutCardTypeResult[cardType].cardDataArr[0][0]))) {
                        //地主跑掉
                        if(bankerOutCardTypeResult[cardType].eachHandCardCount[0] > 0 && allUserCardDataArr[bankerUserChairID].length<=bankerOutCardTypeResult[cardType].eachHandCardCount[0]+1)
                            continue ;

                        // 自己不可以再拿回牌权
                        if(gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[0][0]) < gameLogic.getCardLogicValue(bankerOutCardTypeResult[cardType].cardDataArr[0][0]) || bankerOutCardTypeResult[cardType].cardTypeCount > 0)
                        	continue ;
                    }
                    //是否有大牌
                    if(tmpCardResult.eachHandCardCount[i] !== handCardCount) {
                        let isHaveLargeCard=false ;
                        for(let j=0; j<tmpCardResult.eachHandCardCount[i]; ++j){
                            if(gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][j])>=15) isHaveLargeCard=true ;
                            if(cardType!==gameProto.cardType.SINGLE_LINE && cardType!==gameProto.cardType.DOUBLE_LINE  && gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0])===14) isHaveLargeCard=true ;
                        }

                        if(isHaveLargeCard) continue ;
                    }

                    //地主是否可以走掉，这里都没有考虑炸弹
                    if(tmpCardResult.eachHandCardCount[i]===allUserCardDataArr[bankerUserChairID].length && cardType===gameLogic.getCardType(allUserCardDataArr[bankerUserChairID]) &&
                        gameLogic.getCardLogicValue(allUserCardDataArr[bankerUserChairID][0])>gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0])) continue ;

                    //搜索cbMinSingleCardCount[4]的最大值
                    for(let j=0; j<4; ++j){
                        if(minSingleCardCountArr[j]>=tmpCount) {
                            minSingleCardCountArr[j] = tmpCount ;
                            index[j] = i ;
                            outCardType[j] = cardType ;
                            break ;
                        }
                    }

                    //保存最小值
                    if(minSingleCountInFour>=tmpCount) {
                        //最小牌型
                        minCardType = cardType ;
                        //最小牌型中的最小单牌
                        minSingleCountInFour=tmpCount ;
                        //最小牌型中的最小牌
                        minIndex=i ;
                    }
                }
            }

            if(minSingleCountInFour>=this.analyseSingleCardCount(handCardDataArr,null)+3 &&
                (allUserCardDataArr[bankerUserChairID].length>=4))
                minSingleCountInFour=MAX_COUNT ;

            if(minSingleCountInFour!==MAX_COUNT) {
                let tmpIndex = minIndex ;

                //选择最小牌
                for(let i=0; i<4; ++i){
                    if(outCardType[i]===minCardType && minSingleCardCountArr[i]<=minSingleCountInFour &&
                        gameLogic.getCardLogicValue(meOutCardTypeResult[minCardType].cardDataArr[index[i]][0])<gameLogic.getCardLogicValue(meOutCardTypeResult[minCardType].cardDataArr[tmpIndex][0]))
                        tmpIndex = index[i] ;
                }

                //对王加一只
                if(handCardCount===3 && gameLogic.getCardColor(handCardDataArr[0])===0x40 && gameLogic.getCardColor(handCardDataArr[1])===0x40) {
                    outCardResult.cardCount = 2 ;
                    outCardResult.resultCard[0] = 0x4f ;
                    outCardResult.resultCard[1] = 0x4e ;
                    return outCardResult;
                }
                //对王
                else if(handCardCount===3 && gameLogic.getCardColor(handCardDataArr[0])===0x40 && gameLogic.getCardColor(handCardDataArr[1])===0x40) {
                    outCardResult.cardCount = 2 ;
                    outCardResult.resultCard[0] = 0x4f ;
                    outCardResult.resultCard[1] = 0x4e ;
                    return outCardResult;
                }
                else {
                    //设置变量
                    outCardResult.cardCount=meOutCardTypeResult[minCardType].eachHandCardCount[tmpIndex];
                    outCardResult.resultCard = meOutCardTypeResult[minCardType].cardDataArr[tmpIndex].slice();
                    return outCardResult;
                }
            }

            //如果地主扑克少于5，还没有找到适合的牌则从大出到小
            if(outCardResult.cardCount <= 0 && allUserCardDataArr[bankerUserChairID].length <= 5) {
                //只有一张牌时不能放走
                if(meOutCardTypeResult[gameProto.cardType.SINGLE].cardTypeCount>0 && allUserCardDataArr[bankerUserChairID].length === 1) {
                    let index=MAX_COUNT ;
                    for(let i=0; i<meOutCardTypeResult[gameProto.cardType.SINGLE].cardTypeCount; ++i){
                        if(gameLogic.getCardLogicValue(meOutCardTypeResult[gameProto.cardType.SINGLE].cardDataArr[i][0])>=gameLogic.getCardLogicValue(allUserCardDataArr[bankerUserChairID][0])) {
                            index=i ;
                        }
                        else break ;
                    }

                    if(MAX_COUNT!==index) {
                        outCardResult.cardCount = meOutCardTypeResult[gameProto.cardType.SINGLE].eachHandCardCount[index];
                        outCardResult.resultCard = meOutCardTypeResult[gameProto.cardType.SINGLE].cardDataArr[index].slice();
                        return outCardResult;
                    }
                }
            }
        }
    }
    let firstCard=0 ;
    //过滤王和2
    for(let i=0; i<handCardCount; ++i)
        if(gameLogic.getCardLogicValue(handCardDataArr[i])<15) {
            firstCard = i ;
            break ;
        }

    if(firstCard<handCardCount-1)
        this.analyseOutCardTypeActive(handCardDataArr.slice(firstCard), cardTypeResultArr) ;
    /*else
        AnalyseOutCardType(cbHandCardData, cbHandCardCount, CardTypeResult) ;*/

    //计算单牌
    let minSingleCardCount = [MAX_COUNT, MAX_COUNT, MAX_COUNT, MAX_COUNT];
    let index = [0, 0, 0, 0];
    let outCardType=[gameProto.cardType.ERROR, gameProto.cardType.ERROR, gameProto.cardType.ERROR, gameProto.cardType.ERROR];
    let minSingleCountInFour=MAX_COUNT ;
    let minCardType=gameProto.cardType.ERROR ;
    let minIndex=0 ;

    //分析地主单牌
    let bankerSingleCardData = [];
    let bankerSingleCardCount= this.analyseSingleCardCount(allUserCardDataArr[bankerUserChairID], null, bankerSingleCardData) ;
    let bankerSingleCardLogic = 0 ;
    if(bankerSingleCardCount>=2 && gameLogic.getCardLogicValue(bankerSingleCardData[bankerSingleCardCount-2])<=10) bankerSingleCardLogic = gameLogic.getCardLogicValue(bankerSingleCardData[bankerSingleCardCount-2]) ;
    else if(bankerSingleCardCount>=2 && gameLogic.getCardLogicValue(bankerSingleCardData[bankerSingleCardCount-1])<=10) bankerSingleCardLogic = gameLogic.getCardLogicValue(bankerSingleCardData[bankerSingleCardCount-1]) ;
    else if(bankerSingleCardCount>0 && gameLogic.getCardLogicValue(bankerSingleCardData[0])<=10) bankerSingleCardLogic = gameLogic.getCardLogicValue(bankerSingleCardData[0]) ;

    //分析地主对牌
    let bankerDoubleCardData = this.getAllDoubleCard(allUserCardDataArr[bankerUserChairID]);
    let bankerDoubleCardCount = bankerDoubleCardData.length;

    //除炸弹外的牌
    for(let cardType=gameProto.cardType.SINGLE; cardType<gameProto.cardType.BOMB_CARD; ++cardType){
        let tmpCardResult = cardTypeResultArr[cardType] ;
        for(let i=0; i<tmpCardResult.cardTypeCount; ++i){
            //不能放走地主小牌
            if(cardType===gameProto.cardType.SINGLE &&  bankerSingleCardCount > 0 && gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0])<bankerSingleCardLogic) continue ;

            //拦截对牌
            if (cardType === gameProto.cardType.DOUBLE && bankerDoubleCardCount > 0 && gameLogic.getCardLogicValue(bankerDoubleCardData[bankerDoubleCardCount-1]) < 10 &&
                gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0]) < gameLogic.getCardLogicValue(bankerDoubleCardData[bankerDoubleCardCount-1]) &&
                gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[0][0]) >= 10 && gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[0][0]) < 14) continue ;

            //针对顺子，三条的大牌
            if ( tmpCardResult.eachHandCardCount[i] !== handCardCount && cardType >= gameProto.cardType.SINGLE_LINE && cardType <= gameProto.cardType.THREE_LINE_TAKE_TWO &&
                ( gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][tmpCardResult.eachHandCardCount[i]-1]) > gameLogic.getCardLogicValue(handCardDataArr[handCardCount-2]) ||
                    gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0]) >= 11 )) {
                let remainCardData = handCardDataArr.slice();
                gameLogic.removeCard(tmpCardResult.cardDataArr[i], remainCardData);
                //最大扑克
                let currentLargestLogicCard = gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0]) ;

                if (gameLogic.getCardType(remainCardData) === gameProto.cardType.ERROR && (cardType >= gameProto.cardType.THREE_LINE_TAKE_ONE &&
                        cardType <= gameProto.cardType.THREE_LINE_TAKE_TWO && currentLargestLogicCard >= 11 && tmpCardResult.eachHandCardCount[i] <=5 ||
                        cardType === gameProto.cardType.SINGLE_LINE && tmpCardResult.eachHandCardCount[i] <= 6 && currentLargestLogicCard >= 12 ||
                        cardType >= gameProto.cardType.DOUBLE_LINE && cardType <= gameProto.cardType.THREE_LINE && currentLargestLogicCard >= 12 && tmpCardResult.eachHandCardCount[i] <= 8)) {
                    //暂时不出
                    if ( cardType >= gameProto.cardType.SINGLE_LINE && cardType <= gameProto.cardType.THREE_LINE &&
                        gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][tmpCardResult.eachHandCardCount[i] - 1]) > gameLogic.getCardLogicValue(handCardDataArr[handCardCount-3]) )
                        continue ;

                    if (cardType >= gameProto.cardType.THREE_LINE_TAKE_ONE && cardType <= gameProto.cardType.THREE_LINE_TAKE_TWO &&
                        gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0]) > gameLogic.getCardLogicValue(handCardDataArr[handCardCount-3]) )
                        continue ;
                }
            }

            let tmpCount = this.analyseSingleCardCount(handCardDataArr, tmpCardResult.cardDataArr[i]) ;

            //搜索cbMinSingleCardCount[4]的最大值
            for(let j=0; j<4; ++j){
                if(minSingleCardCount[j]>=tmpCount) {
                    minSingleCardCount[j] = tmpCount ;
                    index[j] = i ;
                    outCardType[j] = cardType ;
                    break ;
                }
            }

            //保存最小值
            if(minSingleCountInFour>=tmpCount) {
                //最小牌型
                minCardType = cardType ;
                //最小牌型中的最小单牌
                minSingleCountInFour=tmpCount ;
                //最小牌型中的最小牌
                minIndex=i ;
            }
        }
    }

    if(minSingleCountInFour!==MAX_COUNT) {
        let tmpIndex = minIndex ;

        //选择最小牌
        for(let i=0; i<4; ++i){
            if(outCardType[i]===minCardType && minSingleCardCount[i]<=minSingleCountInFour &&
                gameLogic.getCardLogicValue(cardTypeResultArr[minCardType].cardDataArr[index[i]][0])<gameLogic.getCardLogicValue(cardTypeResultArr[minCardType].cardDataArr[tmpIndex][0]))
                tmpIndex = index[i] ;
        }

        //对王加一只
        if(handCardCount===3 && gameLogic.getCardColor(handCardDataArr[0])===0x40 && gameLogic.getCardColor(handCardDataArr[1])===0x40) {
            outCardResult.cardCount = 2 ;
            outCardResult.resultCard[0] = 0x4f ;
            outCardResult.resultCard[1] = 0x4e ;
            return outCardResult;
        }
        //对王
        else if(handCardCount===2 && gameLogic.getCardColor(handCardDataArr[0])===0x40 && gameLogic.getCardColor(handCardDataArr[1])===0x40) {
            outCardResult.cardCount = 2 ;
            outCardResult.resultCard[0] = 0x4f ;
            outCardResult.resultCard[1] = 0x4e ;
            return outCardResult;
        }
        else {
            //设置变量
            outCardResult.cardCount=cardTypeResultArr[minCardType].eachHandCardCount[tmpIndex];
            outCardResult.resultCard = cardTypeResultArr[minCardType].cardDataArr[tmpIndex].slice();
            return outCardResult;
        }
    }
    /* //如果只剩炸弹
     else if (CardTypeResult[CT_BOMB_CARD].cbCardTypeCount > 0)
     {
         //BYTE Index=0 ;
         //BYTE cbLogicCardValue = GetCardLogicValue(0x4F)+1 ;
         ////最小炸弹
         //for(BYTE i=0; i<CardTypeResult[CT_BOMB_CARD].cbCardTypeCount; ++i)
         //	if(cbLogicCardValue>GetCardLogicValue(CardTypeResult[CT_BOMB_CARD].cbCardData[i][0]))
         //	{
         //		cbLogicCardValue = GetCardLogicValue(CardTypeResult[CT_BOMB_CARD].cbCardData[i][0]) ;
         //		Index = i ;
         //	}

         //	//设置变量
         //	OutCardResult.cbCardCount=CardTypeResult[CT_BOMB_CARD].cbEachHandCardCount[Index];
         //	CopyMemory(OutCardResult.cbResultCard,CardTypeResult[CT_BOMB_CARD].cbCardData[Index],CardTypeResult[CT_BOMB_CARD].cbEachHandCardCount[Index]*sizeof(BYTE));

         //	return ;
     }*/

    let allSingleCardData = [];
    let allSingleCardCount = this.analyseSingleCardCount(handCardDataArr, null,allSingleCardData) ;

    if ( allSingleCardCount > 0 ) {
        //如果都没有搜索到就出最小的一张
        if (1 === allUserCardDataArr[bankerUserChairID].length ) {
            outCardResult.cardCount = 1 ;
            outCardResult.resultCard[0] = allSingleCardData[0] ;
        }
        else {
            outCardResult.cardCount = 1 ;
            outCardResult.resultCard[0] = allSingleCardData[allSingleCardCount-1] ;
        }
        return outCardResult;
    }

    //如果都没有搜索到就出最小的一张
    outCardResult.cardCount = 1 ;
    outCardResult.resultCard[0] = handCardDataArr[handCardCount-1] ;

    return outCardResult;
};

// 地主上家（后出牌）
logic.upsideOfBankerOutCardPassive = function (handCardDataArr, outCardUserChairID, turnCardDataArr, bankerUserChairID, allUserCardDataArr) {
    let outCardResult = {
        cardCount: 0,
        resultCard: []
    };

    let handCardCount = handCardDataArr.length;

    //只有一手牌
    let handCardType = gameLogic.getCardType(handCardDataArr);
    if ( handCardType !== gameProto.cardType.FOUR_LINE_TAKE_ONE && handCardType !== gameProto.cardType.FOUR_LINE_TAKE_TWO &&
        gameLogic.compareCard(turnCardDataArr, handCardDataArr) ) {
        outCardResult.cardCount = handCardCount ;
        outCardResult.resultCard = handCardDataArr.slice();
        return outCardResult;
    }

    // 友方牌信息
    let friendChairID = (bankerUserChairID+1)%GAME_PLAYER ;
    let friendCardType = gameLogic.getCardType(allUserCardDataArr[friendChairID]);

    //出牌类型
    let outCardType = gameLogic.getCardType(turnCardDataArr) ;

    //地主只有一张，从大到小出牌
    if (allUserCardDataArr[bankerUserChairID].length === 1 && outCardUserChairID !== bankerUserChairID && gameProto.cardType.SINGLE === outCardType) {
        let singleCardData = [];
        let singleCardCount = this.analyseSingleCardCount(handCardDataArr, null, singleCardData) ;

        let friendID = (bankerUserChairID+1) % GAME_PLAYER ;

        let friendLargestLogicCard = gameLogic.getCardLogicValue(allUserCardDataArr[friendID][0]) ;
        let meLargestLogicCard = gameLogic.getCardLogicValue(handCardDataArr[0]) ;
        let turnLogicCard = gameLogic.getCardLogicValue(turnCardDataArr[0]) ;

        //只剩单牌(人性化处理)
        if (singleCardCount === handCardCount && friendLargestLogicCard > turnLogicCard && meLargestLogicCard > turnLogicCard) {
            outCardResult.cardCount = 1 ;
            outCardResult.resultCard[0] = handCardDataArr[0] ;
            return outCardResult;
        }
    }

    let cardTypeResultArr = [];
    this.analyseOutCardTypePassive(handCardDataArr,turnCardDataArr, cardTypeResultArr) ;

    let bankCardTypeResultArr = [];
    this.analyseOutCardTypePassive(allUserCardDataArr[bankerUserChairID], turnCardDataArr, bankCardTypeResultArr);

    //只剩炸弹
    if(handCardCount===cardTypeResultArr[gameProto.cardType.BOMB_CARD].eachHandCardCount[0] && (outCardType<gameProto.cardType.BOMB_CARD ||
            gameLogic.getCardLogicValue(cardTypeResultArr[gameProto.cardType.BOMB_CARD].cardDataArr[0][0])>gameLogic.getCardLogicValue(turnCardDataArr[0]))) {
        outCardResult.cardCount = cardTypeResultArr[gameProto.cardType.BOMB_CARD].eachHandCardCount[0] ;
        outCardResult.resultCard = cardTypeResultArr[gameProto.cardType.BOMB_CARD].cardDataArr[0].slice();
        return outCardResult;
    }
    //双王炸弹和一手
    else if(handCardCount>2 && handCardDataArr[0]===0x4f && handCardDataArr[1]===0x4e ) {
        let leftCardType = gameLogic.getCardType(handCardDataArr.slice(2));
        if (leftCardType !== gameProto.cardType.ERROR && leftCardType !== gameProto.cardType.FOUR_LINE_TAKE_ONE && leftCardType !== gameProto.cardType.FOUR_LINE_TAKE_TWO){
            outCardResult.cardCount = 2;
            outCardResult.resultCard[0] = 0x4f ;
            outCardResult.resultCard[1] = 0x4e ;
            return outCardResult;
        }
    }

    //炸弹和一手
    let remainCard = [];
    let remainCount = 0;
    let allBombCard = this.getAllBombCard(handCardDataArr);
    let allBombCount = allBombCard.length;
    //出炸判断
    if(allBombCount>0 && bankerUserChairID === outCardUserChairID) {
        //剩余扑克
        remainCard = handCardDataArr.slice();
        gameLogic.removeCard(allBombCard, remainCard);
        remainCount = remainCard.length;

        if(gameProto.cardType.ERROR !== gameLogic.getCardType(remainCard) ||
            (2===remainCount && gameLogic.getCardLogicValue(remainCard[0])>gameLogic.getCardLogicValue(allUserCardDataArr[bankerUserChairID][0]))) {
            if((outCardType<gameProto.cardType.BOMB_CARD || gameLogic.getCardLogicValue(allBombCard[0])>gameLogic.getCardLogicValue(turnCardDataArr[0])) &&
                ( cardTypeResultArr[outCardType].cardTypeCount <= 0 || gameProto.cardType.ERROR !== gameLogic.getCardType(remainCard) ) ) {
                //双王炸弹
                if(gameLogic.getCardColor(allBombCard[0])===0x40) {
                    outCardResult.cardCount = 2 ;
                    outCardResult.resultCard[0] = 0x4f ;
                    outCardResult.resultCard[1] = 0x4e ;
                    return outCardResult;
                }
                else {
                    //分析地主牌
                    let bankerAllBombCard = this.getAllBombCard(allUserCardDataArr[bankerUserChairID]);
                    let bankerAllBombCardCount = bankerAllBombCard.length;

                    if ( !gameLogic.compareCard( turnCardDataArr, remainCard) ||  ( bankerAllBombCardCount <= 0)||
                        ( gameLogic.getCardLogicValue( allBombCard[0] ) > gameLogic.getCardLogicValue( bankerAllBombCard[0] ))) {
                        outCardResult.cardCount = 4 ;
                        outCardResult.resultCard = allBombCard.slice(0, 4);
                        return outCardResult;
                    }
                }
            }
        }
    }

    //对牌接牌判断
    if (1 === allUserCardDataArr[bankerUserChairID] && handCardCount >= 2 && outCardType === gameProto.cardType.DOUBLE) {
        let analyseResult = gameLogic.analyseCardDataArr(handCardDataArr);

        //对牌判断
        if (handCardCount === (analyseResult.doubleCardData.length + analyseResult.threeCardData.length + analyseResult.fourCardData.length) ||
            handCardCount === (analyseResult.doubleCardData.length + analyseResult.threeCardData.length + analyseResult.fourCardData.length + 1)) {
            //出对判断
            for (let index = analyseResult.doubleCardData.length -1; index>=0 ; --index){
                if (gameLogic.getCardLogicValue(analyseResult.doubleCardData[index*2]) > gameLogic.getCardLogicValue(turnCardDataArr[0])) {
                    outCardResult.cardCount = 2 ;
                    outCardResult.resultCard[0] = analyseResult.doubleCardData[index*2] ;
                    outCardResult.resultCard[1] = analyseResult.doubleCardData[index*2 + 1] ;
                    return outCardResult;
                }
            }
            //出炸判断
            if (analyseResult.fourCardData > 0) {
                //最小炸弹
                let lestBombIndex = analyseResult.fourCardData.length-1 ;
                outCardResult.cardCount = 4 ;
                outCardResult.resultCard[0] = analyseResult.fourCardData[lestBombIndex*4] ;
                outCardResult.resultCard[1] = analyseResult.fourCardData[lestBombIndex*4+1] ;
                outCardResult.resultCard[2] = analyseResult.fourCardData[lestBombIndex*4+2] ;
                outCardResult.resultCard[3] = analyseResult.fourCardData[lestBombIndex*4+3] ;
                return outCardResult;
            }

        }

        //分析对家
        if ( outCardUserChairID !== bankerUserChairID ) {
            let friendAnalyseResult = gameLogic.analyseCardDataArr(allUserCardDataArr[outCardUserChairID]);

            //对牌判断
            if (allUserCardDataArr[outCardUserChairID].length === (friendAnalyseResult.doubleCardData.length + friendAnalyseResult.doubleCardData.threeCardData.length + friendAnalyseResult.fourCardData.length) ||
                allUserCardDataArr[outCardUserChairID] === (friendAnalyseResult.doubleCardData.length + friendAnalyseResult.doubleCardData.threeCardData.length + friendAnalyseResult.fourCardData.length + 1)) {
                // 放弃出牌
                return outCardResult;
            }

            //零下标没用
            let friendCardTypeResult = [];

            this.analyseOutCardTypeActive( allUserCardDataArr[outCardUserChairID], friendCardTypeResult ) ;

            let friendCardTypeResultSingleLine = friendCardTypeResult[gameProto.cardType.SINGLE_LINE];
            for ( let lineCardIndex = 0; lineCardIndex < friendCardTypeResultSingleLine.cardTypeCount; ++lineCardIndex ){
                //剩余扑克
                let remainCardData = allUserCardDataArr[outCardUserChairID].slice();
                gameLogic.removeCard(friendCardTypeResultSingleLine.cardDataArr[lineCardIndex], remainCardData);
                let remainCardCount = remainCardData.length;
                //分析扑克
                friendAnalyseResult = gameLogic.analyseCardDataArr(remainCardData) ;

                //对牌判断
                if (remainCardCount === (friendAnalyseResult.doubleCardData.length + friendAnalyseResult.threeCardData.length + friendAnalyseResult.fourCardData.length) ||
                    remainCardCount === (friendAnalyseResult.doubleCardData.length + friendAnalyseResult.threeCardData.length + friendAnalyseResult.fourCardData.length + 1)) {
                    // 放弃出牌
                    return outCardResult;
                }
            }

            let friendCardTypeResultDoubleLine = friendCardTypeResult[gameProto.cardType.DOUBLE_LINE];
            for ( let lineCardIndex = 0; lineCardIndex < friendCardTypeResultDoubleLine.cardTypeCount; ++lineCardIndex ){
                //剩余扑克
                let remainCardData = allUserCardDataArr[outCardUserChairID].slice();
                gameLogic.removeCard(friendCardTypeResultDoubleLine.cardDataArr[lineCardIndex],remainCardData);
                let remainCardCount = remainCardData.length;
                //分析扑克
                friendAnalyseResult = gameLogic.analyseCardDataArr( remainCardData ) ;

                //对牌判断
                if (remainCardCount === (friendAnalyseResult.doubleCardData.length + friendAnalyseResult.threeCardData.length + friendAnalyseResult.fourCardData.length) ||
                    remainCardCount === (friendAnalyseResult.doubleCardData.length + friendAnalyseResult.threeCardData.length + friendAnalyseResult.fourCardData.length + 1)) {
                    // 放弃出牌
                    return outCardResult;
                }
            }


        }
    }

    //对家可否出完
    if( bankerUserChairID !== outCardUserChairID && ! gameLogic.compareCard( turnCardDataArr, allUserCardDataArr[ bankerUserChairID ]) ) {
        //庄家扑克
        let isBankerCanOut = false ;
        let bankerOutCardResultArr = [];

        //分析扑克
        this.analyseOutCardTypePassive(allUserCardDataArr[bankerUserChairID], turnCardDataArr, bankerOutCardResultArr) ;
        for(let cardType=gameProto.cardType.SINGLE; cardType<=gameProto.cardType.MISSILE_CARD; ++cardType) if(bankerOutCardResultArr[cardType].cardTypeCount>0) isBankerCanOut = true ;

        if(!isBankerCanOut) {
            //分析扑克
            let friendCardTypeResult = [];
            this.analyseOutCardTypeActive(allUserCardDataArr[friendChairID], friendCardTypeResult) ;

            for(let cardType=gameProto.cardType.SINGLE; cardType<=gameProto.cardType.MISSILE_CARD; ++cardType)
            if(friendCardTypeResult[cardType].cardTypeCount>0) {
                for(let index=0; index<friendCardTypeResult[cardType].cardTypeCount; ++index) {
                    if(this.testOutAllCard(friendChairID, bankerUserChairID, friendCardTypeResult[cardType].cardDataArr[index], true, allUserCardDataArr)) {
                        //不压对家
                        return outCardResult;
                    }
                }
            }
        }
    }

    //放走对家
    if (gameLogic.compareCard(turnCardDataArr, allUserCardDataArr[friendChairID]) &&
        !gameLogic.compareCard(turnCardDataArr, allUserCardDataArr[bankerUserChairID]))
        return outCardResult;

    //判断可否出完
    let singleCardCount = MAX_COUNT+gameProto.cardType.MISSILE_CARD ;
    let isFindBestCard = false ;
    for(let cardType=gameProto.cardType.SINGLE; cardType<=gameProto.cardType.MISSILE_CARD; ++cardType)
        if(cardTypeResultArr[cardType].cardTypeCount>0) {
            let cardTypeResult = cardTypeResultArr[cardType];
            for(let index=0; index<cardTypeResult.cardTypeCount; ++index){
                if(this.testOutAllCard(outCardUserChairID, bankerUserChairID, cardTypeResult.cardDataArr[index], false, allUserCardDataArr)) {
                    //计算单牌
                    let tmpSingleCount = this.analyseSingleCardCount(handCardDataArr, cardTypeResult.cardDataArr[index]) ;
                    //结果判断
                    if (tmpSingleCount >= MAX_COUNT) continue ;

                    //炸弹优先级排后
                    let bombCardType = gameLogic.getCardType(cardTypeResult.cardDataArr[index], cardTypeResult.eachHandCardCount[index]) ;
                    if (bombCardType === gameProto.cardType.BOMB_CARD) tmpSingleCount += 4 ;
                    else if (bombCardType === gameProto.cardType.MISSILE_CARD) tmpSingleCount += 5 ;

                    ////改变权值
                    //if (cbBombCardType != CT_ERROR) cbTmpSingleCount += cbBombCardType ;

                    //不出炸弹
                    //BYTE cbWantOutCardType = GetCardType(CardTypeResult[cbCardType].cbCardData[lIndex], CardTypeResult[cbCardType].cbEachHandCardCount[lIndex]) ;
                    //if (CardTypeResult[cbOutCardType].cbCardTypeCount > 0 && cbOutCardType < CT_BOMB_CARD && cbWantOutCardType >= CT_BOMB_CARD) continue ;

                    if (tmpSingleCount <= singleCardCount) {
                        //设置变量
                        outCardResult.cardCount=cardTypeResult.eachHandCardCount[index];
                        outCardResult.resultCard = cardTypeResult.cardDataArr[index].slice();
                        singleCardCount = tmpSingleCount ;
                        isFindBestCard = true ;
                    }
                }
            }
        }
    //直接返回
    if (isFindBestCard) return outCardResult;

    //如果庄家没有此牌型了则不压对家牌
    if( allUserCardDataArr[bankerUserChairID].length<=5 && outCardUserChairID!==bankerUserChairID &&
        (bankCardTypeResultArr[outCardType].cardTypeCount===0 || gameLogic.getCardLogicValue(bankCardTypeResultArr[outCardType].cardDataArr[0][0])<= gameLogic.getCardLogicValue(turnCardDataArr[0])) &&
        cardTypeResultArr[outCardType].eachHandCardCount[0] !== handCardCount)//不能一次出完
    {
        //放弃出牌
        return outCardResult;
    }

    //下家为地主，而且地主扑克少于5张
    if(allUserCardDataArr[bankerUserChairID].length<=5 && cardTypeResultArr[outCardType].cardTypeCount>0 && outCardType!==gameProto.cardType.BOMB_CARD &&
        ((gameLogic.getCardLogicValue(turnCardDataArr[0])<12 && outCardUserChairID!==bankerUserChairID && bankCardTypeResultArr[outCardType].cardTypeCount>0) ||//对家出牌
            (outCardUserChairID===bankerUserChairID)))//地主出牌
    {
        //防止三带等带大牌出去
        let index = outCardType === gameProto.cardType.SINGLE ? 0 : cardTypeResultArr[outCardType].cardTypeCount - 1 ;
        //寻找可以压住地主的最小一手牌
        let thisOutTypeMinSingleCount = this.analyseSingleCardCount(handCardDataArr, cardTypeResultArr[outCardType].cardDataArr[0]) ;
        let bestIndex = 255 ;
        for(let i=0; i<cardTypeResultArr[outCardType].cardTypeCount; ++i) {
            let tmpSingleCardCount = this.analyseSingleCardCount(handCardDataArr, cardTypeResultArr[outCardType].cardDataArr[1]) ;
            if((bankCardTypeResultArr[outCardType].cardTypeCount>0 &&
                    gameLogic.getCardLogicValue(cardTypeResultArr[outCardType].cardDataArr[i][0])>=gameLogic.getCardLogicValue(bankCardTypeResultArr[outCardType].cardDataArr[0][0]) ||
                    bankCardTypeResultArr[outCardType].cardTypeCount===0) && tmpSingleCardCount<=thisOutTypeMinSingleCount) {
                bestIndex = i ;
                thisOutTypeMinSingleCount = tmpSingleCardCount ;
            }

            if((bankCardTypeResultArr[outCardType].cardTypeCount>0 &&
                    gameLogic.getCardLogicValue(cardTypeResultArr[outCardType].cardDataArr[i][0])>=gameLogic.getCardLogicValue(bankCardTypeResultArr[outCardType].cardDataArr[0][0]) ||
                    bankCardTypeResultArr[outCardType].cardTypeCount===0))
                index = i ;
            else break ;
        }

        if(bestIndex!==255) {
            outCardResult.cardCount = cardTypeResultArr[outCardType].eachHandCardCount[bestIndex] ;
            outCardResult.resultCard = cardTypeResultArr[outCardType].cardDataArr[bestIndex].slice();
        }
        else {
            outCardResult.cardCount = cardTypeResultArr[outCardType].eachHandCardCount[index] ;
            outCardResult.resultCard = cardTypeResultArr[outCardType].cardDataArr[index].slice();
        }

        return outCardResult;
    }

    //单牌顶牌
    if (gameProto.cardType.SINGLE === outCardType && cardTypeResultArr[outCardType].cardTypeCount > 0) {
        //获取单牌
        let meSingleCardData = [];
        let meSingleCardCount = this.analyseSingleCardCount(handCardDataArr, null, meSingleCardData);
        let bankerSingleCardData = [];
        let bankerSingleCardCount = this.analyseSingleCardCount(allUserCardDataArr[bankerUserChairID], null, bankerSingleCardData);

        //地主还有小牌
        if (bankerSingleCardCount > 0 && meSingleCardCount > 0 && gameLogic.getCardLogicValue(bankerSingleCardData[bankerSingleCardCount-1]) <= 10) {
            //拦截两张
            if (bankerSingleCardCount >= 2 && gameLogic.getCardLogicValue(bankerSingleCardData[bankerSingleCardCount-2]) <= 10) {
                for (let meIndex = meSingleCardCount-1; meIndex >=0 ; --meIndex){
                    let meCardLogicValue = gameLogic.getCardLogicValue(meSingleCardData[meIndex]);
                    if (meCardLogicValue > gameLogic.getCardLogicValue(turnCardDataArr[0]) &&
                        meCardLogicValue >= gameLogic.getCardLogicValue(bankerSingleCardData[bankerSingleCardCount-2]) &&
                        meCardLogicValue <= 15) {
                        outCardResult.cardCount = 1 ;
                        outCardResult.resultCard[0] = meSingleCardData[meIndex] ;
                        return outCardResult;
                    }
                }
            }

            //拦截一张
            for (let meIndex = meSingleCardCount-1; meIndex >=0 ; --meIndex){
                let meCardLogicValue = gameLogic.getCardLogicValue(meSingleCardData[meIndex]);
                if (meCardLogicValue > gameLogic.getCardLogicValue(turnCardDataArr[0]) &&
                    meCardLogicValue >= gameLogic.getCardLogicValue(bankerSingleCardData[bankerSingleCardCount-1]) &&
                    meCardLogicValue <= 15) {
                    outCardResult.cardCount = 1 ;
                    outCardResult.resultCard[0] = meSingleCardData[meIndex] ;
                    return outCardResult;
                }
            }
        }
    }

    //取出四个最小单牌
    let minSingleCardCount = [MAX_COUNT, MAX_COUNT, MAX_COUNT, MAX_COUNT];
    let index = [0, 0, 0, 0];
    let minSingleCountInFour=MAX_COUNT ;

    //可出扑克（这里已经过滤掉炸弹了）
    let canOutCardTypeResult = cardTypeResultArr[outCardType];

    for(let i=0; i<canOutCardTypeResult.cardTypeCount; ++i){
        //最小单牌
        let tmpCount = this.analyseSingleCardCount(handCardDataArr,canOutCardTypeResult.cardDataArr[i]) ;
        //搜索cbMinSingleCardCount[4]的最大值
        for(let j=0; j<4; ++j){
            if(minSingleCardCount[j]>=tmpCount) {
                minSingleCardCount[j] = tmpCount ;
                index[j] = i ;
                break ;
            }
        }

    }

    for(let i=0; i<4; ++i)
        if(minSingleCountInFour>minSingleCardCount[i]) minSingleCountInFour = minSingleCardCount[i] ;

    //原始单牌数
    let originSingleCardCount = this.analyseSingleCardCount(handCardDataArr, null) ;

    //分析地主对牌
    //let bankerDoubleCardData = this.getAllDoubleCard(allUserCardDataArr[bankerUserChairID]);

    //朋友出牌
    let isFriendOut = bankerUserChairID!==outCardUserChairID ;
    if(isFriendOut) {
        //不拦截朋友最后一手牌
        if (friendCardType !== gameProto.cardType.ERROR) return outCardResult;
        //在上面的TestOutAllCard中已对可出炸弹情况分析过
        if(canOutCardTypeResult.cardTypeCount>0 && canOutCardTypeResult.cardType < gameProto.cardType.BOMB_CARD) {
            //分析地主单牌
            let bankerSingleCardData = [];
            let bankerSingleCardCount=this.analyseSingleCardCount(allUserCardDataArr[bankerUserChairID], null, bankerSingleCardData) ;
            let bankerSingleCardLogic = 0 ;

            if(bankerSingleCardCount>=2 && gameLogic.getCardLogicValue(bankerSingleCardData[bankerSingleCardCount-2])<=10) bankerSingleCardLogic = gameLogic.getCardLogicValue(bankerSingleCardData[bankerSingleCardCount-2]) ;
            else if(bankerSingleCardCount>=2 && gameLogic.getCardLogicValue(bankerSingleCardData[bankerSingleCardCount-1])<=10) bankerSingleCardLogic = gameLogic.getCardLogicValue(bankerSingleCardData[bankerSingleCardCount-1]) ;
            else if(bankerSingleCardCount>0 && gameLogic.getCardLogicValue(bankerSingleCardData[0])<=10) bankerSingleCardLogic = gameLogic.getCardLogicValue(bankerSingleCardData[0]);

            let minLogicCardValue = gameLogic.getCardLogicValue(0x4F)+1 ;
            let isFindCard = false ;
            let canOutIndex=0 ;
            for(let i=0; i<4; ++i) {
                let tmpIndex = index[i] ;
                //三带，和连牌不接对家牌
                if ( canOutCardTypeResult.cardType >= gameProto.cardType.THREE &&  canOutCardTypeResult.cardType <= gameProto.cardType.MISSILE_CARD && gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0]) >= 7 &&
                    canOutCardTypeResult.eachHandCardCount[tmpIndex] <=5 )
                    continue ;

                //单牌拦截
                let isCanOut = false ;
                if(outCardType===gameProto.cardType.SINGLE && bankerSingleCardCount > 0 && gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0]) >= bankerSingleCardLogic &&
                    gameLogic.getCardLogicValue(turnCardDataArr[0]) < 14 && minSingleCardCount[i] < originSingleCardCount &&
                    gameLogic.getCardLogicValue(allUserCardDataArr[bankerUserChairID][0]) > gameLogic.getCardLogicValue(turnCardDataArr[0]))
                    isCanOut = true ;

                //拦截对牌
                //if (cbOutCardType == CT_DOUBLE && cbBankerDoubleCardCount > 0 && GetCardLogicValue(cbBankerDoubleCardData[cbBankerDoubleCardCount-1]) < 10 &&
                //	GetCardLogicValue(CanOutCard.cbCardData[Index][0]) < GetCardLogicValue(cbBankerDoubleCardData[cbBankerDoubleCardCount-1]) &&
                //	GetCardLogicValue(CanOutCard.cbCardData[0][0]) >= 10 && GetCardLogicValue(CanOutCard.cbCardData[0][0]) < 14) continue ;

                //小于J的牌，或者小于K而且是散牌
                if(isCanOut ||
                    ((minSingleCardCount[i]<originSingleCardCount+3 &&  (minSingleCardCount[i]<=minSingleCountInFour || minSingleCardCount[i]<=minSingleCountInFour+1 &&
                        canOutCardTypeResult.cardType >= gameProto.cardType.THREE_LINE_TAKE_ONE && canOutCardTypeResult.cardType <= gameProto.cardType.THREE_LINE_TAKE_TWO ) &&
                        (gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0])<=11 || (minSingleCardCount[i]<originSingleCardCount)&&gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0])<=13)) &&
                        minLogicCardValue>gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0]) && handCardCount>5)) {
                    //搜索有没有大牌（针对飞机带翅膀后面的带牌）
                    let noLargeCard = true ;
                    for(let k=3; k<canOutCardTypeResult.eachHandCardCount[tmpIndex]; ++k){
                        //有大牌而且不能一次出完
                        if(gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][k])>=15 &&
                            canOutCardTypeResult.eachHandCardCount[tmpIndex]!==handCardCount) noLargeCard = false ;
                    }
                    if(noLargeCard) {
                        isFindCard = true ;
                        canOutIndex = tmpIndex ;
                        minLogicCardValue = gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0]) ;
                    }
                } else if(handCardCount<5 && minSingleCardCount[i]<originSingleCardCount+4 && minSingleCardCount[i]<=minSingleCountInFour &&
                    minLogicCardValue>gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0])) {
                    //能出王打自家的2
                    if ( gameLogic.getCardLogicValue( canOutCardTypeResult.cardDataArr[tmpIndex][0] ) >= 16 && gameLogic.getCardLogicValue( turnCardDataArr[0] ) >= 15 )
                        continue ;

                    isFindCard = true ;
                    canOutIndex = tmpIndex ;
                    minLogicCardValue = gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0]) ;
                }
            }

            if(isFindCard) {
                //设置变量
                canOutCardTypeResult.cardCount=canOutCardTypeResult.eachHandCardCount[canOutIndex];
                canOutCardTypeResult.resultCard = canOutCardTypeResult.cardDataArr[canOutIndex].slice();

                return canOutCardTypeResult;
            }
            //手上少于五张牌
            else if(handCardCount<=5) {
                let minLogicCard = gameLogic.getCardLogicValue(0x4f)+1 ;
                let canOutIndex = 0 ;
                for(let i=0; i<4; ++i)
                if(minSingleCardCount[i]<MAX_COUNT && minSingleCardCount[i]<=minSingleCountInFour && minLogicCard>gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[index[i]][0]) &&
                    gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[index[i]][0])<=14) {
                    minLogicCard = gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[index[i]][0]) ;
                    canOutIndex = index[i] ;
                }

                if(minLogicCard !== (gameLogic.getCardLogicValue(0x4f)+1)) {
                    //设置变量
                    outCardResult.cardCount = canOutCardTypeResult.eachHandCardCount[canOutIndex];
                    outCardResult.resultCard = canOutCardTypeResult.cardDataArr[canOutIndex].slice();

                    return outCardResult;
                }
            }

            return outCardResult;
        }
        else
        {
            return outCardResult;
        }

    }else{ // 地主出牌
        if(canOutCardTypeResult.cardTypeCount>0) {
            let minLogicCardValue = gameLogic.getCardLogicValue(0x4F)+1 ;
            let isFindCard = false ;
            let canOutIndex=0 ;
            for(let i=0; i<4; ++i){
                let tmpIndex = index[i] ;

                if((minSingleCardCount[i]<originSingleCardCount+3)  &&  (minSingleCardCount[i]<=minSingleCountInFour || minSingleCardCount[i]<=minSingleCountInFour+1 &&
                        canOutCardTypeResult.cardType >= gameProto.cardType.THREE_LINE_TAKE_ONE && canOutCardTypeResult.cardType <= gameProto.cardType.THREE_LINE_TAKE_TWO ) &&
                    minLogicCardValue>gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0])) {
                    //针对大牌
                    let isNoLargeCard = true ;

                    //当出牌玩家手上牌数大于4，而且出的是小于K的牌而且不是出牌手上的最大牌时，不能出2去打
                    if(allUserCardDataArr[outCardUserChairID].length>=4 && handCardCount>=5  && canOutCardTypeResult.eachHandCardCount[tmpIndex]>=2 &&
                        gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0])>=15 &&
                        gameLogic.getCardLogicValue(turnCardDataArr[0])<13 &&
                        (gameLogic.getCardLogicValue(turnCardDataArr[0])<gameLogic.getCardLogicValue(allUserCardDataArr[bankerUserChairID][0])) &&
                        canOutCardTypeResult.eachHandCardCount[tmpIndex]!==handCardCount)
                        isNoLargeCard=false ;

                    //搜索有没有大牌（针对飞机带翅膀后面的带牌）
                    for(let k=3; k<canOutCardTypeResult.eachHandCardCount[tmpIndex]; ++k){
                        if(gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][k])>=15 &&
                            canOutCardTypeResult.eachHandCardCount[tmpIndex]!==handCardCount)
                            isNoLargeCard = false ;
                    }
                    if(isNoLargeCard) {
                        isFindCard = true ;
                        canOutIndex = tmpIndex ;
                        minLogicCardValue = gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0]) ;
                    }
                }
            }

            if(isFindCard) {
                //最大牌
                let largestLogicCard = gameLogic.getCardLogicValue(allUserCardDataArr[bankerUserChairID][0]);
                let isCanOut=true ;

                //王只压2
                if(gameLogic.getCardLogicValue(turnCardDataArr[0])<largestLogicCard) {
                    if(gameLogic.getCardColor(canOutCardTypeResult.cardDataArr[canOutIndex][0])===0x40 && gameLogic.getCardLogicValue(turnCardDataArr[0])<=14 && handCardCount>5) {
                        isCanOut = false ;
                    }
                }

                //双王判断
                if(gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[canOutIndex][0])>=16 && handCardCount>=2 && handCardDataArr[0]===0x4F && handCardDataArr[1]===0x4E) {
                    let isOutMissileCard = false ;
                    //一手牌和一个炸弹
                    let remainCardData = handCardDataArr.slice();
                    gameLogic.removeCard([0x4F, 0x4E], remainCardData) ;
                    let remainCardCount = remainCardData.length;
                    let remainCardType = gameLogic.getCardType(remainCardData);
                    if(gameProto.cardType.ERROR!==remainCardType) isOutMissileCard = true;

                    //只剩少量牌
                    if (!isOutMissileCard){
                        if(remainCardCount<5 && gameLogic.getCardLogicValue(remainCardData[0])>=14) isOutMissileCard = true;
                    }

                    //炸后单牌数
                    if (!isOutMissileCard){
                        let singleCardCount = this.analyseSingleCardCount(handCardDataArr, canOutCardTypeResult.cardDataArr[canOutIndex]) ;
                        if(singleCardCount<=1 && gameLogic.getCardLogicValue(remainCardData[0])>=11) isOutMissileCard = true;
                    }

                    //还有小牌
                    if(isOutMissileCard){
                        if (gameLogic.getCardLogicValue(remainCardData[0]) <= 10 && gameProto.cardType.ERROR === remainCardType &&
                            (gameLogic.getCardLogicValue(allUserCardDataArr[bankerUserChairID][0]) > 10))
                            isOutMissileCard = false ;
                    }


                    //火箭扑克
                    if(isOutMissileCard) {
                        //优先其他炸弹
                        let index = cardTypeResultArr[gameProto.cardType.BOMB_CARD].cardTypeCount - 1 ;
                        outCardResult.cardCount = cardTypeResultArr[gameProto.cardType.BOMB_CARD].eachHandCardCount[index] ;
                        outCardResult.resultCard = cardTypeResultArr[gameProto.cardType.BOMB_CARD].cardDataArr[index].slice();
                        return outCardResult;
                    }
                }

                if(isCanOut) {
                    //设置变量
                    outCardResult.cardCount=canOutCardTypeResult.eachHandCardCount[canOutIndex];
                    outCardResult.resultCard = canOutCardTypeResult.cardDataArr[canOutIndex].slice();
                    return outCardResult;
                }
            }

            if(outCardType===gameProto.cardType.SINGLE) {
                //地主的最大牌
                let largestLogicCard = gameLogic.getCardLogicValue(allUserCardDataArr[bankerUserChairID][0]);

                if(gameLogic.getCardLogicValue(turnCardDataArr[0])===14 ||
                    gameLogic.getCardLogicValue(turnCardDataArr[0])>=largestLogicCard ||
                    (gameLogic.getCardLogicValue(turnCardDataArr[0])<largestLogicCard-1) ||
                    (allUserCardDataArr[bankerUserChairID].length<=5)) {
                    //取一张大于等于2而且要比闲家出的牌大的牌，
                    let index=MAX_COUNT ;
                    for(let i=0; i<handCardCount; ++i)
                        if(gameLogic.getCardLogicValue(handCardDataArr[i])>gameLogic.getCardLogicValue(turnCardDataArr[0]) &&
                            gameLogic.getCardLogicValue(handCardDataArr[i])>=15) {
                            index = i ;
                        }
                    if(index!==MAX_COUNT) {
                        //设置变量
                        outCardResult.cardCount=1;
                        outCardResult.resultCard[0] = handCardDataArr[index] ;

                        return outCardResult;
                    }
                }
            }
        }

        //还要考虑炸弹
        if(cardTypeResultArr[gameProto.cardType.BOMB_CARD].cardTypeCount>0 && NORMAL_COUNT === handCardCount && NORMAL_COUNT === allUserCardDataArr[friendChairID].length) {
            let bombCardTypeResult = cardTypeResultArr[gameProto.cardType.BOMB_CARD] ;
            let minLogicValue = gameLogic.getCardLogicValue(bombCardTypeResult.cardDataArr[0][0]) ;
            let index = 0 ;
            for(let i=0; i<bombCardTypeResult.cardTypeCount; ++i){
                if(minLogicValue>gameLogic.getCardLogicValue(bombCardTypeResult.cardDataArr[i][0])) {
                    minLogicValue = gameLogic.getCardLogicValue(bombCardTypeResult.cardDataArr[i][0]) ;
                    index = i ;
                }
            }
            let isOutBomb=false ;

            //春天判断
            // if (NORMAL_COUNT  == cbHandCardCount && NORMAL_COUNT == m_cbUserCardCount[(m_wBankerUser+1)%GAME_PLAYER] && CT_ERROR != GetCardType(m_cbAllCardData[m_wBankerUser], m_cbUserCardCount[m_wBankerUser]))
            //     bOutBomb = true ;

            //另一闲家
            //WORD wOtherUser=INVALID_CHAIR ;
            //for(WORD wUser=0; wUser<GAME_PLAYER; ++wUser)
            //	if(wUser!=wOutCardUser && wUser!=m_wBankerUser) wOtherUser=wOtherUser ;

            //一手牌和一个炸弹
            let remainCardData = handCardDataArr.slice();
            gameLogic.removeCard(bombCardTypeResult.cardDataArr[index], remainCardData);
            let remainCardType = gameLogic.getCardType(remainCardData);
            let remainCardCount = remainCardData.length;
            if(gameProto.cardType.ERROR!==remainCardType) isOutBomb = true ;

            //炸后单牌数
            if (!isOutBomb){
                let singleCardCount = this.analyseSingleCardCount(handCardDataArr, bombCardTypeResult.cardDataArr[index]) ;
                if(singleCardCount===0 && gameLogic.getCardLogicValue(remainCardData[0]) >
                    gameLogic.getCardLogicValue(allUserCardDataArr[bankerUserChairID])) isOutBomb = true ;
            }

            //只剩一手
            if (!isOutBomb){
                if(remainCardType>gameProto.cardType.ERROR && remainCardType<gameProto.cardType.FOUR_LINE_TAKE_ONE && gameLogic.getCardLogicValue(allUserCardDataArr[outCardUserChairID][0])<15 &&
                    singleCardCount < 2 && (gameLogic.getCardLogicValue(remainCardData[0]) >= gameLogic.getCardLogicValue(allUserCardDataArr[bankerUserChairID][0]))) isOutBomb = true ;
            }

            //反春天
            //if (remainCardType !== gameProto.cardType.ERROR && m_lBankerOutCardCount == 1) bOutBomb = true ;

            //只剩少量牌
            if (!isOutBomb){
                let remainLargestCard = gameLogic.getCardLogicValue(remainCardData[0]) ;
                if(remainCardCount<5 && remainCardCount>0 && (remainLargestCard!==gameLogic.getCardLogicValue(bombCardTypeResult.cardDataArr[index][0])) &&
                    remainLargestCard>gameLogic.getCardLogicValue(allUserCardDataArr[outCardUserChairID][0]) && remainLargestCard > 14) isOutBomb = true ;
            }

            if (!isOutBomb){
                //分析扑克
                let analyseResult = gameLogic.analyseCardDataArr(remainCardData);
                if (allUserCardDataArr[bankerUserChairID].length === 1 && (analyseResult.doubleCardData.length + analyseResult.threeCardData.length + analyseResult.fourCardData.length + 1 >= remainCardCount)) isOutBomb = true ;
            }

            //设置变量
            if(isOutBomb) {
                outCardResult.cardCount = bombCardTypeResult.eachHandCardCount[index];
                outCardResult.resultCard = bombCardTypeResult.cardDataArr[index].slice();
            }
            return outCardResult;
        }
        return outCardResult;
    }
};

// 地主下家(先出牌)
logic.undersideOfBankerOutCardActive = function (handCardDataArr, meChairID, bankerUserChairID, allUserCardDataArr) {
    let outCardResult = {
        cardCount: 0,
        resultCard: []
    };

    let handCardCount = handCardDataArr.length;

    let cardTypeResultArr = [];

    let lineCard = this.getAllLineCard(handCardDataArr);
    let threeLineCard = this.getAllThreeCard(handCardDataArr);
    let doubleLineCard = this.getAllDoubleCard(handCardDataArr);

    let friendID = (bankerUserChairID+2)%GAME_PLAYER;
    let friendCardType = gameLogic.getCardType(allUserCardDataArr[friendID]) ;

    //判断可否出完
    let singleCardCount = MAX_COUNT+gameProto.cardType.MISSILE_CARD ;
    let isFindBestCard = false ;
    this.analyseOutCardTypeActive(handCardDataArr, cardTypeResultArr) ;
    for(let cardType=gameProto.cardType.SINGLE; cardType<=gameProto.cardType.MISSILE_CARD; ++cardType)
        if(cardTypeResultArr[cardType].cardTypeCount>0) {
            let cardTypeResult = cardTypeResultArr[cardType];
            for(let index=0; index<cardTypeResult.cardTypeCount; ++index) {
                let tmpChairID = (bankerUserChairID+1)%GAME_PLAYER ;
                if(this.testOutAllCard(tmpChairID, bankerUserChairID, cardTypeResult.cardDataArr[index], true, allUserCardDataArr)) {
                    //计算单牌
                    let tmpSingleCount = this.analyseSingleCardCount(handCardDataArr, cardTypeResult.cardDataArr[index]) ;

                    //结果判断
                    if (tmpSingleCount >= MAX_COUNT) continue ;

                    //炸弹优先级排后
                    let bombCardType = gameLogic.getCardType(cardTypeResult.cardDataArr[index]) ;
                    if (bombCardType === gameProto.cardType.BOMB_CARD) tmpSingleCount += 4 ;
                    else if (bombCardType === gameProto.cardType.MISSILE_CARD) tmpSingleCount += 5 ;
                    else if ( 15 === gameLogic.getCardLogicValue( cardTypeResult.cardDataArr[ index ][ 0 ] ) ) tmpSingleCount += 2;
                    else if ( 15 < gameLogic.getCardLogicValue(cardTypeResult.cardDataArr[ index ][ 0 ] ) ) tmpSingleCount += 3;


                    ////改变权值
                    //if (cbBombCardType != CT_ERROR) cbTmpSingleCount += cbBombCardType ;

                    if (tmpSingleCount <= singleCardCount) {
                        //设置变量
                        outCardResult.cardCount=cardTypeResult.eachHandCardCount[index];
                        outCardResult.resultCard = cardTypeResult.cardDataArr[index].slice();
                        singleCardCount = tmpSingleCount ;
                        isFindBestCard = true ;
                    }

                }
            }
        }
    //直接返回
    if (isFindBestCard) return outCardResult;

    //对王和两单
    if ( handCardCount === 4 && gameLogic.getCardLogicValue(handCardDataArr[1]) === 16 && allUserCardDataArr[bankerUserChairID].length === 1 &&
        gameLogic.getCardLogicValue(handCardDataArr[2]) < gameLogic.getCardLogicValue(allUserCardDataArr[bankerUserChairID][0])) {
        outCardResult.cardCount = 1 ;
        outCardResult.resultCard[0] = handCardDataArr[2] ;
        return outCardResult;
    }

    //四带牌型判断
    if ( this.analyseFourCardType(handCardDataArr, allUserCardDataArr[bankerUserChairID], outCardResult) ) return outCardResult;

    //如果只剩顺牌和单只，则先出顺
    {
        if(lineCard.length+1===handCardCount && gameLogic.getCardType(lineCard) === gameProto.cardType.SINGLE_LINE) {
            outCardResult.cardCount = lineCard.length ;
            outCardResult.resultCard = lineCard.slice();
        }
        else if(threeLineCard.length+1===handCardCount && gameLogic.getCardType(threeLineCard) === gameProto.cardType.THREE_LINE) {
            outCardResult.cardCount = threeLineCard.length;
            outCardResult.resultCard = threeLineCard.slice();
        }
        else if(doubleLineCard.length+1===handCardCount && gameLogic.getCardType(doubleLineCard) === gameProto.cardType.DOUBLE_LINE) {
            outCardResult.cardCount = doubleLineCard.length;
            outCardResult.resultCard = doubleLineCard.slice();
        }
        //双王炸弹和一手
        else if(handCardCount>2 && handCardDataArr[0]===0x4f && handCardDataArr[1]===0x4e) {
            let cardType = gameLogic.getCardType(handCardDataArr.slice(2));
            if (cardType !== gameProto.cardType.ERROR && cardType !== gameProto.cardType.FOUR_LINE_TAKE_ONE && cardType !== gameProto.cardType.FOUR_LINE_TAKE_TWO){
                outCardResult.cardCount = 2 ;
                outCardResult.resultCard[0] = 0x4f ;
                outCardResult.resultCard[1] = 0x4e ;
            }
        }

        if(outCardResult.cardCount>0) return outCardResult;
    }

    //对王加一只
    if(handCardCount===3 && handCardDataArr[0]===0x4f && handCardDataArr[1]===0x4e) {
        outCardResult.cardCount = 2 ;
        outCardResult.resultCard[0] = 0x4f ;
        outCardResult.resultCard[1] = 0x4e ;
        return outCardResult;
    }
    //对王
    else if(handCardCount===2 && handCardDataArr[0]===0x4f && handCardDataArr[1]===0x4e) {
        outCardResult.cardCount = 2 ;
        outCardResult.resultCard[0] = 0x4f ;
        outCardResult.resultCard[1] = 0x4e ;
        return outCardResult;
    }
    else {
        let cardType = gameLogic.getCardType(handCardDataArr.slice());
        //只剩一手牌
        if (cardType !== gameProto.cardType.ERROR && cardType !== gameProto.cardType.FOUR_LINE_TAKE_ONE && cardType !== gameProto.cardType.FOUR_LINE_TAKE_TWO){
            outCardResult.cardCount = handCardCount ;
            outCardResult.resultCard = handCardDataArr.slice();
            return outCardResult;
        }
    }

    //只剩一张和一手
    if(handCardCount>=2) {
        // 庄家扑克
        let bankerCanOutCardType1 = [];
        let bankerCanOutCardType2 = [];

        let firstHandCardType = gameLogic.getCardType(handCardDataArr) ;
        let secondHandCardType = gameLogic.getCardType(handCardDataArr.slice(1)) ;

        //是否有炸
        let allBombCardData = this.getAllBombCard(handCardDataArr);

        //没有炸弹
        if (allBombCardData.length <= 0 && firstHandCardType!==gameProto.cardType.THREE_LINE_TAKE_ONE && firstHandCardType!==gameProto.cardType.THREE_LINE_TAKE_TWO) {
            if(gameProto.cardType.ERROR !== firstHandCardType) {
                this.analyseOutCardTypePassive(allUserCardDataArr[bankerUserChairID], handCardDataArr.slice(0, handCardDataArr.length - 1), bankerCanOutCardType1) ;
            }
            if(gameProto.cardType.ERROR!==secondHandCardType) {
                this.analyseOutCardTypePassive(allUserCardDataArr[bankerUserChairID], handCardDataArr.slice(1, handCardDataArr.length), bankerCanOutCardType2) ;
            }

            if(gameProto.cardType.ERROR!==secondHandCardType && secondHandCardType!==gameProto.cardType.THREE_LINE_TAKE_ONE && secondHandCardType!==gameProto.cardType.THREE_LINE_TAKE_TWO &&
                bankerCanOutCardType2[secondHandCardType].cardTypeCount===0 && bankerCanOutCardType2[gameProto.cardType.BOMB_CARD].cardTypeCount===0) {
                outCardResult.cardCount = handCardCount-1 ;
                outCardResult.resultCard = handCardDataArr.slice(1, handCardDataArr.length);
                return outCardResult;
            }

            if(gameProto.cardType.ERROR !== firstHandCardType && firstHandCardType !== gameProto.cardType.THREE_LINE_TAKE_ONE && firstHandCardType !== gameProto.cardType.THREE_LINE_TAKE_TWO &&
                bankerCanOutCardType2[firstHandCardType].cardTypeCount===0 && bankerCanOutCardType2[gameProto.cardType.BOMB_CARD].cardTypeCount===0) {
                outCardResult.cardCount = handCardCount-1 ;
                outCardResult.resultCard = handCardDataArr.slice(0, handCardDataArr.length - 1);
                return outCardResult;
            }

            if(gameLogic.getCardLogicValue(handCardDataArr[0])>=gameLogic.getCardLogicValue(allUserCardDataArr[bankerUserChairID][0]) &&
                gameProto.cardType.ERROR!==secondHandCardType && secondHandCardType!==gameProto.cardType.THREE_LINE_TAKE_ONE && secondHandCardType!==gameProto.cardType.THREE_LINE_TAKE_TWO &&
                bankerCanOutCardType2[gameProto.cardType.BOMB_CARD].cardTypeCount===0 ) {
                outCardResult.cardCount = 1;
                outCardResult.resultCard = handCardDataArr[0];
                return outCardResult;
            }

            if(gameProto.cardType.ERROR!==secondHandCardType && secondHandCardType!==gameProto.cardType.THREE_LINE_TAKE_ONE && secondHandCardType!==gameProto.cardType.THREE_LINE_TAKE_TWO &&
                bankerCanOutCardType2[gameProto.cardType.BOMB_CARD].cardTypeCount===0) {
                outCardResult.cardCount = handCardCount-1 ;
                outCardResult.resultCard = handCardDataArr.slice(1, handCardDataArr.length);
                return outCardResult;
            }
        }
        //还有炸弹
        else
        {
            //除去炸后的牌
            let remainCard = handCardDataArr.slice();
            gameLogic.removeCard(allBombCardData, remainCard) ;
            if (gameLogic.getCardType(remainCard) !== gameProto.cardType.ERROR) {
                outCardResult.cardCount = remainCard.length;
                outCardResult.resultCard = remainCard.slice();
                return outCardResult;
            }
        }
    }

    // 放走队友
    //单张扑克
    if(gameProto.cardType.SINGLE === friendCardType) {
        //合法判断
        if(allUserCardDataArr[friendID.length]===1 && gameLogic.getCardLogicValue(handCardDataArr[handCardCount-1]) < gameLogic.getCardLogicValue(allUserCardDataArr[friendID][0])) {
            outCardResult.cardCount = 1 ;
            outCardResult.resultCard[0] = handCardDataArr[handCardCount-1] ;
            return outCardResult;
        }
    }
    //一对扑克
    else if(gameProto.cardType.DOUBLE===friendCardType && doubleLineCard.length>=2) {
        if(gameLogic.getCardLogicValue(doubleLineCard[doubleLineCard.length - 1]) < gameLogic.getCardLogicValue(allUserCardDataArr[friendID][0])){
            outCardResult.cardCount = 2 ;
            outCardResult.resultCard[0] = doubleLineCard[doubleLineCard.length-2] ;
            outCardResult.resultCard[1] = doubleLineCard[doubleLineCard.length-1] ;
            return outCardResult;
        }
    }

    //对牌接牌判断
    if (1 === allUserCardDataArr[bankerUserChairID] && handCardCount >= 2 && allUserCardDataArr[friendID] >= 2) {
        let meAnalyseResult = gameLogic.analyseCardDataArr(handCardDataArr);

        let friendAnalyseResult = gameLogic.analyseCardDataArr(allUserCardDataArr[friendID]);

        //对牌判断
        if ((allUserCardDataArr[friendID].length === (friendAnalyseResult.doubleCardData.length + friendAnalyseResult.threeCardData.length + friendAnalyseResult.fourCardData.length) ||
                allUserCardDataArr[friendID].length === (friendAnalyseResult.doubleCardData.length + friendAnalyseResult.threeCardData.length + friendAnalyseResult.fourCardData.length + 1)) &&
            meAnalyseResult.doubleCardData.length > 0 && friendAnalyseResult.doubleCardData.length > 0) {
            //最小对子
            let meLeastDoubleCardLogic = gameLogic.getCardLogicValue(meAnalyseResult.doubleCardData[meAnalyseResult.doubleCardData.length-2]) ;
            //最大对子
            let friendLargestDoubleCardLogic = gameLogic.getCardLogicValue(friendAnalyseResult.doubleCardData[0]) ;

            //出对判断
            if (meLeastDoubleCardLogic < 14 && meLeastDoubleCardLogic < friendLargestDoubleCardLogic) {
                outCardResult.cardCount = 2 ;
                outCardResult.resultCard[0] = meAnalyseResult.doubleCardData[meAnalyseResult.doubleCardData.length-2] ;
                outCardResult.resultCard[1] = meAnalyseResult.doubleCardData[meAnalyseResult.doubleCardData.length-1] ;
                return outCardResult;
            }

        }
    }

    {
        {
            //分析扑克
            let meOutCardTypeResult = [];
            this.analyseOutCardTypeActive(handCardDataArr, meOutCardTypeResult) ;

            //计算单牌
            let minSingleCardCountArr = [MAX_COUNT, MAX_COUNT, MAX_COUNT,MAX_COUNT];
            let index = [0, 0, 0, 0];
            let outCardType = [gameProto.cardType.ERROR,gameProto.cardType.ERROR,gameProto.cardType.ERROR,gameProto.cardType.ERROR];
            let minSingleCountInFour=MAX_COUNT ;
            let minCardType=gameProto.cardType.ERROR ;
            let minIndex=0 ;

            //分析地主对牌
            //let bankerDoubleCardData = this.getAllDoubleCard(allUserCardDataArr[bankerUserChairID]);

            //除炸弹外的牌
            for(let cardType=gameProto.cardType.DOUBLE; cardType<gameProto.cardType.BOMB_CARD; ++cardType){
                //相同牌型，相同长度，单连，对连等相同牌型可能长度不一样
                let tmpCardResult = meOutCardTypeResult[cardType];
                let thisHandCardCount = MAX_COUNT ;
                //庄家扑克
                let bankerOutCardTypeResult = [];
                //下家扑克
                let friendOutCardTypeResult = [];

                for(let i=0; i<tmpCardResult.cardTypeCount; ++i){
                    //拆三条判断
                    if ( cardType === gameProto.cardType.DOUBLE ) {
                        let analyseResult = gameLogic.analyseCardDataArr(handCardDataArr);
                        if ( analyseResult.singleCardData.length + analyseResult.threeCardData.length === handCardCount ) {
                            let isContinue = false ;
                            for ( let threeIndex = 0; threeIndex < analyseResult.threeCardData.length/3; ++threeIndex )
                                if ( gameLogic.getCardValue(  tmpCardResult.cardDataArr[i][0] ) === gameLogic.getCardValue( analyseResult.threeCardData[3 * threeIndex] ) )
                                {
                                    isContinue = true ;
                                    break ;
                                }
                            if ( isContinue ) continue ;
                        }
                    }

                    let tmpCount = this.analyseSingleCardCount(handCardDataArr, tmpCardResult.cardDataArr[i]) ;

                    //重新分析
                    if(tmpCardResult.eachHandCardCount[i]!==thisHandCardCount) {
                        thisHandCardCount = tmpCardResult.eachHandCardCount[i] ;
                        this.analyseOutCardTypePassive(allUserCardDataArr[bankerUserChairID], tmpCardResult.cardDataArr[i] ,bankerOutCardTypeResult) ;
                        this.analyseOutCardTypePassive(allUserCardDataArr[friendID], tmpCardResult.cardDataArr[i] ,friendOutCardTypeResult) ;
                    }
                    let index = 0 ;

                    //针对顺子，三条的大牌
                    let currentCardType = gameLogic.getCardType(tmpCardResult.cardDataArr[i]) ;
                    if (thisHandCardCount !== handCardCount && currentCardType >= gameProto.cardType.SINGLE_LINE && currentCardType <= gameProto.cardType.THREE_LINE_TAKE_TWO &&
                        ( gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][thisHandCardCount-1]) > gameLogic.getCardLogicValue(handCardDataArr[handCardCount-2]) ||
                            gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0]) >= 11 ) ) {
                        let remainCardData = handCardDataArr.slice();
                        //移除扑克
                        gameLogic.removeCard(tmpCardResult.cardDataArr[i], remainCardData) ;
                        //最大扑克
                        let currentLargestLogicCard = gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0]) ;
                        if (gameLogic.getCardType(remainCardData) === gameProto.cardType.ERROR && (currentCardType >= gameProto.cardType.THREE_LINE_TAKE_ONE &&
                                currentCardType <= gameProto.cardType.THREE_LINE_TAKE_TWO && currentLargestLogicCard >= 11 && thisHandCardCount <=5 ||
                                currentCardType === gameProto.cardType.SINGLE_LINE && thisHandCardCount <= 6 && currentLargestLogicCard >= 12 ||
                                currentCardType >= gameProto.cardType.DOUBLE_LINE && currentCardType <= gameProto.cardType.THREE_LINE && currentLargestLogicCard >= 12 && thisHandCardCount <= 8)) {
                            //暂时不出
                            if ( currentCardType >= gameProto.cardType.SINGLE_LINE && currentCardType <= gameProto.cardType.THREE_LINE &&
                                gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][thisHandCardCount - 1]) > gameLogic.getCardLogicValue(handCardDataArr[handCardCount-3]) )
                                continue ;

                            if ( currentCardType >= gameProto.cardType.THREE_LINE_TAKE_ONE && currentCardType <= gameProto.cardType.THREE_LINE_TAKE_TWO &&
                                gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0]) > gameLogic.getCardLogicValue(handCardDataArr[handCardCount-3]) )
                                continue ;
                        }
                    }

                    //针对大对（不可先出）
                    if (cardType === gameProto.cardType.DOUBLE && gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0]) >= 11) {
                        let allSingleCardData = [];
                        let allSingleCount = this.analyseSingleCardCount(handCardDataArr, null, allSingleCardData) ;
                        if (allSingleCount >= 2 && gameLogic.getCardLogicValue(allSingleCardData[allSingleCount-2]) < 10) continue ;
                    }

                    //敌方可以压住牌
                    if((bankerOutCardTypeResult[cardType].cardTypeCount>0 && friendOutCardTypeResult[cardType].cardTypeCount === 0) ||
                        (bankerOutCardTypeResult[cardType].cardTypeCount>0 && friendOutCardTypeResult[cardType].cardTypeCount > 0 &&
                            gameLogic.getCardLogicValue(friendOutCardTypeResult[cardType].cardDataArr[0][0]) <= gameLogic.getCardLogicValue(bankerOutCardTypeResult[cardType].cardDataArr[0][0]))) {
                        //地主跑掉
                        if(bankerOutCardTypeResult[cardType].eachHandCardCount[0] > 0 && allUserCardDataArr[bankerUserChairID].length<=bankerOutCardTypeResult[cardType].eachHandCardCount[0]+1)
                            continue ;

                        // 自己不可以再拿回牌权
                        // if(gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[0][0]) < gameLogic.getCardLogicValue(bankerOutCardTypeResult[cardType].cardDataArr[0][0]) || bankerOutCardTypeResult[cardType].cardTypeCount > 0)
                        //     continue ;
                    }
                    //是否有大牌
                    if(tmpCardResult.eachHandCardCount[i] !== handCardCount) {
                        let isHaveLargeCard=false ;
                        for(let j=0; j<tmpCardResult.eachHandCardCount[i]; ++j){
                            if(gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][j])>=15) isHaveLargeCard=true ;
                            if(cardType!==gameProto.cardType.SINGLE_LINE && cardType!==gameProto.cardType.DOUBLE_LINE  && gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0])===14) isHaveLargeCard=true ;
                        }

                        if(isHaveLargeCard) continue ;
                    }

                    //地主是否可以走掉，这里都没有考虑炸弹
                    if(tmpCardResult.eachHandCardCount[i]===allUserCardDataArr[bankerUserChairID].length && cardType===gameLogic.getCardType(allUserCardDataArr[bankerUserChairID]) &&
                        gameLogic.getCardLogicValue(allUserCardDataArr[bankerUserChairID][0])>gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0])) continue ;

                    //搜索cbMinSingleCardCount[4]的最大值
                    for(let j=0; j<4; ++j){
                        if(minSingleCardCountArr[j]>=tmpCount) {
                            minSingleCardCountArr[j] = tmpCount ;
                            index[j] = i ;
                            outCardType[j] = cardType ;
                            break ;
                        }
                    }

                    //保存最小值
                    if(minSingleCountInFour>=tmpCount) {
                        //最小牌型
                        minCardType = cardType ;
                        //最小牌型中的最小单牌
                        minSingleCountInFour=tmpCount ;
                        //最小牌型中的最小牌
                        minIndex=i ;
                    }
                }
            }

            if(minSingleCountInFour>=this.analyseSingleCardCount(handCardDataArr,null)+3 &&
                (allUserCardDataArr[bankerUserChairID].length>=4))
                minSingleCountInFour=MAX_COUNT ;

            if(minSingleCountInFour!==MAX_COUNT) {
                let tmpIndex = minIndex ;

                //选择最小牌
                for(let i=0; i<4; ++i){
                    if(outCardType[i]===minCardType && minSingleCardCountArr[i]<=minSingleCountInFour &&
                        gameLogic.getCardLogicValue(meOutCardTypeResult[minCardType].cardDataArr[index[i]][0])<gameLogic.getCardLogicValue(meOutCardTypeResult[minCardType].cardDataArr[tmpIndex][0]))
                        tmpIndex = index[i] ;
                }

                //对王加一只
                if(handCardCount===3 && gameLogic.getCardColor(handCardDataArr[0])===0x40 && gameLogic.getCardColor(handCardDataArr[1])===0x40) {
                    outCardResult.cardCount = 2 ;
                    outCardResult.resultCard[0] = 0x4f ;
                    outCardResult.resultCard[1] = 0x4e ;
                    return outCardResult;
                }
                //对王
                else if(handCardCount===3 && gameLogic.getCardColor(handCardDataArr[0])===0x40 && gameLogic.getCardColor(handCardDataArr[1])===0x40) {
                    outCardResult.cardCount = 2 ;
                    outCardResult.resultCard[0] = 0x4f ;
                    outCardResult.resultCard[1] = 0x4e ;
                    return outCardResult;
                }
                else {
                    //设置变量
                    outCardResult.cardCount=meOutCardTypeResult[minCardType].eachHandCardCount[tmpIndex];
                    outCardResult.resultCard = meOutCardTypeResult[minCardType].cardDataArr[tmpIndex].slice();
                    return outCardResult;
                }
            }

            //如果地主扑克少于5，还没有找到适合的牌则从大出到小
            if(outCardResult.cardCount <= 0 && allUserCardDataArr[bankerUserChairID].length <= 5) {
                //只有一张牌时不能放走
                if(meOutCardTypeResult[gameProto.cardType.SINGLE].cardTypeCount>0 && allUserCardDataArr[bankerUserChairID].length === 1) {
                    let index=MAX_COUNT ;
                    for(let i=0; i<meOutCardTypeResult[gameProto.cardType.SINGLE].cardTypeCount; ++i){
                        if(gameLogic.getCardLogicValue(meOutCardTypeResult[gameProto.cardType.SINGLE].cardDataArr[i][0])>=gameLogic.getCardLogicValue(allUserCardDataArr[bankerUserChairID][0])) {
                            index=i ;
                        }
                        else break ;
                    }

                    if(MAX_COUNT!==index) {
                        outCardResult.cardCount = meOutCardTypeResult[gameProto.cardType.SINGLE].eachHandCardCount[index];
                        outCardResult.resultCard = meOutCardTypeResult[gameProto.cardType.SINGLE].cardDataArr[index].slice();
                        return outCardResult;
                    }
                }
            }
        }
    }
    let firstCard=0 ;
    //过滤王和2
    for(let i=0; i<handCardCount; ++i)
        if(gameLogic.getCardLogicValue(handCardDataArr[i])<15) {
            firstCard = i ;
            break ;
        }

    if(firstCard<handCardCount-1)
        this.analyseOutCardTypeActive(handCardDataArr.slice(firstCard), cardTypeResultArr) ;
    /*else
        AnalyseOutCardType(cbHandCardData, cbHandCardCount, CardTypeResult) ;*/

    //计算单牌
    let minSingleCardCount = [MAX_COUNT, MAX_COUNT, MAX_COUNT, MAX_COUNT];
    let index = [0, 0, 0, 0];
    let outCardType=[gameProto.cardType.ERROR, gameProto.cardType.ERROR, gameProto.cardType.ERROR, gameProto.cardType.ERROR];
    let minSingleCountInFour=MAX_COUNT ;
    let minCardType=gameProto.cardType.ERROR ;
    let minIndex=0 ;

    /*//分析地主单牌
    let bankerSingleCardData = [];
    let bankerSingleCardCount= this.analyseSingleCardCount(allUserCardDataArr[bankerUserChairID], null, bankerSingleCardData) ;
    let bankerSingleCardLogic = 0 ;
    if(bankerSingleCardCount>=2 && gameLogic.getCardLogicValue(bankerSingleCardData[bankerSingleCardCount-2])<=10) bankerSingleCardLogic = gameLogic.getCardLogicValue(bankerSingleCardData[bankerSingleCardCount-2]) ;
    else if(bankerSingleCardCount>=2 && gameLogic.getCardLogicValue(bankerSingleCardData[bankerSingleCardCount-1])<=10) bankerSingleCardLogic = gameLogic.getCardLogicValue(bankerSingleCardData[bankerSingleCardCount-1]) ;
    else if(bankerSingleCardCount>0 && gameLogic.getCardLogicValue(cbBankerSingleCardData[0])<=10) cbBankerSingleCardLogic = GetCardLogicValue(cbBankerSingleCardData[0]) ;

    //分析地主对牌
    let bankerDoubleCardData = this.getAllDoubleCard(allUserCardDataArr[bankerUserChairID]);
    let bankerDoubleCardCount = bankerDoubleCardData.length;*/

    //除炸弹外的牌
    for(let cardType=gameProto.cardType.SINGLE; cardType<gameProto.cardType.BOMB_CARD; ++cardType){
        let tmpCardResult = cardTypeResultArr[cardType] ;
        for(let i=0; i<tmpCardResult.cardTypeCount; ++i){
            //庄家可以走掉
            if ( gameLogic.compareCard(tmpCardResult.cardDataArr[i], allUserCardDataArr[bankerUserChairID]))
                continue ;

            //针对顺子，三条的大牌
            if ( tmpCardResult.eachHandCardCount[i] !== handCardCount && cardType >= gameProto.cardType.SINGLE_LINE && cardType <= gameProto.cardType.THREE_LINE_TAKE_TWO &&
                ( gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][tmpCardResult.eachHandCardCount[i]-1]) > gameLogic.getCardLogicValue(handCardDataArr[handCardCount-2]) ||
                    gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0]) >= 11 )) {
                // 删除扑克
                let remainCardData = handCardDataArr.slice();
                gameLogic.removeCard(tmpCardResult.cardDataArr[i], remainCardData);
                // 最大扑克
                let currentLargestLogicCard = gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0]) ;

                if (gameLogic.getCardType(remainCardData) === gameProto.cardType.ERROR && (cardType >= gameProto.cardType.THREE_LINE_TAKE_ONE &&
                        cardType <= gameProto.cardType.THREE_LINE_TAKE_TWO && currentLargestLogicCard >= 11 && tmpCardResult.eachHandCardCount[i] <=5 ||
                        cardType === gameProto.cardType.SINGLE_LINE && tmpCardResult.eachHandCardCount[i] <= 6 && currentLargestLogicCard >= 12 ||
                        cardType >= gameProto.cardType.DOUBLE_LINE && cardType <= gameProto.cardType.THREE_LINE && currentLargestLogicCard >= 12 && tmpCardResult.eachHandCardCount[i] <= 8)) {
                    //暂时不出
                    if ( cardType >= gameProto.cardType.SINGLE_LINE && cardType <= gameProto.cardType.THREE_LINE &&
                        gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][tmpCardResult.eachHandCardCount[i] - 1]) > gameLogic.getCardLogicValue(handCardDataArr[handCardCount-3]) )
                        continue ;

                    if (cardType >= gameProto.cardType.THREE_LINE_TAKE_ONE && cardType <= gameProto.cardType.THREE_LINE_TAKE_TWO &&
                        gameLogic.getCardLogicValue(tmpCardResult.cardDataArr[i][0]) > gameLogic.getCardLogicValue(handCardDataArr[handCardCount-3]) )
                        continue ;
                }
            }

            let tmpCount = this.analyseSingleCardCount(handCardDataArr, tmpCardResult.cardDataArr[i]) ;

            //搜索cbMinSingleCardCount[4]的最大值
            for(let j=0; j<4; ++j){
                if(minSingleCardCount[j]>=tmpCount) {
                    minSingleCardCount[j] = tmpCount ;
                    index[j] = i ;
                    outCardType[j] = cardType ;
                    break ;
                }
            }

            //保存最小值
            if(minSingleCountInFour>=tmpCount) {
                //最小牌型
                minCardType = cardType ;
                //最小牌型中的最小单牌
                minSingleCountInFour=tmpCount ;
                //最小牌型中的最小牌
                minIndex=i ;
            }
        }
    }

    if(minSingleCountInFour!==MAX_COUNT) {
        let tmpIndex = minIndex ;

        //选择最小牌
        for(let i=0; i<4; ++i){
            if(outCardType[i]===minCardType && minSingleCardCount[i]<=minSingleCountInFour &&
                gameLogic.getCardLogicValue(cardTypeResultArr[minCardType].cardDataArr[index[i]][0])<gameLogic.getCardLogicValue(cardTypeResultArr[minCardType].cardDataArr[tmpIndex][0]))
                tmpIndex = index[i] ;
        }

        //对王加一只
        if(handCardCount===3 && gameLogic.getCardColor(handCardDataArr[0])===0x40 && gameLogic.getCardColor(handCardDataArr[1])===0x40) {
            outCardResult.cardCount = 2 ;
            outCardResult.resultCard[0] = 0x4f ;
            outCardResult.resultCard[1] = 0x4e ;
            return outCardResult;
        }
        //对王
        else if(handCardCount===2 && gameLogic.getCardColor(handCardDataArr[0])===0x40 && gameLogic.getCardColor(handCardDataArr[1])===0x40) {
            outCardResult.cardCount = 2 ;
            outCardResult.resultCard[0] = 0x4f ;
            outCardResult.resultCard[1] = 0x4e ;
            return outCardResult;
        }
        else {
            //设置变量
            outCardResult.cardCount=cardTypeResultArr[minCardType].eachHandCardCount[tmpIndex];
            outCardResult.resultCard = cardTypeResultArr[minCardType].cardDataArr[tmpIndex].slice();
            return outCardResult;
        }
    }
    /* //如果只剩炸弹
     else if (CardTypeResult[CT_BOMB_CARD].cbCardTypeCount > 0)
     {
         //BYTE Index=0 ;
         //BYTE cbLogicCardValue = GetCardLogicValue(0x4F)+1 ;
         ////最小炸弹
         //for(BYTE i=0; i<CardTypeResult[CT_BOMB_CARD].cbCardTypeCount; ++i)
         //	if(cbLogicCardValue>GetCardLogicValue(CardTypeResult[CT_BOMB_CARD].cbCardData[i][0]))
         //	{
         //		cbLogicCardValue = GetCardLogicValue(CardTypeResult[CT_BOMB_CARD].cbCardData[i][0]) ;
         //		Index = i ;
         //	}

         //	//设置变量
         //	OutCardResult.cbCardCount=CardTypeResult[CT_BOMB_CARD].cbEachHandCardCount[Index];
         //	CopyMemory(OutCardResult.cbResultCard,CardTypeResult[CT_BOMB_CARD].cbCardData[Index],CardTypeResult[CT_BOMB_CARD].cbEachHandCardCount[Index]*sizeof(BYTE));

         //	return ;
     }*/

    let allSingleCardData = [];
    let allSingleCardCount = this.analyseSingleCardCount(handCardDataArr, null,allSingleCardData) ;

    if ( allSingleCardCount > 0 ) {
        //如果都没有搜索到就出最小的一张
        if (1 === allUserCardDataArr[bankerUserChairID].length ) {
            outCardResult.cardCount = 1 ;
            outCardResult.resultCard[0] = allSingleCardData[0] ;
            return outCardResult;
        }
    }

    //如果都没有搜索到就出最小的一张
    outCardResult.cardCount = 1 ;
    outCardResult.resultCard[0] = handCardDataArr[handCardCount-1] ;

    return outCardResult;
};

// 地主下家(后出牌)
logic.undersideOfBankerOutCardPassive = function (handCardDataArr, outCardUserChairID, turnCardDataArr, bankerUserChairID, allUserCardDataArr) {
    let outCardResult = {
        cardCount: 0,
        resultCard: []
    };

    let handCardCount = handCardDataArr.length;

    // 友方牌信息
    let friendChairID = (bankerUserChairID+1)%GAME_PLAYER ;
    let friendCardType = gameLogic.getCardType(allUserCardDataArr[friendChairID]);

    //出牌类型
    let outCardType = gameLogic.getCardType(turnCardDataArr) ;

    let cardTypeResultArr = [];
    this.analyseOutCardTypePassive(handCardDataArr,turnCardDataArr, cardTypeResultArr) ;

    let bankCardTypeResultArr = [];
    this.analyseOutCardTypePassive(allUserCardDataArr[bankerUserChairID], turnCardDataArr, bankCardTypeResultArr);

    //只剩炸弹
    if(handCardCount===cardTypeResultArr[gameProto.cardType.BOMB_CARD].eachHandCardCount[0] && (outCardType<gameProto.cardType.BOMB_CARD ||
            gameLogic.getCardLogicValue(cardTypeResultArr[gameProto.cardType.BOMB_CARD].cardDataArr[0][0])>gameLogic.getCardLogicValue(turnCardDataArr[0]))) {
        outCardResult.cardCount = cardTypeResultArr[gameProto.cardType.BOMB_CARD].eachHandCardCount[0] ;
        outCardResult.resultCard = cardTypeResultArr[gameProto.cardType.BOMB_CARD].cardDataArr[0].slice();
        return outCardResult;
    }
    //双王炸弹和一手
    else if(handCardCount>2 && handCardDataArr[0]===0x4f && handCardDataArr[1]===0x4e ) {
        let leftCardType = gameLogic.getCardType(handCardDataArr.slice(2));
        if (leftCardType !== gameProto.cardType.ERROR && leftCardType !== gameProto.cardType.FOUR_LINE_TAKE_ONE && leftCardType !== gameProto.cardType.FOUR_LINE_TAKE_TWO){
            outCardResult.cardCount = 2;
            outCardResult.resultCard[0] = 0x4f ;
            outCardResult.resultCard[1] = 0x4e ;
            return outCardResult;
        }
    }

    //炸弹和一手
    let remainCard = [];
    let remainCount = 0;
    let allBombCard = this.getAllBombCard(handCardDataArr);
    let allBombCount = allBombCard.length;
    //出炸判断
    if(allBombCount>0 && bankerUserChairID === outCardUserChairID) {
        //剩余扑克
        remainCard = handCardDataArr.slice();
        gameLogic.removeCard(allBombCard, remainCard);
        remainCount = remainCard.length;

        if(gameProto.cardType.ERROR !== gameLogic.getCardType(remainCard) ||
            (2===remainCount && gameLogic.getCardLogicValue(remainCard[0])>gameLogic.getCardLogicValue(allUserCardDataArr[bankerUserChairID][0]))) {
            if((outCardType<gameProto.cardType.BOMB_CARD || gameLogic.getCardLogicValue(allBombCard[0])>gameLogic.getCardLogicValue(turnCardDataArr[0])) &&
                ( cardTypeResultArr[outCardType].cardTypeCount <= 0 || gameProto.cardType.ERROR !== gameLogic.getCardType(remainCard) ) ) {
                //双王炸弹
                if(gameLogic.getCardColor(allBombCard[0])===0x40) {
                    outCardResult.cardCount = 2 ;
                    outCardResult.resultCard[0] = 0x4f ;
                    outCardResult.resultCard[1] = 0x4e ;
                    return outCardResult;
                }
                else {
                    //分析地主牌
                    let bankerAllBombCard = this.getAllBombCard(allUserCardDataArr[bankerUserChairID]);
                    let bankerAllBombCardCount = bankerAllBombCard.length;

                    if ( !gameLogic.compareCard( turnCardDataArr, remainCard) ||  ( bankerAllBombCardCount <= 0)||
                        ( gameLogic.getCardLogicValue( allBombCard[0] ) > gameLogic.getCardLogicValue( bankerAllBombCard[0] ))) {
                        outCardResult.cardCount = 4 ;
                        outCardResult.resultCard = allBombCard.slice(0, 4);
                        return outCardResult;
                    }
                }
            }
        }
    }

    //只剩一手出炸
    let cardTypeResultBomb = cardTypeResultArr[gameProto.cardType.BOMB_CARD];
    if ( cardTypeResultBomb.cardTypeCount > 0 && friendCardType !== gameProto.cardType.ERROR && friendCardType <= gameProto.cardType.DOUBLE ) {
        //只剩单牌
        if ( friendCardType === gameProto.cardType.SINGLE ) {
            let index = cardTypeResultBomb.cardTypeCount - 1 ;
            outCardResult.resultCard = cardTypeResultBomb.cardDataArr[index].slice();
            outCardResult.cardCount = cardTypeResultBomb.eachHandCardCount[index] ;
            return outCardResult;
        } else if ( friendCardType === gameProto.cardType.DOUBLE ) {
            let allDoubleCard = this.getAllDoubleCard(handCardDataArr);
            let allDoubleCount = allDoubleCard.length;
            if ( allDoubleCount > 0 && gameLogic.getCardLogicValue(allDoubleCard[allDoubleCount - 1]) <= 10) {
                let index = cardTypeResultBomb.cardTypeCount - 1 ;
                outCardResult.cardCount = cardTypeResultBomb.eachHandCardCount[index];
                outCardResult.resultCard = cardTypeResultBomb.cardDataArr[index].slice();
                return outCardResult;
            }
        }

    }

    //只有一手牌
    let handCardType = gameLogic.getCardType(handCardDataArr);
    if ( handCardType !== gameProto.cardType.FOUR_LINE_TAKE_ONE && handCardType !== gameProto.cardType.FOUR_LINE_TAKE_TWO &&
        gameLogic.compareCard(turnCardDataArr, handCardDataArr) ) {
        outCardResult.cardCount = handCardCount ;
        outCardResult.resultCard = handCardDataArr.slice();
        return outCardResult;
    }

    //对牌接牌判断
    if (1 === allUserCardDataArr[bankerUserChairID] && handCardCount >= 2 && outCardType === gameProto.cardType.DOUBLE) {
        let analyseResult = gameLogic.analyseCardDataArr(handCardDataArr);

        //对牌判断
        if (handCardCount === (analyseResult.doubleCardData.length + analyseResult.threeCardData.length + analyseResult.fourCardData.length) ||
            handCardCount === (analyseResult.doubleCardData.length + analyseResult.threeCardData.length + analyseResult.fourCardData.length + 1)) {
            //出对判断
            for (let index = analyseResult.doubleCardData.length -1; index>=0 ; --index){
                if (gameLogic.getCardLogicValue(analyseResult.doubleCardData[index*2]) > gameLogic.getCardLogicValue(turnCardDataArr[0])) {
                    outCardResult.cardCount = 2 ;
                    outCardResult.resultCard[0] = analyseResult.doubleCardData[index*2] ;
                    outCardResult.resultCard[1] = analyseResult.doubleCardData[index*2 + 1] ;
                    return outCardResult;
                }
            }
            //出炸判断
            if (analyseResult.fourCardData > 0) {
                //最小炸弹
                let lestBombIndex = analyseResult.fourCardData.length-1 ;
                outCardResult.cardCount = 4 ;
                outCardResult.resultCard[0] = analyseResult.fourCardData[lestBombIndex*4] ;
                outCardResult.resultCard[1] = analyseResult.fourCardData[lestBombIndex*4+1] ;
                outCardResult.resultCard[2] = analyseResult.fourCardData[lestBombIndex*4+2] ;
                outCardResult.resultCard[3] = analyseResult.fourCardData[lestBombIndex*4+3] ;
                return outCardResult;
            }

        }

        //分析对家
        if ( outCardUserChairID !== bankerUserChairID ) {
            let friendAnalyseResult = gameLogic.analyseCardDataArr(allUserCardDataArr[outCardUserChairID]);

            //对牌判断
            if (allUserCardDataArr[outCardUserChairID].length === (friendAnalyseResult.doubleCardData.length + friendAnalyseResult.doubleCardData.threeCardData.length + friendAnalyseResult.fourCardData.length) ||
                allUserCardDataArr[outCardUserChairID] === (friendAnalyseResult.doubleCardData.length + friendAnalyseResult.doubleCardData.threeCardData.length + friendAnalyseResult.fourCardData.length + 1)) {
                // 放弃出牌
                return outCardResult;
            }

            //零下标没用
            let friendCardTypeResult = [];

            this.analyseOutCardTypeActive( allUserCardDataArr[outCardUserChairID], friendCardTypeResult ) ;

            let friendCardTypeResultSingleLine = friendCardTypeResult[gameProto.cardType.SINGLE_LINE];
            for ( let lineCardIndex = 0; lineCardIndex < friendCardTypeResultSingleLine.cardTypeCount; ++lineCardIndex ){
                //剩余扑克
                let remainCardData = allUserCardDataArr[outCardUserChairID].slice();
                gameLogic.removeCard(friendCardTypeResultSingleLine.cardDataArr[lineCardIndex], remainCardData);
                let remainCardCount = remainCardData.length;
                //分析扑克
                friendAnalyseResult = gameLogic.analyseCardDataArr(remainCardData) ;

                //对牌判断
                if (remainCardCount === (friendAnalyseResult.doubleCardData.length + friendAnalyseResult.threeCardData.length + friendAnalyseResult.fourCardData.length) ||
                    remainCardCount === (friendAnalyseResult.doubleCardData.length + friendAnalyseResult.threeCardData.length + friendAnalyseResult.fourCardData.length + 1)) {
                    // 放弃出牌
                    return outCardResult;
                }
            }

            let friendCardTypeResultDoubleLine = friendCardTypeResult[gameProto.cardType.DOUBLE_LINE];
            for ( let lineCardIndex = 0; lineCardIndex < friendCardTypeResultDoubleLine.cardTypeCount; ++lineCardIndex ){
                //剩余扑克
                let remainCardData = allUserCardDataArr[outCardUserChairID].slice();
                gameLogic.removeCard(friendCardTypeResultDoubleLine.cardDataArr[lineCardIndex],remainCardData);
                let remainCardCount = remainCardData.length;
                //分析扑克
                friendAnalyseResult = gameLogic.analyseCardDataArr( remainCardData ) ;

                //对牌判断
                if (remainCardCount === (friendAnalyseResult.doubleCardData.length + friendAnalyseResult.threeCardData.length + friendAnalyseResult.fourCardData.length) ||
                    remainCardCount === (friendAnalyseResult.doubleCardData.length + friendAnalyseResult.threeCardData.length + friendAnalyseResult.fourCardData.length + 1)) {
                    // 放弃出牌
                    return outCardResult;
                }
            }


        }
    }

    //对家可否出完
    if( bankerUserChairID !== outCardUserChairID && ! gameLogic.compareCard( turnCardDataArr, allUserCardDataArr[ bankerUserChairID ]) ) {
        //庄家扑克
        let isBankerCanOut = false ;
        let bankerOutCardResultArr = [];

        //分析扑克
        this.analyseOutCardTypePassive(allUserCardDataArr[bankerUserChairID], turnCardDataArr, bankerOutCardResultArr) ;
        for(let cardType=gameProto.cardType.SINGLE; cardType<=gameProto.cardType.MISSILE_CARD; ++cardType) if(bankerOutCardResultArr[cardType].cardTypeCount>0) isBankerCanOut = true ;

        if(!isBankerCanOut) {
            //分析扑克
            let friendCardTypeResult = [];
            this.analyseOutCardTypeActive(allUserCardDataArr[friendChairID], friendCardTypeResult) ;

            for(let cardType=gameProto.cardType.SINGLE; cardType<=gameProto.cardType.MISSILE_CARD; ++cardType)
                if(friendCardTypeResult[cardType].cardTypeCount>0) {
                    for(let index=0; index<friendCardTypeResult[cardType].cardTypeCount; ++index) {
                        if(this.testOutAllCard(friendChairID, bankerUserChairID, friendCardTypeResult[cardType].cardDataArr[index], true, allUserCardDataArr)) {
                            //不压对家
                            return outCardResult;
                        }
                    }
                }
        }
    }

    //放走对家
    if (gameLogic.compareCard(turnCardDataArr, allUserCardDataArr[friendChairID]))
        return outCardResult;

    //判断可否出完
    let singleCardCount = MAX_COUNT+gameProto.cardType.MISSILE_CARD ;
    let isFindBestCard = false ;
    for(let cardType=gameProto.cardType.SINGLE; cardType<=gameProto.cardType.MISSILE_CARD; ++cardType)
        if(cardTypeResultArr[cardType].cardTypeCount>0) {
            let cardTypeResult = cardTypeResultArr[cardType];
            for(let index=0; index<cardTypeResult.cardTypeCount; ++index){
                if(this.testOutAllCard(outCardUserChairID, bankerUserChairID, cardTypeResult.cardDataArr[index], false, allUserCardDataArr)) {
                    //计算单牌
                    let tmpSingleCount = this.analyseSingleCardCount(handCardDataArr, cardTypeResult.cardDataArr[index]) ;
                    //结果判断
                    if (tmpSingleCount >= MAX_COUNT) continue ;

                    //炸弹优先级排后
                    let bombCardType = gameLogic.getCardType(cardTypeResult.cardDataArr[index], cardTypeResult.eachHandCardCount[index]) ;
                    if (bombCardType === gameProto.cardType.BOMB_CARD) tmpSingleCount += 4 ;
                    else if (bombCardType === gameProto.cardType.MISSILE_CARD) tmpSingleCount += 5 ;

                    ////改变权值
                    //if (cbBombCardType != CT_ERROR) cbTmpSingleCount += cbBombCardType ;

                    //不出炸弹
                    //BYTE cbWantOutCardType = GetCardType(CardTypeResult[cbCardType].cbCardData[lIndex], CardTypeResult[cbCardType].cbEachHandCardCount[lIndex]) ;
                    //if (CardTypeResult[cbOutCardType].cbCardTypeCount > 0 && cbOutCardType < CT_BOMB_CARD && cbWantOutCardType >= CT_BOMB_CARD) continue ;

                    if (tmpSingleCount <= singleCardCount) {
                        //设置变量
                        outCardResult.cardCount=cardTypeResult.eachHandCardCount[index];
                        outCardResult.resultCard = cardTypeResult.cardDataArr[index].slice();
                        singleCardCount = tmpSingleCount ;
                        isFindBestCard = true ;
                    }
                }
            }
        }
    //直接返回
    if (isFindBestCard) return outCardResult;

    //取出四个最小单牌
    let minSingleCardCount = [MAX_COUNT, MAX_COUNT, MAX_COUNT, MAX_COUNT];
    let index = [0, 0, 0, 0];
    let minSingleCountInFour=MAX_COUNT ;

    //可出扑克（这里已经过滤掉炸弹了）
    let canOutCardTypeResult = cardTypeResultArr[outCardType];

    for(let i=0; i<canOutCardTypeResult.cardTypeCount; ++i){
        //最小单牌
        let tmpCount = this.analyseSingleCardCount(handCardDataArr,canOutCardTypeResult.cardDataArr[i]) ;
        //搜索cbMinSingleCardCount[4]的最大值
        for(let j=0; j<4; ++j){
            if(minSingleCardCount[j]>=tmpCount) {
                minSingleCardCount[j] = tmpCount ;
                index[j] = i ;
                break ;
            }
        }

    }

    for(let i=0; i<4; ++i)
        if(minSingleCountInFour>minSingleCardCount[i]) minSingleCountInFour = minSingleCardCount[i] ;

    //原始单牌数
    let originSingleCardCount = this.analyseSingleCardCount(handCardDataArr, null) ;

    //朋友出牌
    let isFriendOut = bankerUserChairID!==outCardUserChairID ;
    if(isFriendOut) {
        //不拦截朋友最后一手牌
        if (friendCardType !== gameProto.cardType.ERROR) return outCardResult;
        //在上面的TestOutAllCard中已对可出炸弹情况分析过
        if(canOutCardTypeResult.cardTypeCount>0 && canOutCardTypeResult.cardType < gameProto.cardType.BOMB_CARD) {
            let minLogicCardValue = gameLogic.getCardLogicValue(0x4F)+1 ;
            let isFindCard = false ;
            let canOutIndex=0 ;
            for(let i=0; i<4; ++i) {
                let tmpIndex = index[i] ;
                //三带，和连牌不接对家牌
                if ( canOutCardTypeResult.cardType >= gameProto.cardType.THREE &&  canOutCardTypeResult.cardType <= gameProto.cardType.MISSILE_CARD && gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0]) >= 7 &&
                    canOutCardTypeResult.eachHandCardCount[tmpIndex] <=5 )
                    continue ;

                //拦截对牌
                //if (cbOutCardType == CT_DOUBLE && cbBankerDoubleCardCount > 0 && GetCardLogicValue(cbBankerDoubleCardData[cbBankerDoubleCardCount-1]) < 10 &&
                //	GetCardLogicValue(CanOutCard.cbCardData[Index][0]) < GetCardLogicValue(cbBankerDoubleCardData[cbBankerDoubleCardCount-1]) &&
                //	GetCardLogicValue(CanOutCard.cbCardData[0][0]) >= 10 && GetCardLogicValue(CanOutCard.cbCardData[0][0]) < 14) continue ;

                //小于J的牌，或者小于K而且是散牌
                if(((minSingleCardCount[i]<originSingleCardCount+3 &&  (minSingleCardCount[i]<=minSingleCountInFour || minSingleCardCount[i]<=minSingleCountInFour+1 &&
                        canOutCardTypeResult.cardType >= gameProto.cardType.THREE_LINE_TAKE_ONE && canOutCardTypeResult.cardType <= gameProto.cardType.THREE_LINE_TAKE_TWO ) &&
                        (gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0])<=11 || (minSingleCardCount[i]<originSingleCardCount)&&gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0])<=13)) &&
                        minLogicCardValue>gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0]) && handCardCount>5)) {
                    //搜索有没有大牌（针对飞机带翅膀后面的带牌）
                    let noLargeCard = true ;
                    for(let k=3; k<canOutCardTypeResult.eachHandCardCount[tmpIndex]; ++k){
                        //有大牌而且不能一次出完
                        if(gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][k])>=15 &&
                            canOutCardTypeResult.eachHandCardCount[tmpIndex]!==handCardCount) noLargeCard = false ;
                    }
                    if(noLargeCard) {
                        isFindCard = true ;
                        canOutIndex = tmpIndex ;
                        minLogicCardValue = gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0]) ;
                    }
                } else if(handCardCount<5 && minSingleCardCount[i]<originSingleCardCount+4 && minSingleCardCount[i]<=minSingleCountInFour &&
                    minLogicCardValue>gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0])) {
                    //能出王打自家的2
                    if ( gameLogic.getCardLogicValue( canOutCardTypeResult.cardDataArr[tmpIndex][0] ) >= 16 && gameLogic.getCardLogicValue( turnCardDataArr[0] ) >= 15 )
                        continue ;

                    isFindCard = true ;
                    canOutIndex = tmpIndex ;
                    minLogicCardValue = gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0]) ;
                }
            }

            if(isFindCard) {
                //设置变量
                canOutCardTypeResult.cardCount=canOutCardTypeResult.eachHandCardCount[canOutIndex];
                canOutCardTypeResult.resultCard = canOutCardTypeResult.cardDataArr[canOutIndex].slice();

                return canOutCardTypeResult;
            }
            //手上少于五张牌
            else if(handCardCount<=5) {
                let minLogicCard = gameLogic.getCardLogicValue(0x4f)+1 ;
                let canOutIndex = 0 ;
                for(let i=0; i<4; ++i)
                    if(minSingleCardCount[i]<MAX_COUNT && minSingleCardCount[i]<=minSingleCountInFour && minLogicCard>gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[index[i]][0]) &&
                        gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[index[i]][0])<=14) {
                        minLogicCard = gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[index[i]][0]) ;
                        canOutIndex = index[i] ;
                    }

                if(minLogicCard !== (gameLogic.getCardLogicValue(0x4f)+1)) {
                    //设置变量
                    outCardResult.cardCount = canOutCardTypeResult.eachHandCardCount[canOutIndex];
                    outCardResult.resultCard = canOutCardTypeResult.cardDataArr[canOutIndex].slice();

                    return outCardResult;
                }
            }

            return outCardResult;
        }
        else
        {
            return outCardResult;
        }

    }else{ // 地主出牌
        if(canOutCardTypeResult.cardTypeCount>0 && minSingleCountInFour < MAX_COUNT) {
            let minLogicCardValue = gameLogic.getCardLogicValue(0x4F)+1 ;
            let isFindCard = false ;
            let canOutIndex=0 ;
            for(let i=0; i<4; ++i){
                let tmpIndex = index[i] ;

                if((minSingleCardCount[i]<originSingleCardCount+3)  &&  (minSingleCardCount[i]<=minSingleCountInFour || minSingleCardCount[i]<=minSingleCountInFour+1 &&
                        canOutCardTypeResult.cardType >= gameProto.cardType.THREE_LINE_TAKE_ONE && canOutCardTypeResult.cardType <= gameProto.cardType.THREE_LINE_TAKE_TWO ) &&
                    minLogicCardValue>gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0])) {
                    //针对大牌
                    let isNoLargeCard = true ;

                    //当出牌玩家手上牌数大于4，而且出的是小于K的牌而且不是出牌手上的最大牌时，不能出2去打
                    if(allUserCardDataArr[outCardUserChairID].length>=4 && handCardCount>=5  && canOutCardTypeResult.eachHandCardCount[tmpIndex]>=2 &&
                        gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0])>=15 &&
                        gameLogic.getCardLogicValue(turnCardDataArr[0])<13 &&
                        (gameLogic.getCardLogicValue(turnCardDataArr[0])<gameLogic.getCardLogicValue(allUserCardDataArr[bankerUserChairID][0])) &&
                        canOutCardTypeResult.eachHandCardCount[tmpIndex]!==handCardCount)
                        isNoLargeCard=false ;

                    //搜索有没有大牌（针对飞机带翅膀后面的带牌）
                    for(let k=3; k<canOutCardTypeResult.eachHandCardCount[tmpIndex]; ++k){
                        if(gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][k])>=15 &&
                            canOutCardTypeResult.eachHandCardCount[tmpIndex]!==handCardCount)
                            isNoLargeCard = false ;
                    }
                    if(isNoLargeCard) {
                        isFindCard = true ;
                        canOutIndex = tmpIndex ;
                        minLogicCardValue = gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[tmpIndex][0]) ;
                    }
                }
            }

            if(isFindCard) {
                //最大牌
                let largestLogicCard = gameLogic.getCardLogicValue(allUserCardDataArr[bankerUserChairID][0]);
                let isCanOut=true ;

                //王只压2
                if(gameLogic.getCardLogicValue(turnCardDataArr[0])<largestLogicCard) {
                    if(gameLogic.getCardColor(canOutCardTypeResult.cardDataArr[canOutIndex][0])===0x40 && gameLogic.getCardLogicValue(turnCardDataArr[0])<=14 && handCardCount>5) {
                        isCanOut = false ;
                    }
                }

                //双王判断
                if(gameLogic.getCardLogicValue(canOutCardTypeResult.cardDataArr[canOutIndex][0])>=16 && handCardCount>=2 && handCardDataArr[0]===0x4F && handCardDataArr[1]===0x4E) {
                    let isOutMissileCard = false ;
                    //一手牌和一个炸弹
                    let remainCardData = handCardDataArr.slice();
                    gameLogic.removeCard([0x4F, 0x4E], remainCardData) ;
                    let remainCardCount = remainCardData.length;
                    let remainCardType = gameLogic.getCardType(remainCardData);
                    if(gameProto.cardType.ERROR!==remainCardType) isOutMissileCard = true;

                    //只剩少量牌
                    if (!isOutMissileCard){
                        let remainLargestCard = gameLogic.getCardLogicValue(remainCardData[0]);
                        if(remainCardCount<5 && remainLargestCard>=14) isOutMissileCard = true;
                    }

                    //炸后单牌数
                    if (!isOutMissileCard){
                        let singleCardCount = this.analyseSingleCardCount(handCardDataArr, canOutCardTypeResult.cardDataArr[canOutIndex]) ;
                        if(singleCardCount<=1 && gameLogic.getCardLogicValue(remainCardData[0])>=11) isOutMissileCard = true;
                    }

                    //还有小牌
                    if(isOutMissileCard){
                        if (gameLogic.getCardLogicValue(remainCardData[0]) <= 10 && gameProto.cardType.ERROR === remainCardType &&
                            (gameLogic.getCardLogicValue(allUserCardDataArr[bankerUserChairID][0]) > 10))
                            isOutMissileCard = false ;
                    }


                    //火箭扑克
                    if(isOutMissileCard) {
                        //优先其他炸弹
                        let index = cardTypeResultArr[gameProto.cardType.BOMB_CARD].cardTypeCount - 1 ;
                        outCardResult.cardCount = cardTypeResultArr[gameProto.cardType.BOMB_CARD].eachHandCardCount[index] ;
                        outCardResult.resultCard = cardTypeResultArr[gameProto.cardType.BOMB_CARD].cardDataArr[index].slice();
                        return outCardResult;
                    }
                }

                if(isCanOut) {
                    //设置变量
                    outCardResult.cardCount=canOutCardTypeResult.eachHandCardCount[canOutIndex];
                    outCardResult.resultCard = canOutCardTypeResult.cardDataArr[canOutIndex].slice();
                    return outCardResult;
                }
            }

            if(outCardType===gameProto.cardType.SINGLE) {
                //地主的最大牌
                let largestLogicCard = gameLogic.getCardLogicValue(allUserCardDataArr[bankerUserChairID][0]);

                if(gameLogic.getCardLogicValue(turnCardDataArr[0])===14 ||
                    gameLogic.getCardLogicValue(turnCardDataArr[0])>=largestLogicCard ||
                    (gameLogic.getCardLogicValue(turnCardDataArr[0])<largestLogicCard-1) ||
                    (allUserCardDataArr[bankerUserChairID].length<=5)) {
                    //取一张大于等于2而且要比闲家出的牌大的牌，
                    let index=MAX_COUNT ;
                    for(let i=0; i<handCardCount; ++i)
                        if(gameLogic.getCardLogicValue(handCardDataArr[i])>gameLogic.getCardLogicValue(turnCardDataArr[0]) &&
                            gameLogic.getCardLogicValue(handCardDataArr[i])>=15) {
                            index = i ;
                        }
                    if(index!==MAX_COUNT) {
                        //设置变量
                        outCardResult.cardCount=1;
                        outCardResult.resultCard[0] = handCardDataArr[index] ;

                        return outCardResult;
                    }
                }
            }
            //当朋友不能拦截地主时
            let friendCardTypeResult = [];
            this.analyseOutCardTypePassive(allUserCardDataArr[friendChairID], turnCardDataArr, friendCardTypeResult) ;

            //当朋友不能拦截地主时
            if(allUserCardDataArr[bankerUserChairID].length<=4 && friendCardTypeResult[outCardType].cardTypeCount===0 && cardTypeResultArr[outCardType].cardTypeCount>0) {
                let minSingleCount=MAX_COUNT ;
                let index=0 ;
                for(let i=0; i<cardTypeResultArr[outCardType].cardTypeCount; ++i){
                    let tmpCount = this.analyseSingleCardCount(handCardDataArr, cardTypeResultArr[outCardType].cardDataArr[i]) ;
                    if(minSingleCount>=tmpCount) {
                        minSingleCount = tmpCount ;
                        index = i ;
                    }
                }
                //设置变量
                outCardResult.cardCount=cardTypeResultArr[outCardType].eachHandCardCount[index];
                outCardResult.resultCard = cardTypeResultArr[outCardType].cardDataArr[index].slice();
                return outCardResult;
            }
        }

        //还要考虑炸弹
        if(cardTypeResultArr[gameProto.cardType.BOMB_CARD].cardTypeCount>0 && NORMAL_COUNT === handCardCount && NORMAL_COUNT === allUserCardDataArr[friendChairID].length) {
            let bombCardTypeResult = cardTypeResultArr[gameProto.cardType.BOMB_CARD] ;
            let minLogicValue = gameLogic.getCardLogicValue(bombCardTypeResult.cardDataArr[0][0]) ;
            let index = 0 ;
            for(let i=0; i<bombCardTypeResult.cardTypeCount; ++i){
                if(minLogicValue>gameLogic.getCardLogicValue(bombCardTypeResult.cardDataArr[i][0])) {
                    minLogicValue = gameLogic.getCardLogicValue(bombCardTypeResult.cardDataArr[i][0]) ;
                    index = i ;
                }
            }
            let isOutBomb=false ;

            //春天判断
            // if (NORMAL_COUNT  == cbHandCardCount && NORMAL_COUNT == m_cbUserCardCount[(m_wBankerUser+1)%GAME_PLAYER] && CT_ERROR != GetCardType(m_cbAllCardData[m_wBankerUser], m_cbUserCardCount[m_wBankerUser]))
            //     bOutBomb = true ;

            //另一闲家
            //WORD wOtherUser=INVALID_CHAIR ;
            //for(WORD wUser=0; wUser<GAME_PLAYER; ++wUser)
            //	if(wUser!=wOutCardUser && wUser!=m_wBankerUser) wOtherUser=wOtherUser ;

            //一手牌和一个炸弹
            let remainCardData = handCardDataArr.slice();
            gameLogic.removeCard(bombCardTypeResult.cardDataArr[index], remainCardData);
            let remainCardType = gameLogic.getCardType(remainCardData);
            let remainCardCount = remainCardData.length;
            if(gameProto.cardType.ERROR!==remainCardType) isOutBomb = true ;

            //炸后单牌数
            if (!isOutBomb){
                let singleCardCount = this.analyseSingleCardCount(handCardDataArr, bombCardTypeResult.cardDataArr[index]) ;
                if(singleCardCount===0 && gameLogic.getCardLogicValue(remainCardData[0]) >
                    gameLogic.getCardLogicValue(allUserCardDataArr[bankerUserChairID])) isOutBomb = true ;
            }

            //只剩一手
            if (!isOutBomb){
                if(remainCardType>gameProto.cardType.ERROR && remainCardType<gameProto.cardType.FOUR_LINE_TAKE_ONE && gameLogic.getCardLogicValue(allUserCardDataArr[outCardUserChairID][0])<15 &&
                    singleCardCount < 2 && (gameLogic.getCardLogicValue(remainCardData[0]) >= gameLogic.getCardLogicValue(allUserCardDataArr[bankerUserChairID][0]))) isOutBomb = true ;
            }

            //反春天
            //if (remainCardType !== gameProto.cardType.ERROR && m_lBankerOutCardCount == 1) bOutBomb = true ;

            //只剩少量牌
            if (!isOutBomb){
                let remainLargestCard = gameLogic.getCardLogicValue(remainCardData[0]) ;
                if(remainCardCount<5 && remainCardCount>0 && (remainLargestCard!==gameLogic.getCardLogicValue(bombCardTypeResult.cardDataArr[index][0])) &&
                    remainLargestCard>gameLogic.getCardLogicValue(allUserCardDataArr[outCardUserChairID][0]) && remainLargestCard > 14) isOutBomb = true ;
            }

            if (!isOutBomb){
                //分析扑克
                let analyseResult = gameLogic.analyseCardDataArr(remainCardData);
                if (allUserCardDataArr[bankerUserChairID].length === 1 && (analyseResult.doubleCardData.length + analyseResult.threeCardData.length + analyseResult.fourCardData.length + 1 >= remainCardCount)) isOutBomb = true ;
            }

            //设置变量
            if(isOutBomb) {
                outCardResult.cardCount = bombCardTypeResult.eachHandCardCount[index];
                outCardResult.resultCard = bombCardTypeResult.cardDataArr[index].slice();
            }
            return outCardResult;
        }
        return outCardResult;
    }
};

logic.testOutAllCard = function(testUserChairID, bankerUserChairID, wantOutCardDataArr, isFirstOutCard, allUserCardDataArr) {
    try {
        if ( ! this.verifyOutCard( testUserChairID, bankerUserChairID, wantOutCardDataArr, allUserCardDataArr[ testUserChairID ], isFirstOutCard , allUserCardDataArr) ) {
            return false;
        }
        //初始栈
        let stackHandCardInfo = [];
        //模拟递归处理
        if ( wantOutCardDataArr.length !== allUserCardDataArr[ testUserChairID ] ) {
            //第一个元素
            let originHandCardInfo = {
                handCardDataArr: [],
                handCardCount: 0,
                cardTypeResultArr: []
            };

            //手上扑克
            originHandCardInfo.handCardDataArr = allUserCardDataArr[testUserChairID].slice();
            originHandCardInfo.handCardCount = originHandCardInfo.handCardDataArr.length;

            //移除第一手牌
            gameLogic.removeCard(wantOutCardDataArr, originHandCardInfo.handCardDataArr);
            originHandCardInfo.handCardCount -= wantOutCardDataArr.length;

            //分析扑克
            try {
                this.analyseOutCardTypeActive( originHandCardInfo.handCardDataArr, originHandCardInfo.cardTypeResultArr ) ;
            }
            catch(err){
                console.error(err);
                return false ;
            }

            //元素压栈
            stackHandCardInfo.push(originHandCardInfo);

            //次数控制
            let judgeCount = 0;

            while (stackHandCardInfo.length > 0) {
                //防止死循环
                if ( ++judgeCount === 500 ) {
                    return false;
                }

                //栈顶元素
                let topHandCardInfo = stackHandCardInfo[stackHandCardInfo.length - 1];

                //合法判断
                if (!topHandCardInfo) {
                    return false;
                }

                //牌型数据
                let outCardTypeResult = topHandCardInfo.cardTypeResultArr;

                //禁止的牌型
                outCardTypeResult[ gameProto.cardType.FOUR_LINE_TAKE_ONE ].cardTypeCount = 0;
                outCardTypeResult[ gameProto.cardType.FOUR_LINE_TAKE_TWO ].cardTypeCount = 0;

                //所有牌型
                let isBreakJudge = false;
                let isFindLargestCard = false;
                for ( let outCardTypeIndex = gameProto.cardType.SINGLE; outCardTypeIndex <= gameProto.cardType.MISSILE_CARD && ! isBreakJudge; ++outCardTypeIndex ) {
                    let cardTypeResult = outCardTypeResult[ outCardTypeIndex ];
                    for ( let handCardIndex = 0; handCardIndex < cardTypeResult.cardTypeCount && ! isBreakJudge ; ++handCardIndex ) {

                        //是否判断过
                        if ( cardTypeResult.eachHandCardCount[ handCardIndex ] === 0 ) {
                            continue;
                        }

                        //最大判断
                        if ( this.isLargestCard( testUserChairID, bankerUserChairID, cardTypeResult.cardDataArr[ handCardIndex ], allUserCardDataArr) ) {

                            //最后一手
                            let isLastHandCard = cardTypeResult.eachHandCardCount[ handCardIndex ] === topHandCardInfo.handCardCount ;
                            if ( isLastHandCard ) {
                                return true ;
                            }

                            //是否能出
                            if ( ! this.verifyOutCard( testUserChairID, bankerUserChairID, cardTypeResult.cardDataArr[ handCardIndex ], topHandCardInfo.handCardDataArr, isFirstOutCard, allUserCardDataArr ) ) {

                                //表明此牌已经判断过
                                cardTypeResult.eachHandCardCount[ handCardIndex ] = 0;
                                continue;
                            }

                            //新建栈元素
                            let newHandCardInfo = {
                                handCardDataArr: [],
                                handCardCount: 0,
                                cardTypeResultArr: []
                            };
                            //手上扑克
                            newHandCardInfo.handCardDataArr = topHandCardInfo.handCardDataArr.slice();
                            newHandCardInfo.handCardCount = topHandCardInfo.handCardCount;

                            //移除当前一手
                            gameLogic.removeCard(cardTypeResult.cardDataArr[handCardIndex], newHandCardInfo.handCardDataArr);
                            newHandCardInfo.handCardCount -= cardTypeResult.eachHandCardCount[ handCardIndex ];

                            //表明此牌已经判断过
                            cardTypeResult.eachHandCardCount[ handCardIndex ] = 0;

                            //分析扑克
                            try {
                                this.analyseOutCardTypeActive( newHandCardInfo.handCardDataArr, newHandCardInfo.cardTypeResultArr) ;
                            }
                            catch(err){
                                console.error(err);
                                return false ;
                            }

                            //元素压栈
                            stackHandCardInfo.push(newHandCardInfo);

                            //中断循环
                            isBreakJudge = true;

                            //设置标识
                            isFindLargestCard = true;
                        }
                        //当前一手的数目等于手上扑克数目
                        else if (cardTypeResult.eachHandCardCount[ handCardIndex ] === topHandCardInfo.handCardCount) {
                            return true ;
                        }
                    }
                }

                //出栈判断
                if (!isFindLargestCard) {
                    stackHandCardInfo.pop();
                }
            }
        }
        else {
            return true ;
        }
    }
    catch(err){
        console.error(err);
        return false;
    }
    return false ;
};

// 四带牌型
logic.analyseFourCardType = function( handCardDataArr, enemyCardDataArr, outCardResult ) {
    //初始变量
    outCardResult.cardCount = 0;
    outCardResult.resultCard = [];
    let handCardCount = handCardDataArr.length;

    //牌数判断
    if ( handCardCount < 5 ) return false ;

    //对方牌型分析
    if ( gameLogic.getCardType(enemyCardDataArr) === gameProto.cardType.SINGLE ) {
        //对王判断
        if ( gameLogic.getCardLogicValue(handCardDataArr[1] ) < 16 ) {
            //分析扑克
            let analyseResult = gameLogic.analyseCardDataArr(handCardDataArr);
            //分析牌型
            if ( handCardCount !== ( analyseResult.fourCardData.length + analyseResult.doubleCardData.length + analyseResult.singleCardData.length ) ||
                analyseResult.fourCardData.length <= 0 ) return false ;

            //个数判断
            if ( analyseResult.singleCardData.length < 2 ) return false ;

            //大小判断
            if ( gameLogic.getCardLogicValue(analyseResult.singleCardData[0]) >= gameLogic.getCardLogicValue(enemyCardDataArr[0]) ) return false ;

            //四张带两单
            if ( analyseResult.fourCardData.length >= 1 && analyseResult.singleCardData.length === 2 ) {
                //炸弹索引
                let fourCardIndex = analyseResult.fourCardData.length - 4 ;

                //返回结果
                outCardResult.cardCount = 4 + 2 ;
                outCardResult.resultCard = analyseResult.fourCardData.slice(fourCardIndex, fourCardIndex + 4);
                outCardResult.resultCard[4] = analyseResult.singleCardData[0] ;
                outCardResult.resultCard[5] = analyseResult.singleCardData[1] ;
                return true ;
            }
            //四张带三单
            else if ( analyseResult.fourCardData.length >= 1 && analyseResult.singleCardData.length === 3 ) {
                //炸弹索引
                let fourCardIndex = analyseResult.fourCardData.length - 4 ;

                //返回结果
                outCardResult.cardCount = 4 + 2 ;
                outCardResult.resultCard = analyseResult.fourCardData.slice(fourCardIndex, fourCardIndex + 4);
                outCardResult.resultCard[4] = analyseResult.singleCardData[1] ;
                outCardResult.resultCard[5] = analyseResult.singleCardData[2] ;
                return true ;
            }
        }
        //对王判断
        else if ( gameLogic.getCardLogicValue(handCardDataArr[1] ) === 16 ) {
            //分析扑克
            let analyseResult = gameLogic.analyseCardDataArr(handCardDataArr);

            //分析牌型
            if ( handCardCount !== ( analyseResult.fourCardData.length + analyseResult.doubleCardData.length + analyseResult.singleCardData.length ) ||
                analyseResult.fourCardData.length <= 0 ) return false ;

            //个数判断
            if ( analyseResult.singleCardData.length < 4 ) return false ;

            //大小判断
            if ( gameLogic.getCardLogicValue(analyseResult.singleCardData[2]) >= gameLogic.getCardLogicValue(enemyCardDataArr[0]) ) return false ;

            //四张带两单
            if ( analyseResult.fourCardData.length >= 1 && analyseResult.singleCardData.length === 4 ) {
                //炸弹索引
                let fourCardIndex = analyseResult.fourCardData.length - 4;

                //返回结果
                outCardResult.cardCount = 4 + 2 ;
                outCardResult.resultCard = analyseResult.fourCardData.slice(fourCardIndex, fourCardIndex + 4);
                outCardResult.resultCard[4] = analyseResult.singleCardData[2] ;
                outCardResult.resultCard[5] = analyseResult.singleCardData[3] ;
                return true ;
            }
            //四张带三单
            else if ( analyseResult.fourCardData.length >= 1 && analyseResult.singleCardData.length === 5 ) {
                //炸弹索引
                let fourCardIndex = analyseResult.fourCardData.length - 4;

                //返回结果
                outCardResult.cardCount = 4 + 2 ;
                outCardResult.resultCard = analyseResult.fourCardData.slice(fourCardIndex, fourCardIndex + 4);
                outCardResult.resultCard[4] = analyseResult.singleCardData[3] ;
                outCardResult.resultCard[5] = analyseResult.singleCardData[4] ;

                return true ;
            }
        }
    }
    return false ;
};

// 最大判断
logic.isLargestCard = function(testUserChairID, bankerUserChairID, wantOutCardDataArr, allUserCardDataArr) {
    //朋友ID
    let friendID = GAME_PLAYER ;
    if ( testUserChairID !== bankerUserChairID ) {
        friendID = ( testUserChairID === ( ( bankerUserChairID + 1 ) % GAME_PLAYER ) ) ? ( bankerUserChairID + 2 ) % GAME_PLAYER :
            ( bankerUserChairID + 1 ) % GAME_PLAYER ;
    }

    //出牌判断
    try{
        for ( let user = 0; user < GAME_PLAYER; ++user ) {
            if ( user !== testUserChairID && user !==  friendID) {
                let cardTypeResultArr = [];
                //出牌分析
                try {
                    this.analyseOutCardTypePassive(allUserCardDataArr[user], wantOutCardDataArr, cardTypeResultArr) ;
                }
                catch(err){
                    console.error(err);
                    return false ;
                }

                for ( let cardType = gameProto.cardType.SINGLE; cardType <= gameProto.cardType.MISSILE_CARD; ++cardType ) {
                    if (cardTypeResultArr[ cardType ].cardTypeCount > 0) {
                        return false ;
                    }
                }
            }
        }
    }
    catch(err){
        console.error(err);
        return false ;
    }
    return true;
};

// 是否能出
logic.verifyOutCard = function(testUserChairID, bankerUserChairID, wantOutCardDataArr, curHandCardData, isFirstOutCard, allUserCardDataArr) {
    let wantOutCardType = gameLogic.getCardType(wantOutCardDataArr) ;

    //首出判断
    if ( isFirstOutCard && wantOutCardDataArr.length  === curHandCardData.length) {
        return true;
    }

    //是否最大
    if (!this.isLargestCard( testUserChairID, bankerUserChairID, wantOutCardDataArr, allUserCardDataArr) ) {
        return false;
    }

    //拆炸判断
    let allBombCard = this.getAllBombCard(curHandCardData);
    let allBombCount = allBombCard.length;
    if (allBombCount > 0) {
        //愚蠢牌型
        if ( gameProto.cardType.FOUR_LINE_TAKE_ONE === wantOutCardType || gameProto.cardType.FOUR_LINE_TAKE_TWO===wantOutCardType ) return false ;

        //只剩炸弹
        if ( gameProto.cardType.BOMB_CARD <= wantOutCardType && wantOutCardDataArr.length === curHandCardData.length ) return true ;

        //只剩炸弹
        if ( allBombCount === allUserCardDataArr[ testUserChairID ].length && gameProto.cardType.BOMB_CARD <= wantOutCardType ) return true ;

        //炸弹和一手
        //剩余扑克
        let remainCard = curHandCardData.slice();
        gameLogic.removeCard(wantOutCardDataArr, remainCard);
        let remainCardType = gameLogic.getCardType(remainCard);
        if ( gameProto.cardType.BOMB_CARD <= wantOutCardType && remainCardType !== gameProto.cardType.ERROR &&
            gameProto.cardType.FOUR_LINE_TAKE_TWO !== remainCardType && gameProto.cardType.FOUR_LINE_TAKE_ONE !== remainCardType) {
            return true ;
        }

        //首出牌时不出炸弹
        if (gameProto.cardType.BOMB_CARD <= wantOutCardType && isFirstOutCard ) {
            //地主只剩一手牌
            if ( testUserChairID !== bankerUserChairID && gameLogic.getCardType( allUserCardDataArr[ bankerUserChairID ]) === gameProto.cardType.ERROR ) {
                return false ;
            }

            let undersideOfBanker = (bankerUserChairID+1)%GAME_PLAYER ;	//地主下家
            let upsideOfBanker = (undersideOfBanker+1)%GAME_PLAYER ;	//地主上家
            let undersideOfBankerCardType = gameLogic.getCardType( allUserCardDataArr[ undersideOfBanker ]);
            let upsideOfBankerCardType = gameLogic.getCardType( allUserCardDataArr[ upsideOfBanker ]);
            //闲家只剩一手牌
            if ( testUserChairID === bankerUserChairID && undersideOfBankerCardType === gameProto.cardType.ERROR &&
                upsideOfBankerCardType === gameProto.cardType.ERROR ) {
                return false ;
            }
        }

        //拆炸判断
        if ( wantOutCardType < gameProto.cardType.FOUR_LINE_TAKE_ONE && wantOutCardType !== gameProto.cardType.SINGLE_LINE ) {
            for ( let i = 0; i < wantOutCardDataArr.length; ++i ){
                let cardValue = gameLogic.getCardValue(wantOutCardDataArr[i]);
                for ( let j = 0; j < allBombCount; ++j ) {
                    if ( gameLogic.getCardValue( allBombCard[ j ] ) === cardValue) return false ;
                }
            }

        }
    }

    //出完判断
    if ( curHandCardData.length === wantOutCardDataArr.length) {
        return true ;
    }

    if ( curHandCardData.length === 0 ) {
        return true ;
    }

    try {
        if ( curHandCardData.length < wantOutCardDataArr.length) {
            return false ;
        }

        //剩余扑克
        let remainCard = curHandCardData.slice();
        gameLogic.removeCard(wantOutCardDataArr, remainCard);
        let remainCardCount = remainCard.length;
        if ( remainCardCount === 0 ) {
            return true;
        }

        //不带大牌
        if ( gameProto.cardType.THREE_LINE_TAKE_ONE <= wantOutCardType && wantOutCardType <= gameProto.cardType.FOUR_LINE_TAKE_TWO && ! isFirstOutCard ) {
            let isHaveLargeCard = false ;
            for ( let i = 3; i < wantOutCardDataArr.length; ++i ){
                if ( 15 <= gameLogic.getCardLogicValue( wantOutCardDataArr[ i ]) ) {
                    isHaveLargeCard = true ;
                    break ;
                }
            }
            if ( isHaveLargeCard ) {
                for ( let i = 0; i < remainCardCount; ++i ) {
                    if ( gameLogic.getCardLogicValue( remainCard[ i ]) < 15 ) {
                        return false ;
                    }
                }
            }
        }
    }
    catch(err){
        console.error(err);
        return false ;
    }

    return true;
};
