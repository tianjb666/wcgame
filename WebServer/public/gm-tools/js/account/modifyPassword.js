/**
 * Created by 52835 on 2017/7/21.
 */
$(document).ready(function() {
    $('#btnModify').click(function(){
        var password1 = $('#password1').val();
        var password2 = $('#password2').val();
        if (password1 !== password2){
            alert('两次输入密码不一致');
            return;
        }

        if (password1.length < 6 || password2.length < 6){
            alert('密码长度不小于6');
            return;
        }

        if(!checkIsAllCharOrNumber(password1) || !checkIsAllCharOrNumber(password2)){
            alert('密码必须是数字和字母');
            return;
        }

        apiUpdateAdminPassword(password1, function(data){
            if (data.code === 0){
                alert('修改成功');
            }
        })
    });
});