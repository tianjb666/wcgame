var systemSetDataPageSize = 10;

function createList(){
    apiAdminGetRecord('publicParameterModel', 0, 100, {}, function (data) {
        let shopItems = [];
        for (let i = 0; i < data.msg.recordArr.length; ++i){
            let item = data.msg.recordArr[i];
            if (item.key === 'shopItems'){
                shopItems = JSON.parse(item.value);
                break;
            }
        }
        if (!!shopItems){
            $('#dataList').datagrid('loadData', shopItems);
        }
    });

}

function deleteItem(data){
    let rows = $('#dataList').datagrid('getRows').slice();
    for (let i = 0; i < rows.length; ++i){
        if (data.key === rows[i].key){
            rows.splice(i, 1);
            break;
        }
    }
    rows.sort(function (a, b) {
        return a.priceCount - b.priceCount;
    });
    apiAdminUpdateRecord('publicParameterModel', {key: 'shopItems'}, {value: JSON.stringify(rows)}, function () {
        createList();
        alert("删除成功");
    });
}

function updateItem(data){
    let rows = $('#dataList').datagrid('getRows').slice();
    for (let i = 0; i < rows.length; ++i){
        if (data.key === rows[i].key){
            rows[i] = data;
            break;
        }
    }
    rows.sort(function (a, b) {
        return a.priceCount - b.priceCount;
    });
    apiAdminUpdateRecord('publicParameterModel', {key: 'shopItems'}, {value: JSON.stringify(rows)}, function () {
        createList();
        alert("更新成功");
    });
}

function addItem(data){
    let rows = $('#dataList').datagrid('getRows').slice();
    for (let i = 0; i < rows.length; ++i){
        if (data.key === rows[i].key){
            alert('充值项ID已存在，请重新填写');
            return;
        }
    }
    rows.push(data);
    rows.sort(function (a, b) {
        return a.priceCount - b.priceCount;
    });
    apiAdminGetRecord('publicParameterModel', 0, 100, {}, function (data) {
        let isExist = false;
        for (let i = 0; i < data.msg.recordArr.length; ++i){
            let item = data.msg.recordArr[i];
            if (item.key === 'shopItems'){
                isExist = true;
                break;
            }
        }
        if (isExist){
            apiAdminUpdateRecord('publicParameterModel', {key: 'shopItems'}, {value: JSON.stringify(rows)}, function () {
                createList();
                alert("添加成功");
            });
        }else{
            apiAdminAddRecord('publicParameterModel', {key: 'shopItems', value: JSON.stringify(rows)}, function () {
                createList();
                alert("添加成功");
            })
        }
    });
}

function updateClick(index){
    var rows = $('#dataList').datagrid('getRows');
    window.open('./goodsItemAdd.html?info=' + encodeURI(JSON.stringify(rows[index])), "_blank", "height=300,width=800,scrollbars=no,location=no");
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
        rownumbers: false,
        onBeforeSelect:function(){
            return false;
        },
        singleSelect: true,
        columns:[[
            {field:'ck', checkbox: true},
            {field:'key',title:'充值项ID',
                formatter: function(value,row,index){
                    if(!!value) {
                        return '<a href="#" onclick="updateClick('+ index +')" class="l">'+ value +'</a>';
                    }
                }
            },
            {field:'goodsCount', title: '金币数量'},
            {field:'presentCount', title: '赠送金币'},
            {field:'priceCount', title: '价格'}
        ]]
    });

    createList();

    $('#btnDelete').click(function(){
        var rows = $('#dataList').datagrid('getChecked');
        if (rows.length > 0){
            deleteItem(rows[0]);
        }else{
            alert("请选择操作对象");
        }
    });

    $('#btnAdd').click(function(){
        window.open('./goodsItemAdd.html', "_blank", "height=300,width=800,scrollbars=no,location=no");
    });
});