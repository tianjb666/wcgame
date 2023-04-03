function setInfo(gameTypeInfo){
    console.log(gameTypeInfo);
    $("#gameKind").val(gameTypeInfo.kind);
    $("#gameLevel").val(gameTypeInfo.level);
    $('#txtGoldLowerLimit').val(gameTypeInfo.goldLowerLimit);
    $('#goldUpper').val(gameTypeInfo.goldUpper);
    $('#minPlayerCount').val(gameTypeInfo.minPlayerCount);
    $('#maxPlayerCount').val(gameTypeInfo.maxPlayerCount);
    $('#baseScore').val(gameTypeInfo.baseScore);
}

$(document).ready(function() {

    var info = null;
    var parameters = parseQueryString(window.location.href);
    if (!!parameters.info){
        info = JSON.parse(decodeURI(parameters.info));
        setInfo(info);
    }

    $('#btnSave').click(function(){
        var gameKindID = parseInt($("#gameKind").val());
        if (gameKindID <= 0){
            alert('请选择游戏类型');
            return;
        }
        var gameLevel = parseInt($("#gameLevel").val());
        if(gameLevel <= 0){
            alert('请选择场景等级');
            return;
        }

        var goldLowerLimit = parseInt($('#txtGoldLowerLimit').val()) || 0;
        if(goldLowerLimit < 0){
            alert('最小金币数量不得低于0');
            return;
        }
        var goldUpper = parseInt($('#goldUpper').val()) || 0;
        if(goldUpper < 0){
            alert('最大金币数量不得低于0');
            return;
        }
        var minPlayerCount = parseInt($('#minPlayerCount').val()) || 1;
        var maxPlayerCount = parseInt($('#maxPlayerCount').val()) || 1;

        var expenses = parseInt($('#expenses').val()) || 0;
        if (!expenses && expenses !==0){
            alert('请输入正确的台费');
            return;
        }

        var baseScore = parseFloat($('#baseScore').val()) || 1;
        if (!baseScore || baseScore <= 0){
            alert('请输入有效的底分');
            return;
        }

        var gameTypeInfo = {
            kind: gameKindID,
            level: gameLevel,
            expenses: expenses,
            goldLowerLimit: goldLowerLimit,
            goldUpper: goldUpper,
            minPlayerCount: minPlayerCount,
            maxPlayerCount: maxPlayerCount,
            baseScore: baseScore
        };
        if (!!info){
            window.opener.window.updateGameType(info.gameTypeID, gameTypeInfo, function () {
                alert("修改成功");
                window.close();
            });
        }else{
            gameTypeInfo.gameTypeID = Date.now().toString();
            window.opener.window.addGameType(gameTypeInfo, function () {
                alert("添加成功");
                window.close();
            });
        }
    });
});