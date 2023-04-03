var utils = require('../util/utils');
var enumeration = require('../constant/enumeration');
var pomelo = require('pomelo');
var async = require('async');
var code = require('../constant/code');
var logger = require('pomelo-logger').getLogger('pomelo');

let phoneTitleArr = ["134","135","136", "137", "138", "139", "150", "151","157", "158", "159", "152","136","151","156","185","181","170", "186", "187", "188", "130", "131", "132", "155", "156", "189"];

var services = module.exports;

services.getRandomNickname = function(){
    return phoneTitleArr[utils.getRandomNum(0, phoneTitleArr.length-1)] + utils.getRandomNum(10000000, 99999999);
};