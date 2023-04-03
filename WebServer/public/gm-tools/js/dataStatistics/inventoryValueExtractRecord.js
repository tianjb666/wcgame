var PAGE_SIZE = 20;

function createList(){
    var startTime = dateBoxTimeToIntTime($('#applyDateStr').datebox("getValue")) || 0;
    var endTime = dateBoxTimeToIntTime($('#applyDateEnd').datebox("getValue")) || Date.now();
    endTime += (24 * 60 * 60 * 1000);

    var dataList = $('#dataList');
    var dataPager = dataList.datagrid("getPager");

    var matchData = {
        createTime:{$gte: startTime, $lte: endTime}
    };

    // 请求数据
    apiAdminGetRecord('inventoryValueExtractRecordModel', 0, PAGE_SIZE, matchData,
        function(data){
            var msg = data.msg;
            var recordDataArr = msg.recordArr;
            dataList.datagrid('loadData', recordDataArr);

            dataPager.pagination({
                total:msg.totalCount,
                onSelectPage:function (pageNo, pageSize) {
                    var start = (pageNo - 1) * pageSize;
                    apiAdminGetRecord("inventoryValueExtractRecordModel", start, PAGE_SIZE, matchData, function (data){
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
            {field:'createTime',title:'时间',
                formatter: function(value){
                    if (!!value || value === 0){
                        return new Date(value || 0).toLocaleString();
                    }
                }
            },
            {field:'kind',title:'游戏类型',
                formatter: function(value){
                    if (!!value || value === 0){
                        if (value === enumeration.gameType.HHDZ){
                            return "红黑大战";
                        }else if (value === enumeration.gameType.BJL){
                            return "百家乐";
                        }else if (value === enumeration.gameType.LHD){
                            return "龙虎斗";
                        }else if (value === enumeration.gameType.TTZ){
                            return "推筒子";
                        }else if (value === enumeration.gameType.ZJH){
                            return "扎金花";
                        }else if (value === enumeration.gameType.NN){
                            return "牛牛";
                        }else if (value === enumeration.gameType.FISH){
                            return "捕鱼";
                        }else if (value === enumeration.gameType.SSS){
                            return "十三张";
                        }else if (value === enumeration.gameType.DDZ){
                            return "斗地主";
                        }else if (value === enumeration.gameType.BJ){
                            return "21点";
                        }else if (value === enumeration.gameType.PDK){
                            return "跑得快";
                        }else if (value === enumeration.gameType.DZ){
                            return "德州扑克";
                        }else if (value === enumeration.gameType.BRNN){
                            return "百人牛牛";
                        }
                    }
                }
            },
            {field:'count',title:'提取库存值',
                formatter: function(value){
                    if (!!value || value === 0){
                        return value.toFixed(2);
                    }
                }
            },
            {field:'leftCount',title:'剩余库存值',
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