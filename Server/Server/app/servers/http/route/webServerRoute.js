let pomelo = require('pomelo');
let enumeration = require('../../../constant/enumeration');
let code = require('../../../constant/code');
let async = require('async');
let userDao = require('../../../dao/userDao');
let logger = require('pomelo-logger').getLogger('pomelo');
let rpcAPI = require('../../../API/rpcAPI');
let pushAPI = require('../../../API/pushAPI');
let userInfoServices = require('../../../services/userInfoServices');

module.exports = function (app, http) {
    http.post('/updateUserDataNotify', function(req, res){
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header('Access-Control-Allow-Headers', 'Content-Type');

        let uid = req.body.uid || null;
        let updateKeys = req.body.updateKeys || null;
        
        userDao.getUserDataByUidFromCache(uid, function (err, result) {
            if (!!err){
                res.send({code: err});
            }else{
                if (!result || result.userOnlineStatus !== enumeration.userOnlineStatus.ON_LINE.toString()){
                    res.send({code: code.OK});
                }else{
                    let updateUserData = {};
                    for(let i = 0; i < updateKeys.length; ++i){
                        let key = updateKeys[i];
                        updateUserData[key] = result[key];
                    }
                    userInfoServices.updateUserDataNotify(uid, result.frontendId, updateUserData);
                    res.send({code:code.OK});
                }
            }
        })
    });

    http.post('/reloadParameterNotify', function (req, res) {
        let servers = pomelo.app.getServers();
        for (let key in servers){
            if (servers.hasOwnProperty(key)){
                let server = servers[key];
                let route = server.serverType + '.notifyRemote.reloadParameterNotify';
                rpcAPI.rpc(route, server.id, function (err) {
                    if (!!err){
                        logger.error("reloadParameterNotify err:" + err);
                    }
                });
            }
        }
        res.send({code: code.OK});
    });

    http.post('/sendSystemBroadcast', function (req, res) {
        pushAPI.broadcastPush({content: req.body.content}, function (err) {
            if (!!err){
                res.send({code: code.FAIL});
            }else{
                res.send({code: code.OK});
            }
        })
    });
    
    http.post('/getGameControllerData', function (req, res) {
        let permission = parseInt(req.body.permission);

        if ((permission & enumeration.userPermissionType.GAME_CONTROL) === 0){
            res.send({code: code.PERMISSION_NOT_ENOUGH});
            return;
        }

        if (!req.body.kind){
            res.send({code: code.REQUEST_DATA_ERROR});
            return;
        }

        rpcAPI.rpc('robot.controllerRemote.getGameControllerData', 'robot', parseInt(req.body.kind), function (err, data) {
            if (!!err){
                res.send({code: err});
            }else{
                res.send({code: code.OK, msg: {recordArr: [data]}})
            }
        })
    });

    http.post('/updateGameControllerData', function(req, res) {
        let permission = req.body.permission;

        if ((permission & enumeration.userPermissionType.GAME_CONTROL) === 0){
            res.send({code: code.PERMISSION_NOT_ENOUGH});
            return;
        }

        if (!req.body.kind){
            res.send({code: code.REQUEST_DATA_ERROR});
            return;
        }

        let data = JSON.parse(req.body.data);

        rpcAPI.rpc('robot.controllerRemote.updateGameControllerData', 'robot', parseInt(req.body.kind), data, function (err) {
            res.send({code: !!err?err:code.OK});
        })
    });
    
    http.post('/modifyInventoryValue', function (req, res) {
        let permission = req.body.permission;

        if ((permission & enumeration.userPermissionType.GAME_CONTROL) === 0){
            res.send({code: code.PERMISSION_NOT_ENOUGH});
            return;
        }

        if (!req.body.kind || !req.body.uid || !req.body.count){
            res.send({code: code.REQUEST_DATA_ERROR});
            return;
        }

        rpcAPI.rpc('robot.controllerRemote.modifyInventoryValue', 'robot', req.body.uid, parseInt(req.body.kind), parseFloat(req.body.count), function (err) {
            res.send({code: !!err?err:code.OK});
        })
    })
};