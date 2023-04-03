/**
 * Created by 52835 on 2017/7/21.
 */
$(document).ready(function() {
    apiAdminGetRecord('publicParameterModel', 0, 100, {}, function (data) {
        let parameterData = null;
        for(let i = 0; i < data.msg.recordArr.length; ++i){
            let para = data.msg.recordArr[i];
            if (para.key === "loopBroadcastContent"){
                parameterData = para;
                break;
            }
        }
        if (!parameterData) return;
        let loopBroadcastContent = parameterData.value;
        if (!!loopBroadcastContent){
            $('#broadcastContent').val(loopBroadcastContent);
        }
    });

    $('#btnSave').click(function(){
        var content = $('#broadcastContent').val();
        if (!content || content.length === 0){
            alert('请输入广播内容');
            return;
        }
        apiAdminUpdateRecord("publicParameterModel", {key:'loopBroadcastContent'}, {value: content}, function(){
            alert('保存成功');
        });
    });

    $('#btnSend').click(function(){
        var content = $('#broadcastContent1').val();
        if (!content || content.length === 0){
            alert('请输入广播内容');
            return;
        }

        let requestData ={
            route: "sendSystemBroadcast",
            content: content
        };
        apiRetransmissionToGameServer(requestData, function () {
            alert('发送成功');
        });
    });
});