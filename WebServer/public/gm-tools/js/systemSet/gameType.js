function fixData(dataArr){
    dataArr.sort(function (a,b) {
        if (a.kind === b.kind){
            return a.level - b.level;
        }else{
            return a.kind - b.kind;
        }
    });
    return dataArr;
}

function createList(){
    // 请求数据
    apiAdminGetRecord('gameTypeModel', 0, 100, {},
        function(data){
            $('#dataList').datagrid('loadData', fixData(data.msg.recordArr));
        });
}

function deleteGameType(gameTypeID){
    apiAdminDeleteRecord('gameTypeModel', {gameTypeID:gameTypeID}, function () {
        alert('删除成功');
        createList();
    });
}

function addGameType(gameTypeInfo, cb){
    apiAdminAddRecord('gameTypeModel', gameTypeInfo, function () {
        cb();
        createList();
    });
}

function updateGameType(gameTypeID, gameTypeInfo, cb){
    apiAdminUpdateRecord('gameTypeModel', {gameTypeID:gameTypeID}, gameTypeInfo, function () {
        cb();
        createList();
    });
}

function updateClick(index){
    var rows = $('#dataList').datagrid('getRows');
    var info = rows[index];
    window.open('./gameTypeAdd.html?info=' + encodeURI(JSON.stringify(info)), "_blank", "height=400,width=800,scrollbars=no,location=no");
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
            {field:'kind',title:'游戏名字',
                formatter: function(value,row,index){
                    if(!value === false) {
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
                        return '<a href="#" onclick="updateClick('+ index +')" class="l">'+ name +'</a>';
                    }
                }
            },
            {field:'level', title: '房间等级', 
                formatter: function (value) {
                    let levelName = "";
                    if(value === 1){
                        levelName = "初级场"
                    }else if (value === 2){
                        levelName = "中级场"
                    }else if (value === 3){
                        levelName = "高级场"
                    }else if (value === 4){
                        levelName = "土豪场"
                    }else if (value === 5){
                        levelName = "财大气粗"
                    }else if (value === 6){
                        levelName = "腰缠万贯"
                    }else if (value === 7){
                        levelName = "挥金如土"
                    }else if (value === 8){
                        levelName = "富贵逼人"
                    }
                    return levelName;
                }
            },
            {field:'goldLowerLimit', title: '金币下限'},
            {field:'goldUpper', title: '金币上限'},
            {field:'minPlayerCount', title: '最小玩家数量'},
            {field:'maxPlayerCount', title: '最大玩家数量'},
            {field:'baseScore', title: '底分'},
            {field:'minRobotCount', title: '最小机器人数量'},
            {field:'maxRobotCount', title: '最大机器人数量'},
        ]]
    });

    createList();

    $('#btnAdd').click(function(){
        window.open('./gameTypeAdd.html', "_blank", "height=400,width=800,scrollbars=no,location=no");
    });
    $('#btnDelete').click(function(){
        if (confirm("是否确定要删除游戏场")){
            var rows = $('#dataList').datagrid('getChecked');
            if (rows.length > 0){
                deleteGameType(rows[0].gameTypeID);
            }else{
                alert("请选择操作对象");
            }
        }
    });
});