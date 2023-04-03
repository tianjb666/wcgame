function ajaxEx(url, requestData, cbSuccess, cbError) {
    $.ajax({
        url: url,
        type: "POST",
        data: requestData,
        success: function (data) {
            console.log("收到数据:");
            console.log(data);
            if (data.code === code.INVALID_UERS){
                alert("未登录用户，请先执行登录");
                window.parent.window.location.href = '/gm-tools/index.html';
                return;
            }
            if (data.code !== 0){
                alert("错误：" + code[data.code]);
                invokeCallback(cbError, data);
            }else{
                invokeCallback(cbSuccess, data);
            }
        },
        error: function () {
            alert("请求错误");
            invokeCallback(cbError, {code: 1});
        }
    });
    console.log("发送数据:" + url);
    console.log(requestData);
}

// -------------------------------------管理员帐号相关-----------------------------------
function apiAdminLogin(account, password, cbSuccess, cbFail) {
    let data = {
        account: account,
        password: password
    };
    ajaxEx("/admin/login", data, cbSuccess, cbFail);
}

function apiAdminLogout(cbSuccess, cbFail) {
    let data = {
    };
    ajaxEx("/admin/logout", data, cbSuccess, cbFail);
}

function apiUpdateAdminPassword(password, cbSuccess, cbFail) {
    let data = {
        password: password
    };
    ajaxEx("/admin/updateAdminPassword", data, cbSuccess, cbFail);
}
// -------------------------------------记录相关-----------------------------------
function apiRetransmissionToGameServer(data, cbSuccess, cbFail){
    ajaxEx("/admin/retransmissionToGameServer", data, cbSuccess, cbFail);
}

function apiAdminGetRecord(model, startIndex, count, matchData, cbSuccess, cbFail) {
    let data = {
        model: model,
        startIndex: startIndex,
        count: count,
        matchData: JSON.stringify(matchData)
    };
    ajaxEx("/admin/getRecord", data, cbSuccess, cbFail);
}

function apiAdminUpdateRecord(model, matchData, saveData, cbSuccess, cbFail) {
    let data = {
        model: model,
        saveData: JSON.stringify(saveData),
        matchData: JSON.stringify(matchData)
    };
    ajaxEx("/admin/updateRecord", data, cbSuccess, cbFail);
}

function apiAdminAddRecord(model, saveData, cbSuccess, cbFail) {
    let data = {
        model: model,
        saveData: JSON.stringify(saveData)
    };
    ajaxEx("/admin/addRecord", data, cbSuccess, cbFail);
}

function apiAdminDeleteRecord(model, matchData, cbSuccess, cbFail) {
    let data = {
        model: model,
        matchData: JSON.stringify(matchData)
    };
    ajaxEx("/admin/deleteRecord", data, cbSuccess, cbFail);
}

// -------------------------------------用户管理相关-----------------------------------
function apiAdminGrant(field, uid, count, cbSuccess, cbFail) {
    let data = {
        field: field,
        uid: uid,
        count: count
    };
    ajaxEx("/admin/grant", data, cbSuccess, cbFail);
}

function apiGetOnlineUserData(startIndex, count, uid, cbSuccess, cbFail) {
    let data = {
        startIndex: startIndex,
        count: count,
        uid: uid
    };
    ajaxEx("/admin/getOnlineUserData", data, cbSuccess, cbFail);
}

function apiUpdateUserData(uid, saveData, cbSuccess, cbFail) {
    let data = {
        uid: uid,
        saveData: JSON.stringify(saveData)
    };
    ajaxEx("/admin/updateUserData", data, cbSuccess, cbFail);
}

// -------------------------------------系统管理相关-----------------------------------
function apiSendSingleEmail(uid, title, content, cbSuccess, cbFail) {
    let data = {
        uid: uid,
        title: title,
        content: content
    };
    ajaxEx("/admin/sendSingleEmail", data, cbSuccess, cbFail);
}

function apiSendAllServerEmail(title, content, cbSuccess, cbFail) {
    let data = {
        title: title,
        content: content
    };
    ajaxEx("/admin/sendAllServerEmail", data, cbSuccess, cbFail);
}
// -------------------------------------游戏控制相关-----------------------------------
function apiModifyInventoryValue(kind, count, cbSuccess, cbFail) {
    let data = {
        kind: kind,
        count: count
    };
    ajaxEx("/admin/modifyInventoryValue", data, cbSuccess, cbFail);
}

// -------------------------------------数据相关--------------------------------------
function apiGetRechargeStatisticsInfoGroupByDay(matchData, cbSuccess, cbFail) {
    let data = {
        matchData: JSON.stringify(matchData)
    };
    ajaxEx("/admin/getRechargeStatisticsInfoGroupByDay", data, cbSuccess, cbFail);
}

function apiGetRecordStatisticsInfo(startTime, endTime, cbSuccess, cbFail) {
    let data = {
        startTime: startTime,
        endTime: endTime
    };
    ajaxEx("/admin/getRecordStatisticsInfo", data, cbSuccess, cbFail);
}