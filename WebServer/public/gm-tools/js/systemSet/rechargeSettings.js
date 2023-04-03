$(document).ready(function() {
    let rechargeTypeArr= ["alipay", "wx", "qq", "union"];
    let rechargeConfig = {};
    apiAdminGetRecord('publicParameterModel', 0, 100, {key: "rechargeConfig"}, function (data) {
        rechargeConfig = data.msg.recordArr.length > 0 ? JSON.parse(data.msg.recordArr[0].value): {};
        for (let i = 0; i < rechargeTypeArr.length; ++i){
            setInfo(rechargeTypeArr[i], rechargeConfig[rechargeTypeArr[i]], true);
        }
    });

    function setInfo(rechargeType, config, addBtnEvent) {
        if (!config) config = {enable: false, list: []};
        $('#enable' + rechargeType).val(config.enable?1:0);
        let listValue = "";
        for (let i = 0; i < config.list.length; ++i){
            if (i !== config.list.length - 1){
                listValue += config.list[i] + "-";
            }else{
                listValue += config.list[i];
            }
        }
        $('#list' + rechargeType).val(listValue);
        if (!!addBtnEvent){
            $('#btnSave' + rechargeType).click(function () {
                let enable = $('#enable' + rechargeType).val();
                enable = (parseInt(enable) === 1);
                let listValue = $('#list' + rechargeType).val();
                listValue = listValue.split('-');
                let list = [];
                for (let i = 0; i < listValue.length; ++i){
                    let temp = parseInt(listValue[i] || 0);
                    if (temp > 0) list.push(temp);
                }
                rechargeConfig[rechargeType] = {enable: enable, list: list};
                apiAdminUpdateRecord("publicParameterModel", {key: "rechargeConfig"}, {value: JSON.stringify(rechargeConfig)}, function () {
                    alert("修改成功");
                })
            });
        }
    }
});