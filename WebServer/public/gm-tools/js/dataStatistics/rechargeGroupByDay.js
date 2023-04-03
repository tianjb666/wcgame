
var PAGE_SIZE = 20;
var DAY_MS = 24 * 60 * 60 * 1000;

function fixData(dataArr){
    dataArr.sort(function(a, b){
        return b._id - a._id;
    });

    for (var i = 0; i < dataArr.length; ++i){
        var date = new Date();
        date.setTime(dataArr[i]._id * DAY_MS);
        dataArr[i].dayEx = date.toLocaleDateString();
    }
    return dataArr;
}

function createList(){
    var startTime = dateBoxTimeToIntTime($('#applyDateStr').datebox("getValue")) || 0;
    var endTime = (dateBoxTimeToIntTime($('#applyDateEnd').datebox("getValue"))) || Date.now();
    endTime += (24 * 60 * 60 * 1000);

    var dataList = $('#dataList');
    var dataPager = dataList.datagrid("getPager");
    let matchData = {
        createTime: {
            $gte: startTime, $lte: endTime
        }
    };

    // 请求数据
    apiGetRechargeStatisticsInfoGroupByDay(matchData,
        function(data){
            var msg = data.msg;
            var recordDataArr = msg.recordArr;
            dataList.datagrid('loadData', fixData(recordDataArr));
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
            {field:'dayEx',title:'日期',},

            {field:'totalCount', title: '充值总额'}
        ]]
    });

    createList();

    $('#applyDateStr').datebox({request: true});
    $('#applyDateEnd').datebox({request: true});

    $('#btnQuery').click(function(){
        createList();
    });
});