/**
 * Created by 52835 on 2017/7/19.
 */

var PAGE_SIZE = 20;

function fixData(dataArr){
    for (var i = 0; i < dataArr.length; ++i){
        dataArr[i].createTimeEx = new Date(dataArr[i].createTime).toLocaleString();
    }
    return dataArr;
}

function createList(){
    var dataList = $('#dataList');
    var dataPager = dataList.datagrid("getPager");
    var uid = $('#txtSearch').val() || null;
    var startTime = Global.utils.dateBoxTimeToIntTime($('#applyDateStr').datebox("getValue")) || 0;
    var endTime = (Global.utils.dateBoxTimeToIntTime($('#applyDateEnd').datebox("getValue"))) || Date.now();
    endTime += (24 * 60 * 60 * 1000);

    var matchData = {};
    if (!!uid) matchData.spreaderUid = uid;
    matchData.createTime = {$gte: startTime, $lte: endTime};
    // 请求数据
    Global.API.getSpreadRebateRecord(0, PAGE_SIZE, matchData,
        function(data){
            $('#dataList').datagrid('loadData', fixData(data.msg.recordDataArr));

            dataPager.pagination({
                total:data.msg.totalCount,
                onSelectPage:function (pageNo, pageSize) {
                    var start = (pageNo - 1) * pageSize;
                    Global.API.getSpreadRebateRecord(start, pageSize, matchData, function (data){
                        $("#dataList").datagrid("loadData", fixData(data.msg.recordDataArr));
                        dataPager.pagination('refresh', {
                            total:data.msg.totalCount,
                            pageNumber:pageNo
                        });
                    });
                }
            });
        });
}

$(document).ready(function() {
    var parameters = Global.utils.parseQueryString(window.location.href);
    if (!!parameters.uid) $('#txtSearch').val(parameters.uid.split("?")[0]);

    // 初始化数据列名
    var dataList = $('#dataList');
    dataList.datagrid({
        height: 780,
        nowrap: true,
        autoRowHeight: false,
        striped: true,
        pagination: true,
        showFooter: true,
        pageSize: PAGE_SIZE,
        pageList: [PAGE_SIZE],
        rownumbers: true,
        onBeforeSelect:function(){
            return false;
        },
        columns:[[
            {field:'spreaderUid',title:'推广员ID'},
            {field:'rechargeUid',title:'充值玩家ID'},
            {field:'rechargeNickname', title: '充值玩家昵称'},
            {field:'totalCount', title: '充值金额'},
            {field:'rebateCount', title:'返利金额'},
            {field:'createTimeEx',title:'时间'}
        ]]
    });

    createList();

    $('#applyDateStr').datebox({request: true});
    $('#applyDateEnd').datebox({request: true});

    $('#btnQuery').click(function(){
        createList();
    });
});