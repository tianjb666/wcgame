/**
 * Created by 52835 on 2017/7/17.
 */

$(document).ready(function() {
    var parameters = parseQueryString(window.location.href);
    var kindID = parseInt(parameters.kindID);

    $('#btnSave').click(function(){
        let count = parseInt($("#txtAddCount").val() || 0);
        if (count === 0){
            alert("请输入有效的修改值");
            return;
        }
        window.opener.window.execModify(kindID, count, function(){
            alert("修改成功");
            window.close();
        });
    });
});