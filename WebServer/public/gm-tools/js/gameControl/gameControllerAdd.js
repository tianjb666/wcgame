function setInfo(info){
    console.log(info);
    $("#inventoryValue").val(info.inventoryValue);
    $("#winRate").val(Math.floor(info.winRate * 100));
}

$(document).ready(function() {

    var info = null;
    var parameters = parseQueryString(window.location.href);
    if (!!parameters.info){
        info = JSON.parse(decodeURI(parameters.info));
        setInfo(info);
    }

    $('#btnSave').click(function(){
        var inventoryValue = parseInt($("#inventoryValue").val() || 0);

        var winRate = parseInt($("#winRate").val() || 0);
        if(winRate < 0){
            alert('请输入有效的玩家胜率降低值');
            return;
        }

        var newInfo = {
            inventoryValue: inventoryValue,
            winRate: winRate/100,
        };
        if (!!info){
            newInfo.index = info.index;
            window.opener.window.updateData(newInfo, function () {
                window.close();
            });
        }else{
            newInfo.index = Date.now();
            window.opener.window.addData(newInfo, function () {
                window.close();
            });
        }
    });
});