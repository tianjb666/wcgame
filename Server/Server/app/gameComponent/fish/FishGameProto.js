let exp = module.exports;

// -----------------------玩家操作----------------------
exp.GAME_FIRE_NOTIFY                        = 301;          // 开火的通知
exp.GAME_FIRE_PUSH                          = 401;          // 开火的推送

exp.GAME_CHANGE_CANNON_NOTIFY               = 302;          // 换炮的通知
exp.GAME_CHANGE_CANNON_PUSH                 = 402;          // 换炮的推送

exp.GAME_CAPTURE_NOTIFY                     = 303;          // 捕捉到鱼的通知
exp.GAME_CAPTURE_PUSH                       = 403;          // 捕捉到鱼的推送

exp.GAME_LOCK_FISH_NOTIFY                   = 304;          // 锁定鱼的通知
exp.GAME_LOCK_FISH_PUSH                     = 404;          // 锁定鱼的推送

exp.GAME_ROBOT_FIRE_NOTIFY                  = 305;          // 机器人开火通知
exp.GAME_ROBOT_FIRE_PUSH                    = 405;          // 机器人开炮推送

exp.GAME_ROBOT_CAPTURE_NOTIFY               = 306;          // 机器人捕捉到鱼推送
exp.GAME_ROBOT_CAPTURE_PUSH                 = 406;          // 机器人捕捉到鱼推送

exp.GAME_TIDE_START_PUSH                    = 406;          // 鱼潮来袭推送

// ----------------------游戏状态-----------------------
exp.GAME_ADD_FISH_PUSH                      = 305;


exp.gameFireNotify = function (rote) {
    return {
        type: this.GAME_FIRE_NOTIFY,
        data: {
            rote: rote
        }
    };
};

exp.gameFirePush = function (chairID, rote) {
    return {
        type: this.GAME_FIRE_PUSH,
        data: {
            rote: rote,
            chairID: chairID
        }
    };
};

exp.gameChangeCannonNotify = function (powerIndex, typeIndex) {
    return {
        type: this.GAME_CHANGE_CANNON_NOTIFY,
        data: {
            powerIndex: powerIndex,
            typeIndex: typeIndex
        }
    };
};

exp.gameChangeCannonPush = function (chairID, powerIndex, typeIndex) {
    return {
        type: this.GAME_CHANGE_CANNON_PUSH,
        data: {
            chairID: chairID,
            powerIndex: powerIndex,
            typeIndex: typeIndex
        }
    };
};

exp.gameCaptureNotify = function (fishID) {
    return {
        type: this.GAME_CAPTURE_NOTIFY,
        data: {
            fishID: fishID
        }
    };
};

exp.gameCapturePush = function (chairID, fishIDArr, gainGoldArr, curWinGold) {
    return {
        type: this.GAME_CAPTURE_PUSH,
        data: {
            fishIDArr: fishIDArr,
            chairID: chairID,
            gainGoldArr: gainGoldArr,
            curWinGold: curWinGold
        }
    };
};

exp.gameAddFishPush = function (fishArr) {
    return {
        type: this.GAME_ADD_FISH_PUSH,
        data: {
            fishArr: fishArr
        }
    };
};

exp.gameLockFishNotify = function (fishID) {
    return {
        type: this.GAME_LOCK_FISH_NOTIFY,
        data: {
            fishID: fishID
        }
    };
};

exp.gameLockFishPush = function (chairID, fishID) {
    return {
        type: this.GAME_LOCK_FISH_PUSH,
        data: {
            chairID: chairID,
            fishID: fishID
        }
    };
};

exp.gameRobotFireNotify = function (chairIDArr, roteArr) {
    return {
        type: this.GAME_ROBOT_FIRE_NOTIFY,
        data: {
            chairIDArr: chairIDArr,
            roteArr: roteArr
        }
    };
};

exp.gameRobotCaptureNotify = function (chairID, fishID) {
    return {
        type: this.GAME_ROBOT_CAPTURE_NOTIFY,
        data: {
            chairID: chairID,
            fishID: fishID
        }
    };
};

exp.gameTideStartPush = function (curFishID) {
    return {
        type: this.GAME_TIDE_START_PUSH,
        data: {
            curFishID: curFishID
        }
    };
};