function setInfo(info){
    console.log(info);
    $("#level").val(info.level);
    $("#min").val(info.min);
    $('#max').val(info.max);
    $('#proportion').val(info.proportionEx);
}

$(document).ready(function() {

    var info = null;
    var parameters = Global.utils.parseQueryString(window.location.href);
    if (!!parameters.info){
        info = JSON.parse(decodeURI(parameters.info));
        setInfo(info);
    }

    $('#btnSave').click(function(){
        var level = $("#level").val()
        if (level.length === 0){
            alert('请输入代理级别');
            return;
        }
        var min = parseInt($("#min").val());
        if(min < 0){
            alert('请输入有效的业绩最小值');
            return;
        }

        var max = parseInt($("#max").val());
        if(max < min && max !== -1){
            alert('请输入有效的业绩最大值');
            return;
        }

        var proportion = parseInt($('#proportion').val()) || 0;
        if(proportion < 0){
            alert('请输入有效的佣金比例');
            return;
        }

        var data = {
            level: level,
            min: min,
            max: max,
            proportion: proportion * 0.0001
        };
        if (!!info){
            data.index = info.index;
            window.opener.window.updateData(data, function () {
                alert("修改成功");
                window.close();
            });
        }else{
            window.opener.window.addData(data, function () {
                alert("添加成功");
                window.close();
            });
        }
    });
});