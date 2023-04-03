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
    if (!!uid) matchData.uid = uid;
    matchData.createTime = {$gte: startTime, $lte: endTime};
    // 请求数据
    Global.API.getSpreaderApplyRecord(0, PAGE_SIZE, matchData,
        function(data){
            $('#dataList').datagrid('loadData', fixData(data.msg.recordDataArr));

            dataPager.pagination({
                total:data.msg.totalCount,
                onSelectPage:function (pageNo, pageSize) {
                    var start = (pageNo - 1) * pageSize;
                    Global.API.getSpreaderApplyRecord(start, pageSize, matchData, function (data){
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
        singleSelect: true,
        columns:[[
            {field: 'ck', checkbox: true},
            {field:'uid',title:'用户ID'},
            {field:'nickname',title:'昵称'},
            {field:'name', title: '名字'},
            {field:'idCard', title: '身份证号'},
            {field:'phone', title:'电话'},
            {field:'createTimeEx',title:'时间'}
        ]]
    });

    createList();

    $('#applyDateStr').datebox({request: true});
    $('#applyDateEnd').datebox({request: true});

    $('#btnQuery').click(function(){
        createList();
    });

    $('#btnAgree').click(function(){
        var rows = $('#dataList').datagrid('getChecked');
        if (rows.length > 0){
            Global.API.spreaderApplyOperation("agree", rows[0], function(data){
                if (data.code === 0){
                    alert("操作成功");
                    createList();
                }
            })
        }else{
            alert("请选择操作对象");
        }
    });

    $('#btnDisagree').click(function(){
        var rows = $('#dataList').datagrid('getChecked');
        if (rows.length > 0){
            Global.API.spreaderApplyOperation("disagree", rows[0], function(data){
                if (data.code === 0){
                    alert("操作成功");
                    createList();
                }
            })
        }else{
            alert("请选择操作对象");
        }
    });
});