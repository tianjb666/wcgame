var userDataPageSize = 20;

function createList(){
    let matchData = {};
    let uid = $("#targetUid").val();
    if (!!uid){
        matchData.uid = parseInt(uid);
    }
    apiAdminGetRecord("userModel", 0, userDataPageSize, matchData, function (data) {
        if (data.code === 0){
            var dataList = $('#dataList');
            var dataPager = dataList.datagrid("getPager");

            let msg = data.msg;
            dataList.datagrid('loadData', msg.recordArr);
            dataPager.pagination({
                total: msg.totalCount,
                onSelectPage:function (pageNo, pageSize) {
                    var start = (pageNo - 1) * pageSize;
                    //var end = start + pageSize;
                    apiAdminGetRecord("userModel", start, userDataPageSize, matchData, function (data) {
                        dataList.datagrid("loadData", data.msg.recordArr);
                        dataPager.pagination('refresh', {
                            total:data.msg.totalCount,
                            pageNumber:pageNo
                        });
                    })
                }
            });
        }
    });
}

function forbidLogin(userData, forbid){
    if (!!forbid && ((enumeration.userPermissionType.LOGIN_CLIENT & userData.permission) === 0)){
        alert("当前用户已经被冻结，无法冻结！");
        return;
    }
    if (!forbid && ((enumeration.userPermissionType.LOGIN_CLIENT & userData.permission) !== 0)){
        alert("当前用户未被冻结，无法解冻！");
        return;
    }
    let newPermission = 0;
    if (!!forbid){
        newPermission &= ~enumeration.userPermissionType.LOGIN_CLIENT;
    }else{
        newPermission |= enumeration.userPermissionType.LOGIN_CLIENT;
    }
    apiUpdateUserData(userData.uid, {permission: newPermission}, function () {
        createList();
        alert("操作成功！");
    });
}

function openGrantHtml(field, uid){
    window.open('./grant.html?type='+field+'&'+'uid=' + uid, "_blank", "height=300,width=800,scrollbars=no,location=no");
}

function execGrant(field, uid, count, cb){
    count = parseInt(count) || 0;
    if (count === 0){
        alert('输入数据错误，请检查数据');
        return;
    }

    apiAdminGrant(field, uid, count, function () {
        cb();
        createList();
    })
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
        singleSelect: true,
        columns:[[
            {field: 'ck', checkbox: true},
            {field:'uid',title:'用户ID'},
            {field:'nickname',title:'昵称'},
            {field:'gold',title:'金币数量',
                formatter: function(value){
                    if(!!value || value === 0) {
                        return value.toFixed(2)
                    }
                }
            },
            {field:'rechargeNum', title: '充值总额',
                formatter: function(value){
                    if(!!value || value === 0) {
                        return value.toFixed(2)
                    }
                }
            },
			{field:'channelID', title: '渠道'},
            {field:'spreaderID', title: '上级代理ID'},
            {field:'achievement', title: '输赢总额',
                formatter: function(value){
                    if(!!value || value === 0) {
                        return value.toFixed(2)
                    }
                }
            },
            {field:'directlyMemberAchievement', title: '直属会员业绩',
                formatter: function(value){
                    if(!!value || value === 0) {
                        return value.toFixed(2)
                    }
                }
            },
            {field:'agentMemberAchievement', title: '代理会员业绩',
                formatter: function(value){
                    if(!!value || value === 0) {
                        return value.toFixed(2)
                    }
                }
            },
            {field:'thisWeekLowerAgentCommision', title: '本周下级代理佣金',
                formatter: function(value){
                    if(!!value || value === 0) {
                        return value.toFixed(2)
                    }
                }
            },
            {field:'realCommision', title: '可提现佣金',
                formatter: function(value){
                    if(!!value || value === 0) {
                        return value.toFixed(2)
                    }
                }
            },
            {field:'totalCommision', title: '总佣金',
                formatter: function(value){
                    if(!!value || value === 0) {
                        return value.toFixed(2)
                    }
                }
            },
            {field:'lowerAgentCommision', title: '下级代理总佣金',
                formatter: function(value){
                    if(!!value || value === 0) {
                        return value.toFixed(2)
                    }
                }
            },
            {field:'directlyMemberCount', title: '直属会员数量'},
            {field:'weekAddedDirectlyMemberCount', title: '周增直属会员数量'},
            {field:'monthAddedDirectlyMemberCount', title: '月增直属会员数量'},
            {field:'agentMemberCount', title: '代理会员数量'},
            {field:'weekAddedAgentMemberCount', title: '周增代理会员数量'},
            {field:'monthAddedAgentMemberCount', title: '月增代理会员数量'},
            {field:'permission', title: '禁止登录', 
                formatter: function (value) {
                    return !!value?'否':'是'
                }
            },
            {field:'lastLoginIP', title: '最后登录IP'},
            {field:'lastLoginTime', title: '最后登录时间',
                formatter: function (value) {
                    return new Date(value).toLocaleString();
                }
            },
            {field:'createTime', title: '创建时间',
                formatter: function (value) {
                    return new Date(value).toLocaleString();
                }
            }
        ]]
    });

    createList();

    $('#btnQuery').click(function(){
        createList()
    });
    $('#btnDongjie').click(function(){
        var rows = $('#dataList').datagrid('getChecked');
        if (rows.length > 0){
            forbidLogin(rows[0], true);
        }else{
            alert("请选择操作对象");
        }
    });

    $('#btnJiedong').click(function (){
        var rows = $('#dataList').datagrid('getChecked');
        if (rows.length > 0){
            forbidLogin(rows[0], false);
        }else{
            alert("请选择操作对象");
        }
    });

    $('#btnGrantTreasure').click(function (){
        var rows = $('#dataList').datagrid('getChecked');
        if (rows.length > 0){
            openGrantHtml('gold', rows[0].uid);
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