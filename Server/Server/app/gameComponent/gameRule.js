var exp = module.exports;
var enumeration = require('../constant/enumeration');
var logger = require('pomelo-logger').getLogger('pomelo');

exp.getDefaultRule = function (gameTypeInfo) {
    if (gameTypeInfo.kind === enumeration.gameType.NN){
        return {
            bureau: 0,
            memberCount: gameTypeInfo["maxPlayerCount"] || 5,
			baseScore: gameTypeInfo.baseScore,
			otherRule: {
				shangzhuang: 8,
				fanbei: 2,
				shangzhuangfen: 0,
				qiangzhuang: 1,
				tuizhu: 0,
				difenArr: [1, 2, 3, 4, 5],
				teshupai: 7,
			},
        }
    }else if (gameTypeInfo.kind === enumeration.gameType.BRNN){
        return {
            baseScore: gameTypeInfo.baseScore,
            roomType: enumeration.roomType.HUNDRED,
            startType: enumeration.gameRoomStartType.AUTO_START,
            bureau: 0,
            memberCount: gameTypeInfo["maxPlayerCount"] || 100
        }
    }else if (gameTypeInfo.kind === enumeration.gameType.ZJH){
        return {
            bureau: 0,
            memberCount: gameTypeInfo["maxPlayerCount"] || 6
        }
    }else if (gameTypeInfo.kind === enumeration.gameType.SSS){
        return {
			baseScore: gameTypeInfo.baseScore,
            otherRule:{
                youSanChuan: true,
                heiTaoA: true
            },
            bureau: 0,
            memberCount: gameTypeInfo["maxPlayerCount"] || 4
        }
    }else if (gameTypeInfo.kind === enumeration.gameType.TTZ){
        return {
			baseScore: gameTypeInfo.baseScore,
            roomType: enumeration.roomType.HUNDRED,
            startType: enumeration.gameRoomStartType.AUTO_START,
            bureau: 0,
            memberCount: gameTypeInfo["maxPlayerCount"] || 100
        }
    }else if (gameTypeInfo.kind === enumeration.gameType.HHDZ){
        return {
            baseScore: gameTypeInfo.baseScore,
            roomType: enumeration.roomType.HUNDRED,
            startType: enumeration.gameRoomStartType.AUTO_START,
            bureau: 0,
            memberCount: gameTypeInfo["maxPlayerCount"] || 100
        }
    }else if (gameTypeInfo.kind === enumeration.gameType.LHD){
        return {
            baseScore: gameTypeInfo.baseScore,
            roomType: enumeration.roomType.HUNDRED,
            startType: enumeration.gameRoomStartType.AUTO_START,
            bureau: 0,
            memberCount: gameTypeInfo["maxPlayerCount"] || 100
        }
    }else if (gameTypeInfo.kind === enumeration.gameType.BJL){
        return {
            baseScore: gameTypeInfo.baseScore,
            roomType: enumeration.roomType.HUNDRED,
            startType: enumeration.gameRoomStartType.AUTO_START,
            bureau: 0,
            memberCount: gameTypeInfo["maxPlayerCount"] || 100
        }
    }else if (gameTypeInfo.kind === enumeration.gameType.FISH){
        return {
            baseScore: gameTypeInfo.baseScore,
            roomType: enumeration.roomType.NORMAL,
            startType: enumeration.gameRoomStartType.AUTO_START,
            bureau: 0,
            memberCount: gameTypeInfo["maxPlayerCount"] || 100
        }
    }else if (gameTypeInfo.kind === enumeration.gameType.DDZ){
        return {
            baseScore: gameTypeInfo.baseScore,
            roomType: enumeration.roomType.NORMAL,
            startType: enumeration.gameRoomStartType.ALL_READY,
            bureau: 0,
            memberCount: gameTypeInfo["maxPlayerCount"] || 3
        }
    }else if (gameTypeInfo.kind === enumeration.gameType.BJ){
        return {
            baseScore: gameTypeInfo.baseScore,
            roomType: enumeration.roomType.NORMAL,
            startType: enumeration.gameRoomStartType.ALL_READY,
            bureau: 0,
            memberCount: gameTypeInfo["maxPlayerCount"] || 4
        }
    }else if (gameTypeInfo.kind === enumeration.gameType.DZ){
        return {
            baseScore: gameTypeInfo.baseScore,
            roomType: enumeration.roomType.NORMAL,
            startType: enumeration.gameRoomStartType.ALL_READY,
            bureau: 0,
            memberCount: gameTypeInfo["maxPlayerCount"] || 9
        }
    }else if (gameTypeInfo.kind === enumeration.gameType.PDK){
        return {
            baseScore: gameTypeInfo.baseScore,
            roomType: enumeration.roomType.NORMAL,
            startType: enumeration.gameRoomStartType.ALL_READY,
            bureau: 0,
            memberCount: gameTypeInfo["maxPlayerCount"] || 3
        }
    }
    else{
        logger.error("getDefaultRule", "can not find game type, gameTypeInfo:" + JSON.stringify(gameTypeInfo));
        return null;
    }
};

exp.getGameFramePath = function (gameTypeInfo) {
    var kind = gameTypeInfo.kind;
    if(kind === enumeration.gameType.SSS){
        return ('./thirteenWater/gameFrame');
    }else if (kind === enumeration.gameType.ZJH){
        return ('./zhajinhua/gameFrame');
    }else if (kind === enumeration.gameType.NN){
        return ('./niuniu/gameFrame');
    }else if(kind === enumeration.gameType.TTZ){
        return ('./tuitongzi/gameFrame');
    }else if(kind === enumeration.gameType.HHDZ){
        return ('./hongheidazhan/gameFrame');
    }else if(kind === enumeration.gameType.LHD){
        return ('./longHuDou/gameFrame');
    }else if(kind === enumeration.gameType.BJL){
        return ('./baijiale/gameFrame');
    }else if (kind === enumeration.gameType.FISH){
        return ('./fish/gameFrame');
    }else if (kind === enumeration.gameType.DDZ){
        return ('./ddz/gameFrame');
    }else if (kind === enumeration.gameType.BJ){
        return ('./blackjack/gameFrame');
    }else if (kind === enumeration.gameType.BRNN){
        return ('./bairenniuniu/gameFrame');
    }else if (kind === enumeration.gameType.DZ){
        return ('./dezhoupoker/gameFrame');
    }else if (kind === enumeration.gameType.PDK){
        return ('./paodekuai/gameFrame');
    }
    else{
        logger.error("getGameFramePath", "gameType not find, gameTypeInfo:" + JSON.stringify(gameTypeInfo));
        return '';
    }
};
