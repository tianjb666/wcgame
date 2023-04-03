/**
 * Created by games139.com  on 2014/5/29.
 */


var utils = module.exports;

// control variable of func "myPrint"
var isPrintFlag = false;


/**
 * Check and invoke callback function
 */
utils.invokeCallback = function (cb) {
    if (!!cb && typeof cb === 'function') {
        cb.apply(null, Array.prototype.slice.call(arguments, 1));
    }
};

/**
 * clone an object
 */
utils.clone = function (origin) {
    if (!origin) {
        return;
    }

    var obj = {};
    for (var f in origin) {
        if (origin.hasOwnProperty(f)) {
            obj[f] = origin[f];
        }
    }
    return obj;
};

utils.size = function (obj) {
    if (!obj) {
        return 0;
    }

    var size = 0;
    for (var f in obj) {
        if (obj.hasOwnProperty(f)) {
            size++;
        }
    }

    return size;
};

// print the file name and the line number ~ begin
function getStack() {
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_, stack) {
        return stack;
    };
    var err = new Error();
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
}

function getFileName(stack) {
    return stack[1].getFileName();
}

function getLineNumber(stack) {
    return stack[1].getLineNumber();
}

utils.myPrint = function () {
    if (isPrintFlag) {
        var len = arguments.length;
        if (len <= 0) {
            return;
        }
        var stack = getStack();
        var aimStr = '\'' + getFileName(stack) + '\' @' + getLineNumber(stack) + ' :\n';
        for (var i = 0; i < len; ++i) {
            aimStr += arguments[i] + ' ';
        }
        console.log('\n' + aimStr);
    }
};
// print the file name and the line number ~ end

utils.getProperties = function (model, fields) {
    var result = {};
    fields.forEach(function (field) {
        if (model.hasOwnProperty(field)) {
            result[field] = model[field];
        }
    });
    return result;
};

utils.setProperties = function (model, properties) {
    for (var prop in properties) {
        model[prop] = properties[prop];
    }
};

utils.multiplyProperties = function (properties, multiplier) {
    var result = {};
    for (var k in properties) {
        result[k] = Math.floor(properties[k] * multiplier);
    }
    return result;
};

utils.addProperties = function (toProps, fromProps) {
    for (var k in fromProps) {
        if (toProps[k]) {
            toProps[k] += fromProps[k];
        } else {
            toProps[k] = fromProps[k];
        }
    }

};

utils.isEmptyObject = function (obj) {
    for (var name in obj) {
        return false;
    }
    return true;
};

utils.getLength = function (obj) {
    var total = 0;
    for (var k in obj) {
        total++;
    }
    return total;
}

utils.getDist = function (fromPos, toPos) {
    var dx = toPos.x - fromPos.x;
    var dy = toPos.y - fromPos.y;
    return Math.sqrt(dx * dx + dy * dy);
};

utils.isPositiveInteger = function (num) {
    var r = /^[1-9][0-9]*$/;
    return r.test(num);
};

utils.ipToInt = function (ip) {
    var parts = ip.split(".");

    if (parts.length != 4) {
        return 0;
    }
    return (parseInt(parts[0], 10) << 24
        | parseInt(parts[1], 10) << 16
        | parseInt(parts[2], 10) << 8
        | parseInt(parts[3], 10)) >>> 0;
};

utils.getRandomNum = function (Min, Max) {
    var Range = Max - Min;
    var Rand = Math.random();
    return (Min + Math.round(Rand * Range));
};


utils.userId2Number = function (userId) {
    var hash = 5381,
        i = userId.length;

    while (i)
        hash = (hash * 33) ^ userId.charCodeAt(--i);

    /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
     * integers. Since we want the results to be always positive, convert the
     * signed int to an unsigned by doing an unsigned bitshift. */
    return Number(hash >>> 0);
};

utils.createJoinRoomID = function (serverID, roomID){
    var id = parseInt(serverID.split('-')[1]);
    if (!!id){
        return id * 1000 + roomID;
    }

    return 0;
};

utils.parseJoinRoomID = function (joinRoomID){
    joinRoomID = parseInt(joinRoomID);
    if (!!joinRoomID){
        return {
            gameServerID: 'game-' + Math.floor(joinRoomID/1000),
            roomID: joinRoomID % 1000
        };
    }
    return null;
};

var DAY_MS = 24 * 60 * 60 * 1000;
utils.getIntervalDay = function (time1, time2){
    return Math.abs((Math.floor(time1/DAY_MS) - Math.floor(time2/DAY_MS)));
};

utils.getTimeDay = function (time) {
    if(time !== 0){
        time = time || Date.now();
    }
    return Math.floor((time + 8 * 60 * 60 * 1000)/DAY_MS);
};

utils.parseQueryString = function(url){
    var obj = {};
    var start = url.indexOf("?")+1;
    var str = url.substr(start);
    var arr = str.split("&");
    for(var i = 0 ;i < arr.length;i++){
        var arr2 = arr[i].split("=");
        obj[arr2[0]] = arr2[1];
    }
    return obj;
};

utils.parseIntArr = function(str, c){
    c = c || '&';

    var arr = str.split(c);
    for (var i = 0; i < arr.length; ++i){
        arr[i] = parseInt(arr[i]);
    }
    return arr;
};

utils.getTimeTodayStart = function(){
    var now = Date.now();
    return now - (now%DAY_MS);
};

utils.getTimeWeekStart = function(){
    var now = new Date();
    var todayStart = now.getTime() - (now%DAY_MS);
    var week = now.getDay();
    var n = 0;
    if (week === 0){
        n = 6;
    }else{
        n = week - 1;
    }
    return todayStart - (DAY_MS * n);
};

//生成随机字符串
utils.randomString = function (len) {
    len = len || 16;
    var chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
    var maxPos = chars.length;
    var pwd = '';
    for (var i = 0; i < len; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
};

utils.getUniqueIndex = function () {
    var date = new Date();
    return "" + date.getFullYear() + date.getMonth() + date.getDay() + date.getHours() + date.getMinutes() + date.getSeconds() + date.getMilliseconds() + utils.getRandomNum(1000, 9999);
};

utils.getTimeIndex = function () {
    var date = new Date();
    return "" + date.getFullYear() + date.getMonth() + date.getDay() + date.getHours() + date.getMinutes() + date.getSeconds() + date.getMilliseconds() + utils.getRandomNum(1000, 9999);
};

//时间戳转换成日期
Date.prototype.format = function(format) {
    var date = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),
        "S+": this.getMilliseconds()
    };
    if (/(y+)/i.test(format)) {
        format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (var k in date) {
        if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length === 1
                ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
        }
    }
    return format;
};

String.prototype.format = function(args) {
    var result = this;
    if (arguments.length > 0) {
        if (arguments.length === 1 && typeof (args) === "object") {
            for (var key in args) {
                if(args[key]!==undefined){
                    var reg = new RegExp("({" + key + "})", "g");
                    result = result.replace(reg, args[key]);
                }
            }
        }
        else {
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[i] !== undefined) {
                    var reg = new RegExp("({[" + i + "]})", "g");
                    result = result.replace(reg, arguments[i]);
                }
            }
        }
    }
    return result;
};
