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
    var startTime = dateBoxTimeToIntTime($('#applyDateStr').datebox("getValue")) || 0;
    var endTime = (dateBoxTimeToIntTime($('#applyDateEnd').datebox("getValue"))) || Date.now();
    endTime += (24 * 60 * 60 * 1000);

    var matchData = {};
    if (!!uid) matchData.uid = uid;
    matchData.createTime = {$gte: startTime, $lte: endTime};
    // 请求数据
    apiAdminGetRecord("extractionCommissionRecordModel", 0, PAGE_SIZE, matchData,
        function(data){
            dataList.datagrid('loadData', fixData(data.msg.recordArr));

            dataPager.pagination({
                total:data.msg.totalCount,
                onSelectPage:function (pageNo, pageSize) {
                    var start = (pageNo - 1) * pageSize;
                    apiAdminGetRecord("extractionCommissionRecordModel", start, pageSize, matchData, function (data){
                        $("#dataList").datagrid("loadData", fixData(data.msg.recordArr));
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
            {field: 'index', title: '订单号'},
            {field: 'uid', title: '用户ID'},
            {field: 'count', title: '提取金额',
                formatter: function(value){
                    if(!!value || value === 0) {
                        return value.toFixed(2)
                    }
                }
            },
            {field: 'curGold', title: '当前金币数量',
                formatter: function(value){
                    if(!!value || value === 0) {
                        return value.toFixed(2)
                    }
                }
            },
            {field: 'createTimeEx', title: '时间'},
        ]]
    });

    createList();

    $('#applyDateStr').datebox({request: true});
    $('#applyDateEnd').datebox({request: true});

    $('#btnQuery').click(function(){
        createList();
    });

    $('#btnAlreadyHandle').click(function(){
        var rows = $('#dataList').datagrid('getChecked');
        if (rows.length > 0){
            if (rows[0].status === 1){
                alert('操作失败，该申请已处理');
            }else{
                apiAdminUpdateRecord("extractionCommissionRecordModel", {_id:rows[0]._id}, {status: 1}, function(data){
                    if (data.code === 0){
                        alert('修改成功');
                        createList();
                    }
                })
            }
        }else{
            alert("请选择操作对象");
        }
    });

    $('#btnNotHandle').click(function(){
        var rows = $('#dataList').datagrid('getChecked');
        if (rows.length > 0){
            if (rows[0].status === 0){
                alert('操作失败，该申请未处理');
            }else{
                apiAdminUpdateRecord("extractionCommissionRecordModel", {_id: rows[0]._id}, {status:0}, function(data){
                    if (data.code === 0){
                        alert('修改成功');
                        createList();
                    }
                })
            }
        }else{
            alert("请选择操作对象");
        }
    });
});