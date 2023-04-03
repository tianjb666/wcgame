var userDataPageSize = 20;

function createList(){
    apiAdminGetRecord('adminModel', 0, 100, {permission: {$ne: -1}}, function(data){
        var msg = data.msg;
        var userDataArr = msg.recordArr;
        var dataList = $('#dataList');
        var dataPager = dataList.datagrid("getPager");
        dataList.datagrid('loadData', userDataArr.slice(0, userDataPageSize));
        dataPager.pagination({
            total:msg.recordArr.length,
            onSelectPage:function (pageNo, pageSize) {
                var start = (pageNo - 1) * pageSize;
                dataList.datagrid('loadData', userDataArr.slice(start, userDataPageSize));
            }
        });
    });
}

function addAccount(account, password, nickname, permission, cb){
    let saveData = {
        account: account,
        password: password,
        nickname: nickname,
        permission: permission,
        createTime: Date.now()
    };
    apiAdminAddRecord('adminModel',  saveData, function(data){
        if (data.code === 0){
            cb();
            createList();
        }
    })
}

function deleteAccount(uid, cb) {
    apiAdminDeleteRecord('adminModel', {uid: uid}, function () {
        cb();
        createList();
    })
}

function resetAccountAndPassword(uid, account, password, cb){
    apiAdminUpdateRecord('adminModel', {uid: uid}, {account:account, password:password}, function () {
        cb();
    });
}

function updatePermission(uid, permission, cb){
    apiAdminUpdateRecord('adminModel', {uid: uid}, {permission:permission}, function () {
        cb();
        createList();
    });
}

function updateClick(index){
    let rows = $('#dataList').datagrid('getRows');
    let data = rows[index];
    let url = './administratorsAccountUpdate.html?uid=' + data.uid + "&nickname=" + data.nickname + "&permission=" + data.permission;
    window.open(encodeURI(encodeURI(url)), "_blank", "height=410,width=800,scrollbars=no,location=no");
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
            {field:'uid',title:'管理员ID'},
            {field:'nickname',title:'管理员昵称',
                formatter: function(value,row,index){
                    if(!!value) {
                        return '<a href="#" onclick="updateClick('+ index +')" class="l">'+ value +'</a>';
                    }
                }
            }
        ]]
    });

    createList();

    $('#btnAdd').click(function(){
        window.open('./administratorsAccountAdd.html', "_blank", "height=300,width=800,scrollbars=no,location=no");
    });

    $('#btnRemove').click(function(){
        var rows = $('#dataList').datagrid('getChecked');
        if (rows.length > 0){
            deleteAccount(rows[0].uid, function(){
                alert("删除成功");
            })
        }else{
            alert("请选择操作对象");
        }
    });
});