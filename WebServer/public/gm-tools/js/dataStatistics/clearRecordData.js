/**
 * Created by 52835 on 2017/7/19.
 */


$(document).ready(function() {
    $('#btnClearRechargeRecord').click(function(){
        var startTime = Global.utils.dateBoxTimeToIntTime($('#applyDateStr').datebox("getValue")) || 0;
        var endTime = (Global.utils.dateBoxTimeToIntTime($('#applyDateEnd').datebox("getValue"))) || Date.now();
        endTime += (24 * 60 * 60 * 1000);
        if ((Date.now() - endTime)/(24 * 60 * 60 * 1000) < 30){
            alert('不能清除30天以内的数据');
            return;
        }
        Global.API.clearRecordData('rechargeRecord', startTime, endTime, function(data){
            if (data.code === 0){
                alert('删除成功');
            }
        })
    });

    $('#btnClearGameRecord').click(function(){
        var startTime = Global.utils.dateBoxTimeToIntTime($('#applyDateStr1').datebox("getValue")) || 0;
        var endTime = (Global.utils.dateBoxTimeToIntTime($('#applyDateEnd1').datebox("getValue"))) || Date.now();
        endTime += (24 * 60 * 60 * 1000);
        if ((Date.now() - endTime)/(24 * 60 * 60 * 1000) < 30){
            alert('不能清除30天以内的数据');
            return;
        }
        Global.API.clearRecordData('gameRecord', startTime, endTime, function(data){
            if (data.code === 0){
                alert('删除成功');
            }
        })
    });

    $('#btnClearAgentRechargeRecord').click(function(){
        var startTime = Global.utils.dateBoxTimeToIntTime($('#applyDateStr2').datebox("getValue")) || 0;
        var endTime = (Global.utils.dateBoxTimeToIntTime($('#applyDateEnd2').datebox("getValue"))) || Date.now();
        endTime += (24 * 60 * 60 * 1000);
        if ((Date.now() - endTime)/(24 * 60 * 60 * 1000) < 30){
            alert('不能清除30天以内的数据');
            return;
        }
        Global.API.clearRecordData('agentRechargeRecord', startTime, endTime, function(data){
            if (data.code === 0){
                alert('删除成功');
            }
        })
    });
});