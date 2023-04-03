/**
 * Created by 52835 on 2017/7/19.
 */

$(document).ready(function() {
    $('#btnSave').click(function(){
        var nickname = $("#nickname").val();
        if (!nickname || nickname.length === 0){
            alert('请输入昵称');
            return;
        }
        var account = $("#account").val();
        if (!account || account.length === 0){
            alert('请输入帐号');
            return;
        }

        var password = $("#password").val();
        if (!password || password.length === 0){
            alert('请输入密码');
            return;
        }

        var permission = 0;
        if($('#userManager').is(':checked')) {
            permission |= enumeration.userPermissionType.USER_MANAGER;
        }
        if($('#systemManager').is(':checked')) {
            permission |= enumeration.userPermissionType.USER_SYSTEM_MANAGER;
        }
        if($('#spreadManager').is(':checked')) {
            permission |= enumeration.userPermissionType.SPREAD_MANAGER;
        }
        if($('#dataManager').is(':checked')) {
            permission |= enumeration.userPermissionType.DATA_MANAGER;
        }
        if($('#gameControl').is(':checked')) {
            permission |= enumeration.userPermissionType.GAME_CONTROL;
        }

        window.opener.window.addAccount(account, password, nickname, permission, function(){
            alert("添加成功");
            window.close();
        });
    });
});