/**
 * Created by 52835 on 2017/7/17.
 */
var userDataPageSize = 20;

function fixData(userDataArr){
    var newUserDataArr = userDataArr.slice();
    for (var i = 0; i < newUserDataArr.length; ++i){
        var userData = newUserDataArr[i];
        userData.forbidLogin = ((userData.permission & Global.enumeration.userPermissionType.LOGIN_CLIENT) === 0)?"禁止":"正常";
        userData.lastLoginTimeEx = new Date(userData.lastLoginTime).toLocaleString();
        userData.createTimeEx = new Date(userData.createTime).toLocaleString();
    }
    return newUserDataArr;
}

function createList(){
    var matchData = {};
    var uid = $('#txtSearch').val() || null;
    if (!!uid){
        matchData.uid = uid;
    }

    // 请求数据
    Global.API.getSpreaderData(0, userDataPageSize, matchData,
        function(data){
            var dataList = $('#dataList');
            dataList.datagrid('loadData', fixData(data.msg.spreadDataArr));

            var dataPager = dataList.datagrid("getPager");
            dataPager.pagination({
                total: data.msg.totalCount,
                onSelectPage:function (pageNo, pageSize) {
                    var start = (pageNo - 1) * pageSize;
                    Global.API.getSpreaderData(start, pageSize, matchData, function (data){
                        dataList.datagrid("loadData", fixData(data.msg.spreadDataArr));
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
        pageSize: userDataPageSize,
        pageList: [userDataPageSize],
        rownumbers: true,
        onBeforeSelect:function(){
            return false;
        },
        singleSelect: true,
        columns:[[
            {field: 'ck', checkbox: true},
            {field:'uid',title:'用户ID'},
            {field:'nickname',title:'昵称'},
            {field:'name',title:'名字'},
            {field:'idCard',title:'身份证'},
            {field:'phone',title:'绑定手机'},
            {field:'spreadCount',title:'推广人数'},
            {field:'totalObtainMoney',title:'总返利'},
            {field:'curMoney',title:'未提现返利'},
            {field:'createTimeEx',title:'创建时间'}
        ]]
    });

    createList();

    $('#btnQuery').click(function(){
        createList();
    });

    $('#btnRemove').click(function(){
        var rows = $('#dataList').datagrid('getChecked');
        if (rows.length > 0){
            Global.API.removeSpreaderData(rows[0].uid, function(data){
                if (data.code === 0){
                    alert('修改成功');
                    createList();
                }
            })
        }else{
            alert("请选择操作对象");
        }
    });

    $('#btnSpreadRecord').click(function(){
        var rows = $('#dataList').datagrid('getChecked');
        if (rows.length > 0){
            window.parent.document.getElementById('frm_left').contentWindow.GetUrl(null, "../spread/spreadRecord.html?uid=" + rows[0].uid);
        }else{
            alert("请选择操作对象");
        }
    });

    $('#btnSpreadRebateRecord').click(function(){
        var rows = $('#dataList').datagrid('getChecked');
        if (rows.length > 0){
            window.parent.document.getElementById('frm_left').contentWindow.GetUrl(null, "../spread/spreadRebateRecord.html?uid=" + rows[0].uid);
        }else{
            alert("请选择操作对象");
        }
    });

    $('#btnRechargeRecord').click(function (){
        var rows = $('#dataList').datagrid('getChecked');
        if (rows.length > 0){
            window.parent.document.getElementById('frm_left').contentWindow.GetUrl(null, "../dataStatistics/rechargeRecord.html?uid=" + rows[0].uid);
        }else{
            alert("请选择操作对象");
        }
    });

    $('#btnSendEmail').click(function (){
        var rows = $('#dataList').datagrid('getChecked');
        if (rows.length > 0){
            window.parent.document.getElementById('frm_left').contentWindow.GetUrl(null, "../systemSet/emailSettings.html?uid=" + rows[0].uid);
        }else{
            alert("请选择操作对象");
        }
    });
});