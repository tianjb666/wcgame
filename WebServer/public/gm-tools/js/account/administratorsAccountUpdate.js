/**
 * Created by 52835 on 2017/7/19.
 */

$(document).ready(function() {

    var parameters = parseQueryString(decodeURI(decodeURI(window.location.href)));
    $('#nickname').text(parameters.nickname);

    var permission = parseInt(parameters.permission);
    $('#userManager').attr('checked', (permission & enumeration.userPermissionType.USER_MANAGER) !== 0);
    $('#systemManager').attr('checked', (permission & enumeration.userPermissionType.USER_SYSTEM_MANAGER) !== 0);
    $('#dataManager').attr('checked', (permission & enumeration.userPermissionType.DATA_MANAGER) !== 0);
    $('#spreadManager').attr('checked', (permission & enumeration.userPermissionType.SPREAD_MANAGER) !== 0);
    $('#gameControl').attr('checked', (permission & enumeration.userPermissionType.GAME_CONTROL) !== 0);

    $('#btnSave1').click(function(){
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

        window.opener.window.updatePermission(parameters.uid, permission, function(){
            alert("修改成功");
            window.close();
        });
    });

    $('#btnSave2').click(function(){
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

        window.opener.window.resetAccountAndPassword(parameters.uid, account, password, function(){
            alert("修改成功");
            window.close();
        });
    })
});