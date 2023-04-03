let exp = module.exports;
let gameProto = require('./DZProto');
let utils = require('../../util/utils');

let operationType = {
    PASS_OR_GIVE_UP: 0,
    FLOW: 1,
    ADD_BET: 2,
    ALL_IN: 3
};
// 弃/过牌、跟注、加注、alli
let operationRate = {};
operationRate[gameProto.cardType.SINGLE] = [0.3, 0.6, 0.1, 0];
operationRate[gameProto.cardType.ONE_DOUBLE] = [0.2, 0.7, 0.1, 0];
operationRate[gameProto.cardType.TWO_DOUBLE] = [0.1, 0.8, 0.1, 0];
operationRate[gameProto.cardType.THREE] = [0, 0.9, 0.1, 0];
operationRate[gameProto.cardType.SHUN_ZI] = [0, 0.7, 0.3, 0];
operationRate[gameProto.cardType.TONG_HUA] = [0, 0.4, 0.5, 0.1];
operationRate[gameProto.cardType.HU_LU] = [0, 0.4, 0.5, 0.1];
operationRate[gameProto.cardType.TIE_ZHI] = [0, 0.2, 0.7, 0.1];
operationRate[gameProto.cardType.TONG_HUA_SHUN] = [0, 0.2, 0.7, 0.1];
operationRate[gameProto.cardType.KING_TONG_HUA_SHUN] = [0, 0.2, 0.7, 0.1];

//let maxFlowCountArr = [0, 20, 50, 100, 150, 200, 300, 10000000000, 10000000000, 10000000000, 10000000000];
let maxFlowCountArr = [0, 50, 100, 200, 200, 500, 1000, 10000000000, 10000000000, 10000000000, 10000000000];

exp.getOperationResult = function(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID){
    let operationRateArr;
    if (isMaxChairID){
        operationRateArr = [0, 0.5, 0.4, 0.1];
    }else{
        operationRateArr = operationRate[maxCardType];
    }
    let rand = utils.getRandomNum(0, 100);
    let type = 0;
    for (let i = 0; i < operationRateArr.length; ++i){
        if (rand <= operationRateArr[i] * 100){
            type = i;
            break;
        }else{
            rand -= (operationRateArr[i] * 100);
        }
    }
    if (type === operationType.PASS_OR_GIVE_UP){
        return exp.userPassOrGiveUp(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID);
    }else if (type === operationType.FLOW){
        return exp.userFlow(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID);
    }else if (type === operationType.ADD_BET){
        return exp.userAddBet(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID);
    }else if (type === operationType.ALL_IN){
        return exp.userAllIn(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID);
    }else{
        console.error("getOperationResult err");
        console.error("rand", rand);
        console.error("maxCardType", maxCardType);
        console.error("operationRateArr", operationRateArr);
        console.error("type", type);
        return  exp.getOperationResult(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID);
    }
};

exp.userPassOrGiveUp = function(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID){
    // 需要跟注则弃牌，不需跟注接过牌
    if (curTurnBetCount < maxBetCount){
        if (isMaxChairID){
            return exp.userFlow(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID);
        }else{
            return gameProto.gameUserGiveUpNotify();
        }
    }else{
        return gameProto.gameUserBetNotify(0);
    }
};

exp.userFlow = function (maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID){
    // 判断是否已经超过下注上限,未超过则加注，已超过，则跟注或者弃牌
    if (curTurnBetCount < maxBetCount){
        let shouldBetCount = maxBetCount - curTurnBetCount;
        // 牌最大的玩家，金币不足则allin,金币足够则跟注
        if (isMaxChairID){
            if (shouldBetCount >= leftCount){
                return exp.userAllIn(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID);
            }else{
                return gameProto.gameUserBetNotify(maxBetCount - curTurnBetCount);
            }
        }else{
            // 判断金币是否足够，而且是否超出最大下注金币限制，金币不足则弃牌
            let maxLimitBetCount = bigBlindCount * maxFlowCountArr[maxCardType];
            if (shouldBetCount + totalBetCount > maxLimitBetCount || shouldBetCount > leftCount){
                return gameProto.gameUserGiveUpNotify();
            }else{
                if(shouldBetCount >= leftCount){
                    return exp.userAllIn(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID);
                }else{
                    return gameProto.gameUserBetNotify(maxBetCount - curTurnBetCount);
                }
            }
        }
    }else{
        return gameProto.gameUserBetNotify(0);
    }
};

exp.userAddBet = function(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID){
    let minLimitBetCount = bigBlindCount + maxBetCount - curTurnBetCount;
    // 如果金币不足最小下注金额， 则改为跟注
    if (minLimitBetCount > leftCount){
        return exp.userFlow(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID);
    }else{
        // 计算最大下注金额
        let maxLimitBetCount = bigBlindCount * maxFlowCountArr[maxCardType];
        let maxCount = leftCount > (maxLimitBetCount - totalBetCount)?(maxLimitBetCount - totalBetCount):leftCount;
        // 如果最大下注金额小于最小下注限制，则改为跟注
        if (maxCount < minLimitBetCount){
            return exp.userFlow(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID);
        }else{
            // 金币足够，则加注金额为最大下注金额和最小下注金额的随机值
            let betCount = minLimitBetCount + utils.keepNumberPoint(Math.random() * (maxCount - minLimitBetCount), 2);
            return gameProto.gameUserBetNotify(betCount);
        }
    }
};

exp.userAllIn = function (maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID){
    if(isMaxChairID){
        return gameProto.gameUserBetNotify(-1);
    }else{
        // 计算allin金额是否超过了最大金额限制，如果超过，则用户改为加注
        let maxLimitBetCount = bigBlindCount * maxFlowCountArr[maxCardType];
        if (leftCount + totalBetCount > maxLimitBetCount){
            return exp.userAddBet(maxCardType, curTurnBetCount, maxBetCount, totalBetCount, leftCount, bigBlindCount, isMaxChairID);
        }else{
            return gameProto.gameUserBetNotify(-1);
        }
    }
};