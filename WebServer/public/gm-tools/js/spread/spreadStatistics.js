/**
 * Created by 52835 on 2017/7/21.
 */

function updateRechargeStatisticsInfo(){
    var startTime = Global.utils.dateBoxTimeToIntTime($('#applyDateStr').datebox("getValue")) || 0;
    var endTime = (Global.utils.dateBoxTimeToIntTime($('#applyDateEnd').datebox("getValue"))) || Date.now();
    endTime += (24 * 60 * 60 * 1000);

    Global.API.getSpreadStatisticsInfo(startTime, endTime, function(data){
        $("#spreaderCount").text(data.msg.spreaderCount);
        $("#spreadRebateSum").text(data.msg.spreadRebateSum);
        $("#withdrawCashSum").text(data.msg.withdrawCashSum);
    })
}

$(document).ready(function() {
    updateRechargeStatisticsInfo();

    $('#btnQuery').click(function(){
        updateRechargeStatisticsInfo();
    });
});