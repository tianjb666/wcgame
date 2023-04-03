$(document).ready(function() {
    var parameters = parseQueryString(window.location.href);
    if (!!parameters.uid) $('#targetUid').val(parameters.uid);

    $('#btnSendSingleEmail').click(function(){
        var uid = $('#targetUid').val();
        if (!uid || uid.length === 0){
            alert('请输入有效的用户ID');
            return;
        }
        var title = $('#singleEmailTitle').val();
        if (!title || title.length === 0){
            alert('请输入邮件标题');
            return;
        }
        var content = $('#singleEmailContent').val();
        if (!content || content.length === 0){
            alert('请输入邮件内容');
            return;
        }

        if(!confirm("操作无法撤销，是否确定发送？")) {
            return;
        }

        apiSendSingleEmail(uid, title, content, function(data){
            if (data.code === 0){
                alert("发送成功");
            }
        });
    });

    $('#btnSendAllEmail').click(function(){
        var title = $('#allEmailTitle').val();
        if (!title || title.length === 0){
            alert('请输入邮件标题');
            return;
        }
        var content = $('#allEmailContent').val();
        if (!content || content.length === 0){
            alert('请输入邮件内容');
            return;
        }

        if(!confirm("操作无法撤销，是否确定发送？")) {
            return;
        }
        apiSendAllServerEmail(title, content, function () {
            alert("全服邮件发送成功");
        });
    });
});