/**
 * Created by 52835 on 2017/7/19.
 */

function setInfo(parameterData){
    console.log(parameterData);
    $('#key').val(parameterData.key);
    $('#value').val(parameterData.value);
    $('#describe').val(parameterData.describe);
}

$(document).ready(function() {
    var info = null;
    var parameters = parseQueryString(window.location.href);
    if (!!parameters.info){
        info = JSON.parse(decodeURI(parameters.info));
        setInfo(info);
    }

    $('#btnSave').click(function(){
        var key = $("#key").val();
        if (!key || key.length === 0){
            alert('请输入键值');
            return;
        }
        var value = $("#value").val();
        if (!value || value.length === 0) {
            alert('请输入值');
            return;
        }
        var describe = $("#describe").val()|| "";

        var parameterData = {
            key: key,
            value: value,
            describe: describe
        };
        if (!!info){
            window.opener.window.updateParameter({key: key}, parameterData, function () {
                alert("更新成功");
                window.close();
            });
        }else{
            window.opener.window.addParameter(parameterData, function () {
                alert("添加成功");
                window.close();
            });
        }
    });
});