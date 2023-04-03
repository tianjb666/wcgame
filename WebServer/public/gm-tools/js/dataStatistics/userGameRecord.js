
var PAGE_SIZE = 20;


function createList(){
    var uid = $('#txtSearch').val() || null;
    var startTime = dateBoxTimeToIntTime($('#applyDateStr').datebox("getValue")) || 0;
    var endTime = (dateBoxTimeToIntTime($('#applyDateEnd').datebox("getValue"))) || Date.now();
    endTime += (24 * 60 * 60 * 1000);


    var dataList = $('#dataList');
    var dataPager = dataList.datagrid("getPager");

    var kind = parseInt($('#kind').val() || 0);

    var matchData = {
        createTime:{$gte: startTime, $lte: endTime}
    };
    if (!!uid) matchData.uid = uid;
    if (!!kind) matchData.kind = kind;

    // 请求数据
    apiAdminGetRecord('userGameRecordModel', 0, PAGE_SIZE, matchData,
        function(data){
            var msg = data.msg;
            var recordDataArr = msg.recordArr;
            dataList.datagrid('loadData', recordDataArr);

            dataPager.pagination({
                total:msg.totalCount,
                onSelectPage:function (pageNo, pageSize) {
                    var start = (pageNo - 1) * pageSize;
                    apiAdminGetRecord('userGameRecordModel', start, PAGE_SIZE, matchData, function (data){
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
    if (!!parameters.uid) $('#txtSearch').val(parameters.uid);

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
            {field:'kind',title:'游戏类型',
                formatter: function (value) {
                    let name = "";
                    if (value === enumeration.gameType.NN){
                        name = "牛牛";
                    }else if (value === enumeration.gameType.ZJH){
                        name = "扎金花";
                    }else if (value === enumeration.gameType.SSS){
                        name = "十三张"
                    }else if (value === enumeration.gameType.TTZ){
                        name = "推筒子"
                    }else if (value === enumeration.gameType.BJL){
                        name = "百家乐"
                    }else if (value === enumeration.gameType.LHD){
                        name = "龙虎大战"
                    }else if (value === enumeration.gameType.HHDZ){
                        name = "红黑大战"
                    }else if (value === enumeration.gameType.FISH){
                        name = "捕鱼";
                    }else if (value === enumeration.gameType.DDZ){
                        name = "斗地主";
                    }else if (value === enumeration.gameType.BJ){
                        name = "21点";
                    }else if (value === enumeration.gameType.PDK){
                        name = "跑得快";
                    }else if (value === enumeration.gameType.DZ){
                        name = "德州扑克";
                    }else if (value === enumeration.gameType.BRNN){
                        name = "百人牛牛";
                    }
                    return name;
                }
            },
            {field:'changeGold',title:'金币变化',
                formatter: function(value){
                    if(!!value || value === 0) {
                        return value.toFixed(2)
                    }
                }
            },
            {field:'createTime',title:'游戏时间',
                formatter: function (value) {
                    return new Date(value).toLocaleString();
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