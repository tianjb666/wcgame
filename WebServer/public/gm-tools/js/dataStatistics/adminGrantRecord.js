var PAGE_SIZE = 20;

function createList(){
    var startTime = dateBoxTimeToIntTime($('#applyDateStr').datebox("getValue")) || 0;
    var endTime = (dateBoxTimeToIntTime($('#applyDateEnd').datebox("getValue"))) || Date.now();
    endTime += (24 * 60 * 60 * 1000);


    var dataList = $('#dataList');
    var dataPager = dataList.datagrid("getPager");

    var matchData = {
        createTime: {$gte: startTime, $lte: endTime}
    };

    // 请求数据
    apiAdminGetRecord('adminGrantRecordModel', 0, PAGE_SIZE, matchData,
        function(data){
            var msg = data.msg;
            dataList.datagrid('loadData', msg.recordArr);

            dataPager.pagination({
                total:msg.totalCount,
                onSelectPage:function (pageNo, pageSize) {
                    var start = (pageNo - 1) * pageSize;
                    apiAdminGetRecord('adminGrantRecordModel', start, PAGE_SIZE, matchData, function (data){
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
            {field:'uid',title:'管理员ID'},
            {field:'gainUid', title: '赠送目标用户ID'},
            {field:'count', title: '赠送数量'},
            {field:'createTime', title: '赠送时间',
                formatter: function(value){
                    if (!!value || value === 0){
                        return new Date(value).toLocaleString();
                    }
                }
            },
        ]]
    });

    createList();

    $('#applyDateStr').datebox({request: true});
    $('#applyDateEnd').datebox({request: true});

    $('#btnQuery').click(function(){
        createList();
    });
});