
function createList(kindID){
    let requestData = {
        route: "getGameControllerData",
        kind: kindID
    };
    // 请求数据
    apiRetransmissionToGameServer(requestData,
        function(data){
            let controlData = data.msg.recordArr[0];
            $('#dataList').datagrid('loadData', controlData.robotWinRateArr);

            $("#startInventoryValue").val(controlData.curInventoryValue.toFixed(2));
            $("#minInventoryValue").val(controlData.minInventoryValue.toFixed(2));
            $("#extractionRatio").val(controlData.extractionRatio);

            $('#enable').val(!!controlData.robotEnable?1:0);
            $('#maxRobotCount').val(controlData.maxRobotCount);
        });
}

function deleteData(info){
    var dataList = $('#dataList');
    var rows = dataList.datagrid('getRows');
    for (var i = 0; i < rows.length; ++i){
        if (rows[i].index === info.index){
            rows.splice(i, 1);
            break;
        }
    }
    dataList.datagrid('loadData', rows);
}

function addData(info, cb){
    var dataList = $('#dataList');
    var rows = dataList.datagrid('getRows');
    rows.push(info);
    rows.sort(function (a, b) {
        return a.inventoryValue - b.inventoryValue;
    });
    dataList.datagrid('loadData', rows);
    cb();
}

function updateData(info, cb){
    var dataList = $('#dataList');
    var rows = dataList.datagrid('getRows');
    for (var i = 0; i < rows.length; ++i){
        if (rows[i].index === info.index){
            rows[i] = info;
            break;
        }
    }
    rows.sort(function (a, b) {
        return a.inventoryValue - b.inventoryValue;
    });
    dataList.datagrid('loadData', rows);
    cb();
}

function updateClick(index){
    var rows = $('#dataList').datagrid('getRows');
    var info = rows[index];
    window.open('./gameControllerAdd.html?info=' + encodeURI(JSON.stringify(info)), "_blank", "height=400,width=800,scrollbars=no,location=no");
}

function execModify(kind, count, cb) {
    let data = {
        kind: kind,
        count:count,
        route: "modifyInventoryValue"
    };
    apiRetransmissionToGameServer(data, function (data) {
        if (data.code === 0){
            cb();
            createList(kind);
        }
    })
}

$(document).ready(function() {
    var parameters = parseQueryString(window.location.href);
    var kindID = parseInt(parameters.gameType);

    // 初始化数据列名
    var dataList = $('#dataList');
    dataList.datagrid({
        nowrap: true,
        autoRowHeight: false,
        striped: true,
        pagination: true,
        showFooter: true,
        pageSize: 20,
        pageList: [20],
        rownumbers: true,
        onBeforeSelect:function(){
            return false;
        },
        singleSelect: true,
        columns:[[
            {field: 'ck', checkbox: true},
            {field: 'inventoryValue',title:'库存值',
                formatter: function(value,row,index){
                    return '<a href="#" onclick="updateClick('+ index +')" class="l">'+ value +'</a>';
                }
            },
            {field: 'winRate', title: '胜率增加值',
                formatter: function(value){
                return Math.floor(value * 100).toString()
            }
            },
        ]]
    });

    createList(kindID);

    $('#btnModify').click(function(){
        var enable = parseInt($('#enable').val()) === 1;
        var match = parseInt($('#match').val()) === 1;
        var maxRobotCount = parseInt($('#maxRobotCount').val() || "0");
        if (maxRobotCount < 0){
            alert("机器人数量不能小于0");
            return;
        }

        var saveData = {
            kind: kindID,
            curInventoryValue: parseInt($("#startInventoryValue").val() || 0),
            minInventoryValue: parseInt($("#minInventoryValue").val() || 0),
            extractionRatio: parseFloat($("#extractionRatio").val() || 0),
            robotWinRateArr: $('#dataList').datagrid('getRows'),
            robotEnable: enable?1:0,
            robotMatchEnable: 1,
            maxRobotCount: maxRobotCount
        };
        let requestData = {
            route: "updateGameControllerData",
            kind: kindID,
            data: JSON.stringify(saveData)
        };
        apiRetransmissionToGameServer(requestData, function () {
            alert("修改成功");
            createList(kindID);
        });
    });

    $('#btnAdd').click(function(){
        window.open('./gameControllerAdd.html', "_blank", "height=400,width=800,scrollbars=no,location=no");
    });

    $('#btnAddValue').click(function(){
        window.open('./inventoryValueModify.html?kindID=' + kindID, "_blank", "height=200,width=800,scrollbars=no,location=no");
    });

    $('#btnDelete').click(function(){
        var rows = $('#dataList').datagrid('getChecked');
        if (rows.length > 0){
            deleteData(rows[0]);
        }else{
            alert("请选择操作对象");
        }
    });
});