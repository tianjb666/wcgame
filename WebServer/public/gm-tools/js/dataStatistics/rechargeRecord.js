var PAGE_SIZE = 20;

function fixData(dataArr){
    for (var i = 0; i < dataArr.length; ++i){
        var date = new Date();
        date.setTime(dataArr[i].createTime);
        dataArr[i].createTimeEx = date.toLocaleString();

        dataArr[i].platformEx = "";
        var platform = parseInt(dataArr[i].platform);
        if (platform === Global.enumeration.RechargePlatform.WX){
            dataArr[i].platformEx = "微信";
        }else if (platform === Global.enumeration.RechargePlatform.ALI){
            dataArr[i].platformEx = "支付宝";
        }else if (platform === Global.enumeration.RechargePlatform.RM){
            dataArr[i].platformEx = "融脉";
        }
    }
    return dataArr;
}

function createList(){
    var uid = $('#txtSearch').val() || null;
    var startTime = dateBoxTimeToIntTime($('#applyDateStr').datebox("getValue")) || 0;
    var endTime = (dateBoxTimeToIntTime($('#applyDateEnd').datebox("getValue"))) || Date.now();
    endTime += (24 * 60 * 60 * 1000);

    var channel = $('#channel').val() || null;

    var dataList = $('#dataList');
    var dataPager = dataList.datagrid("getPager");

    var matchData = {
        createTime:{$gte: startTime, $lte: endTime}
    };
    if (!!uid) matchData.uid = uid;
    if (!!channel) matchData.channel = channel;

    // 请求数据
    apiAdminGetRecord("rechargeRecordModel", 0, PAGE_SIZE, matchData,
        function(data){
            var msg = data.msg;
            var recordDataArr = msg.recordArr;
            dataList.datagrid('loadData', recordDataArr);

            dataPager.pagination({
                total:msg.totalCount,
                onSelectPage:function (pageNo, pageSize) {
                    var start = (pageNo - 1) * pageSize;
                    apiAdminGetRecord(start, PAGE_SIZE, matchData, function (data){
                        $("#dataList").datagrid("loadData", data.msg.recordArr);
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
    var parameters = parseQueryString(window.location.href);
    if (!!parameters.uid) $('#txtSearch').val(parameters.uid.split("?")[0]);

    // 初始化数据列名
    var dataList = $('#dataList');
    dataList.datagrid({
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
            {field:'uid',title:'玩家ID'},
            {field:'nickname',title:'昵称'},
            {field:'rechargeMoney', title: '充值金额'},
            {field:'userOrderID', title: '订单ID'},
            {field:'platformReturnOrderID', title:'平台订单ID'},
            {field:'createTime',title:'充值时间',
                formatter: function (value) {
                    return new Date(value).toLocaleString();
                }
            }
        ]]
    });

    createList();

    $('#applyDateStr').datebox({request: true});
    $('#applyDateEnd').datebox({request: true});

    $('#btnQuery').click(function(){
        createList();
    });
});