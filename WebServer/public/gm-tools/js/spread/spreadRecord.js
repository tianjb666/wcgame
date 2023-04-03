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
    if (!!uid) {
        matchData.spreaderID = uid;
    }
    else{
        matchData.spreaderID = {"$ne": ""};
    }

    // 请求数据
    Global.API.getSpreadRecord(0, userDataPageSize, matchData,
        function(data){
            var dataList = $('#dataList');
            dataList.datagrid('loadData', fixData(data.msg.recordDataArr));

            var dataPager = dataList.datagrid("getPager");
            dataPager.pagination({
                total: data.msg.totalCount,
                onSelectPage:function (pageNo, pageSize) {
                    var start = (pageNo - 1) * pageSize;
                    Global.API.getSpreadRecord(start, pageSize, matchData, function (data){
                        dataList.datagrid("loadData", fixData(data.msg.recordDataArr));
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
    var parameters = Global.utils.parseQueryString(window.location.href);
    if (!!parameters.uid) $('#txtSearch').val(parameters.uid.split("?")[0]);

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
            {field:'spreaderID',title:'推广员ID'},
            {field:'uid',title:'用户ID'},
            {field:'nickname',title:'昵称'}
        ]]
    });

    createList();

    $('#btnQuery').click(function(){
        createList();
    });
});