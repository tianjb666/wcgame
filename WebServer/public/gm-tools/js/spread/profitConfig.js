function fixData(dataArr){
    for (var i = 0; i < dataArr.length; ++i){
        dataArr[i].proportionEx = Math.floor(dataArr[i].proportion * 10000);
    }
    dataArr.sort(function (a, b) {
        return a.min - b.min;
    });
    return dataArr;
}

function createList(){
    // 请求数据
    Global.API.getProfitConfig(
        function(data){
            $('#dataList').datagrid('loadData', fixData(data.msg.list));
        });
}

function deleteData(info){
    Global.API.updateProfitConfig("delete", {index:info.index}, function(){
        createList();
    });
}

function addData(info, cb){
    Global.API.updateProfitConfig("add", info, function(){
        cb();
        createList();
    });
}

function updateData(info, cb){
    Global.API.updateProfitConfig("update", info, function(){
        cb();
        createList();
    });
}

function updateClick(index){
    var rows = $('#dataList').datagrid('getRows');
    var info = rows[index];
    window.open('./profitConfigAdd.html?info=' + encodeURI(JSON.stringify(info)), "_blank", "height=400,width=800,scrollbars=no,location=no");
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
        pageSize: 20,
        pageList: [20],
        rownumbers: true,
        onBeforeSelect:function(){
            return false;
        },
        singleSelect: true,
        columns:[[
            {field: 'ck', checkbox: true},
            {field: 'level', title: '代理级别',
                formatter: function(value,row,index){
                    if(!value === false) {
                        return '<a href="#" onclick="updateClick('+ index +')" class="l">'+ value +'</a>';
                    }
                }
            },
            {field:'min', title: '业绩最低值'},
            {field:'max', title: '业绩最高值'},
            {field:'proportionEx', title: '每万元佣金数'}
        ]]
    });

    createList();

    $('#btnAdd').click(function(){
        window.open('./profitConfigAdd.html', "_blank", "height=400,width=800,scrollbars=no,location=no");
    });
    $('#btnDelete').click(function(){
        if (confirm("是否确定要删除代理级别")){
            var rows = $('#dataList').datagrid('getChecked');
            if (rows.length > 0){
                deleteData(rows[0]);
            }else{
                alert("请选择操作对象");
            }
        }
    });
});