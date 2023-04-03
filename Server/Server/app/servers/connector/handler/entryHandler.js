let code = require('../../../constant/code');
let token = require('../../../util/token');
let async = require('async');
let userDao = require('../../../dao/userDao');
let logger = require('pomelo-logger').getLogger('pomelo');
let userInfoServices = require('../../../services/userInfoServices');
let enumeration = require('../../../constant/enumeration');
let roomServices = require('../../../services/roomServices');
let publicParameterServices = require('../../../services/parameterServices');
let dispatch = require('../../../util/dispatcher');
let rpcAPI = require('../../../API/rpcAPI');

module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
};

Handler.prototype.entry = function(msg, session, next) {
    if (!this.app.get('allServerStarted')) {
        next(null, {code: code.FAIL});
        return;
    }
    if(!msg.token){
        next(null, {code: code.REQUEST_DATA_ERROR});
        return;
    }
    let authInfo = token.parseToken(msg.token);
    if (!token.checkToken(authInfo)) {
        next(null, {code: code.HALL.TOKEN_INVALID});
        return;
    }
    let uid = authInfo.uid;
    let self = this;

    let userData = null;
    let userInfo = msg.userInfo;
    async.series([
        function(cb){
            if (!session.uid){
                self.app.get('sessionService').kick(uid, cb);
            } else{
                cb();
            }
        },
        function(cb){
            // 添加断开监听
            session.on('closed', onUserLeave.bind(null, self.app));
            // 绑定uid
            session.bind(uid, cb);
        },
        function(cb){
            userDao.loadUserDataByUid(uid, function (err, result) {
                if (!!err){
                    cb(err);
                }else{
                    // 创建角色
                    if (!result){
                        userInfoServices.createUserThenLoad(uid, userInfo, function (err, result) {
                            if(!!err){
                                cb(err);
                            }else{
                                userData = result;
                                cb();
                            }
                        })
                    }else{
                        userData = result;
                        cb();
                    }
                }
            });
        },
        function (cb) {
            // 检查登录权限
            if ((userData.permission & enumeration.userPermissionType.LOGIN_CLIENT) !== 0){
                cb();
            }else{
                cb(code.PERMISSION_NOT_ENOUGH);
            }
        },
        function (cb) {
            // 查询是否在某个房间中
            roomServices.searchRoomByUid(uid, function(err, roomID){
                if (!!err){
                    logger.error("searchRoomByUid err:" + err);
                    cb();
                }else{
                    if (!!roomID){
                        session.set ('roomID', roomID);
                        session.push('roomID', cb);
                    }else{
                        cb();
                    }
                }
            })

        },
        function (cb) {
            // 更新登录信息
            let updateUserData = {
                lastLoginIP: self.app.get('sessionService').getClientAddressBySessionId(session.id).ip.split(':').pop(),
                lastLoginTime: Date.now(),
                frontendId: self.app.getServerId(),

                roomID: session.get('roomID') || "",
                dataLock: 0,
                userOnlineStatus: enumeration.userOnlineStatus.ON_LINE
            };
            updateUserData.isLockGold = updateUserData.roomID.length > 0?"true":"false";
            let newEmailArr = userInfoServices.getNewUserEmail(userData.emailArr, userData.lastLoginTime);
            if (!!newEmailArr) updateUserData.emailArr = newEmailArr;
            userDao.updateUserData(uid, updateUserData, function (err, result) {
                if (!!err){
                    cb(err);
                }else{
                    userData = result;
                    cb();
                }
            })
        }
    ], function(err){
        if (!!err){
            logger.error('connector entry error:' + err);
            next(null, {code: err});
        }else{
            next(null, {code: code.OK, msg: {
                userInfo: userData,
                publicParameter: publicParameterServices.buildClientParameter(self.app.get('publicParameter')),
                gameTypes: self.app.get('gameTypes'),
                agentProfit: self.app.get('agentProfit')
            }});
        }
    });
};

let onUserLeave = function (app, session) {
    if (!session || !session.uid) return;
    let uid = session.uid;
    userDao.getUserDataByUidFromCache(session.uid, function (err, result) {
        if (!!err || !result){
            logger.warn('not find leave user uid:' + session.uid);
        }else{
            if (!!result.roomID){
                let gameServer = dispatch.dispatch(result.roomID, app.getServersByType('game'));
                rpcAPI.leaveRoom(app, gameServer.id, result.roomID, session.uid, function (err) {
                    if (!!err) logger.error('onUserLeave.leaveRoom err:' + err);

                    userDao.syncCacheUserData(uid);
                });
            }
            // 从匹配列表中移除
            rpcAPI.exitMatchList(app, session.uid, function (err) {
                if (!!err) logger.error('onUserLeave.exitMatchList err:' + err);
            });
            userDao.updateUserData(session.uid, {frontendId: "", userOnlineStatus: enumeration.userOnlineStatus.OFF_LINE});
        }
    });
};
