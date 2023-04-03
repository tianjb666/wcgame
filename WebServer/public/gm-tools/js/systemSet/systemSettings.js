/**
 * Created by 52835 on 2017/7/19.
 */

var systemSetDataPageSize = 10;

function fixSystemStringsInfo(dataArr){
    var enableSettingsArr = {
        webServerUrl: true,
        gameServerUrl: true,
        profitPercentage: true,
        rechargeRatio: true,
        freeShopItem: true,
        startGold: true,
        minKeepGold: true,
        minWithdrawCash: true,
        oneRMBToGold: true,
        rechargeService: true,
        test: true,
		downloadUrl: true,
        minRechargeCount: true
    };

    var res = [];
    for (var i = 0; i < dataArr.length; ++i){
        if (!!enableSettingsArr[dataArr[i].key]) {
            res.push(dataArr[i]);
        }
    }
    return res;
}

function createList(){
    apiAdminGetRecord('publicParameterModel', 0, 100, {}, function (data) {
        $('#dataList').datagrid('loadData', fixSystemStringsInfo(data.msg.recordArr));
    });
}

function deleteParameter(data){
    apiAdminDeleteRecord('publicParameterModel', data, function(){
        alert("删除成功");
        createList();
    });
}

function addParameter(data, cb){
    apiAdminAddRecord('publicParameterModel', data, function(){
        cb();
        createList();
    });
}

function updateParameter(matchData, saveData, cb){
    apiAdminUpdateRecord('publicParameterModel', matchData, saveData, function(){
        cb();
        createList();
    });
}

function updateClick(index){
    var rows = $('#dataList').datagrid('getRows');
    var info = rows[index];
    window.open('./systemSettingsAdd.html?info=' + encodeURI(JSON.stringify(info)), "_blank", "height=300,width=800,scrollbars=no,location=no");
}

$(document).ready(function() {
    // 初始化数据列名
    var dataList = $('#dataList');
    dataList.datagrid({
        nowrap: true,
        autoRowHeight: false,
        striped: true,
        pagination: false,
        showFooter: true,
        pageSize: systemSetDataPageSize,
        pageList: [systemSetDataPageSize],
        rownumbers: true,
        onBeforeSelect:function(){
            return false;
        },
        singleSelect: true,
        columns:[[
            {field: 'ck', checkbox: true},
            {field:'key',title:'参数键值',
                formatter: function(value,row,index){
                    if(!value === false) {
                        return '<a href="#" onclick="updateClick('+ index +')" class="l">'+ value +'</a>';
                    }
                }
            },
            {field:'value',title:'参数值'},
            {field:'describe', title: '描述',
                width: 300
            }
        ]]
    });

    createList();

    $('#btnAdd').click(function(){
        window.open('./systemSettingsAdd.html', "_blank", "height=300,width=800,scrollbars=no,location=no");
    });

    $('#btnDelete').click(function(){
        var rows = $('#dataList').datagrid('getChecked');
        if (rows.length > 0){
            deleteParameter(rows[0], true);
        }else{
            alert("请选择操作对象");
        }
    });
});