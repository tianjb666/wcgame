/**
 * Created by 52835 on 2017/7/13.
 */
var pomelo = window.pomelo;

let gameConfig = require("../../../../config/config.js")

var config;
// query connector
function queryEntry(account, password, imgCodeInfo) {
    pomelo.init({
        host: config["serverHost"],
        port: config["accountPort"]
    }, function() {
        var route = 'account.accountHandler.login';
        var msg = {
            loginPlatform: 1,
            account: account,
            password: password,
            imgCodeInfo: imgCodeInfo
        };
        Global.NetworkManager.request(route, msg, function (data) {
            pomelo.disconnect();
            $(location).attr('href', '/gm-tools/html/other/main.html?host='+ data.loginResponse.serverInfo.host +'&port=' + data.loginResponse.serverInfo.port + '&token=' + data.loginResponse.token);
        });
    });
}


$(document).ready(function() {
    //deal with login button click.
    $("#btnLogin").click(function() {
        var account = $("#txtLoginName").attr("value");
        var password = $("#txtLoginPass").attr("value");
        if(account.length === 0 || password.length === 0){
            alert('帐号密码不能为空');
            return;
        }
        var imgCode = $('#txtLoginCode').val();
        if (imgCode.length === 0){
            alert('请输入验证码');
            return;
        }
        //query entry of connection
        var imgCodeInfo = {
            uniqueID: uniqueID,
            code: imgCode
        };
        queryEntry(account, password, imgCodeInfo);
    });

    var uniqueID = Date.now() + "" + Math.floor(Math.random() * 1000);

    $('#imgCode').attr("src", gameConfig.gameServerUrl + "/GetImgCode?uniqueID=" + uniqueID);
});