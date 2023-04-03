/**
 * Created by 52835 on 2017/7/21.
 */

function updateRechargeStatisticsInfo(){
    var startTime = dateBoxTimeToIntTime($('#applyDateStr').datebox("getValue")) || 0;
    var endTime = (dateBoxTimeToIntTime($('#applyDateEnd').datebox("getValue"))) || Date.now();
    endTime += (24 * 60 * 60 * 1000);

    apiGetRecordStatisticsInfo(startTime, endTime, function(data){
        $("#registerCount").text(data.msg.allUserCount);
        $("#rechargeCount").text(data.msg.rechargeCount.toFixed(2));
        $("#totalRechargeSum").text(data.msg.totalRechargeNumber);
        $("#gameProfitSum").text(data.msg.gameProfitSum.toFixed(2));
        $("#inventoryExtractSum").text(data.msg.inventoryExtractSum.toFixed(2));
        $("#inventoryModifySum").text(data.msg.inventoryModifySum.toFixed(2));
        $("#commissionExtractSum").text(data.msg.commissionExtractSum.toFixed(2));
        $("#withdrawCashSum").text(data.msg.withdrawCashSum.toFixed(2));
        $("#userGoldSum").text(data.msg.userGoldSum.toFixed(2));
    })
}

$(document).ready(function() {
    updateRechargeStatisticsInfo();

    $('#btnQuery').click(function(){
        updateRechargeStatisticsInfo();
    });
});