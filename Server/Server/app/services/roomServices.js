/**
 * Created by 1718841401 on 2017/7/12.
 */
var enumeration = require('../constant/enumeration');
var code = require('../constant/code');
var userInfoServices = require('./userInfoServices');
var async = require('async');
var utils = require('../util/utils');
var rpcAPI = require('../API/rpcAPI');
var dispatcher = require('../util/dispatcher');
var pomelo = require('pomelo');

var service = module.exports;

service.searchRoomByUid = function(uid,cb){
    var index = 0;
    var gameServers = pomelo.app.getServersByType('game');
    var tasks = [];
    for (var i = 0; i < gameServers.length; ++i){
        tasks.push(function(cb){
            rpcAPI.searchRoomByUid(gameServers[index++].id, uid, cb);
        })
    }
    async.parallel(tasks, function(err, result){
        if (!!err){
            console.error("searchRoomByUid err:" + err);
            cb(err);
        }else{
            var roomID = 0;
            for (var i = 0; i < result.length; ++i){
                if (!!result[i]){
                    roomID = result[i];
                    break;
                }
            }
            cb(null, roomID);
        }
    });
};
