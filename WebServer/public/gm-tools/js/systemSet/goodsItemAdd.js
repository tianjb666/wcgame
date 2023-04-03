/**
 * Created by 52835 on 2017/7/19.
 */

function setInfo(data){
    console.log(data);
    $('#key').val(data.key);
    $('#goodsType').val(data.goodsType);
    $('#goodsCount').val(data.goodsCount);
    $('#presentType').val(data.presentType);
    $('#presentCount').val(data.presentCount);
    $('#priceType').val(data.priceType);
    $('#priceCount').val(data.priceCount);
}

$(document).ready(function() {
    let parameter = parseQueryString(window.location.href);
    let info = !!parameter.info?JSON.parse(decodeURI(parameter.info)):null;
    if (!!info){
        setInfo(info);
    }

    $('#btnSave').click(function(){
        var key = $("#key").val();
        if (!key || key.length === 0){
            alert('请输入商品项ID');
            return;
        }
        var goodsType = parseInt($("#goodsType").val());
        if (!goodsType) {
            alert('请选择出售物品类型');
            return;
        }
        var goodsCount = parseInt($("#goodsCount").val());
        if (!goodsCount || goodsCount <= 0) {
            alert('请输入有效的物品数量');
            return;
        }

        var presentType = parseInt($("#presentType").val());
        if (!presentType) {
            alert('请选择出售物品类型');
            return;
        }
        var presentCount = parseInt($("#presentCount").val()) || 0;

        var priceType = parseInt($("#priceType").val());
        if (!priceType) {
            alert('请选择花费价格类型');
            return;
        }
        var priceCount = parseInt($("#priceCount").val());
        if (!priceCount || priceCount <= 0) {
            alert('请输入有效的价格数量');
            return;
        }

        var data = {
            key: key,
            goodsCount: goodsCount,
            presentCount: presentCount,
            priceCount: priceCount
        };
        if (!!info){
            window.opener.window.updateItem(data);
        }else{
            window.opener.window.addItem(data);
        }
        window.close();
    });
});