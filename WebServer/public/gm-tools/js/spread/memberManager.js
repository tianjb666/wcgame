var userDataPageSize = 20;


function fixUserData(userDataArr){
    var newUserDataArr = userDataArr.slice();
    for (var i = 0; i < newUserDataArr.length; ++i){
        var userData = newUserDataArr[i];
        userData.forbidLogin = ((userData.permission & enumeration.userPermissionType.LOGIN_CLIENT) === 0)?"禁止":"正常";
        userData.lastLoginTimeEx = new Date(userData.lastLoginTime || 0).toLocaleString();
        userData.createTimeEx = new Date(userData.createTime || 0).toLocaleString();
    }
    return newUserDataArr;
}

function createUserList(){
    var dataPager = $('#dataList').datagrid("getPager");
    var uid = $('#txtSearch').val() || null;
    if (!uid){
        alert("请输入需要查询的代理ID");
        return;
    }
    var type = parseInt($('#type').val() || '0');
    var matchData = {
        spreaderID: uid
    };
    if (type === 1){
        matchData.directlyMemberCount = {$gte: 1}
    }
    // 请求数据
    apiAdminGetRecord('userModel', 0, userDataPageSize, matchData,
        function(data){
            var msg = data.msg;
            var userDataArr = msg.recordArr;
            $('#dataList').datagrid('loadData', fixUserData(userDataArr));

            dataPager.pagination({
                total:msg.totalCount,
                onSelectPage:function (pageNo, pageSize) {
                    var start = (pageNo - 1) * pageSize;
                    //var end = start + pageSize;
                    apiAdminGetRecord(start, pageSize, matchData, function (data){
                        $("#dataList").datagrid("loadData", fixUserData(data.msg.recordArr));
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
        pageSize: userDataPageSize,
        pageList: [userDataPageSize],
        rownumbers: true,
        onBeforeSelect:function(){
            return false;
        },
        singleSelect: false,
        columns:[[
            {field: 'ck', checkbox: true},
            {field:'uid',title:'用户ID'},
            {field:'nickname',title:'昵称'},
            {field:'gold',title:'金币数量'},
            {field:'rechargeNum', title: '充值总额'},
            {field:'spreaderID', title: '上级代理ID'},
            {field:'achievement', title: '输赢总额'},
            {field:'directlyMemberAchievement', title: '直属会员业绩'},
            {field:'agentMemberAchievement', title: '代理会员业绩'},
            {field:'thisWeekCommision', title: '本周佣金'},
            {field:'thisWeekLowerAgentCommision', title: '本周下级代理佣金'},
            {field:'realCommision', title: '可提现佣金'},
            {field:'totalCommision', title: '总佣金'},
            {field:'lowerAgentCommision', title: '下级代理总佣金'},
            {field:'directlyMemberCount', title: '直属会员数量'},
            {field:'weekAddedDirectlyMemberCount', title: '周增直属会员数量'},
            {field:'monthAddedDirectlyMemberCount', title: '月增直属会员数量'},
            {field:'agentMemberCount', title: '代理会员数量'},
            {field:'weekAddedAgentMemberCount', title: '周增代理会员数量'},
            {field:'monthAddedAgentMemberCount', title: '月增代理会员数量'},
            {field:'forbidLogin', title: '禁止登录'},
            {field:'lastLoginIP', title: '最后登录IP'},
            {field:'lastLoginTimeEx', title: '最后登录时间'},
            {field:'createTimeEx', title: '创建时间'}
        ]]
    });

    $('#btnQuery').click(function(){
        createUserList();
    });
});