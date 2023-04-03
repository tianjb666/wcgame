$(document).ready(function() {
    apiAdminLogout();
    //deal with login button click.
    $("#btnLogin").click(function() {

        var account = $("#txtLoginName").attr("value");
        var password = $("#txtLoginPass").attr("value");
        if(account.length === 0 || password.length === 0){
            alert('帐号密码不能为空');
            return;
        }

        apiAdminLogin(account, password, function (data) {
            $(location).attr('href', '/gm-tools/html/other/main.html?nickname=' + data.msg.userData.nickname + '&permission=' + data.msg.userData.permission);
        })
    });
});