/**
 * Created by 52835 on 2017/7/19.
 */

var PAGE_SIZE = 20;
var DAY_MS = 24 * 60 * 60 * 1000;

function createList(){
    var startTime = dateBoxTimeToIntTime($('#applyDateStr').datebox("getValue")) || 0;
    var endTime = (dateBoxTimeToIntTime($('#applyDateEnd').datebox("getValue"))) || Date.now();
    endTime += (24 * 60 * 60 * 1000);


    var dataList = $('#dataList');
    var dataPager = dataList.datagrid("getPager");

    var matchData = {
        day:{$gte: Math.floor((startTime + 8 * 60 * 60 * 100)/DAY_MS), $lte: (endTime + 8 * 60 * 60 * 100)/DAY_MS}
    };

    // 请求数据
    apiAdminGetRecord('gameProfitRecordSchemaModel', 0, PAGE_SIZE, matchData,
        function(data){
            var msg = data.msg;
            var recordDataArr = msg.recordArr;
            dataList.datagrid('loadData', recordDataArr);

            dataPager.pagination({
                total:msg.totalCount,
                onSelectPage:function (pageNo, pageSize) {
                    var start = (pageNo - 1) * pageSize;
                    apiAdminGetRecord("gameProfitRecordSchemaModel", start, PAGE_SIZE, matchData, function (data){
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
            {field:'day',title:'日期',
                formatter: function(value){
                    if (!!value || value === 0){
                        let date = new Date();
                        date.setTime(value * DAY_MS - 8 * 60 * 60 * 1000);
                        return date.toLocaleDateString();
                    }
                }
            },
            {field:'count', title: '金币数',
                formatter: function(value){
                    if (!!value || value === 0){
                        return value.toFixed(2);
                    }
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