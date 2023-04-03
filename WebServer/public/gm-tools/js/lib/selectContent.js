/**
 * Created by zxm on 2017/8/30.
 */
$.fn.extend({
    "initSelector":function(opt) {
        if (typeof opt !== "object") {
            alert('参数错误!');
            return;
        }
        var uploadId = $(this).attr("id");
        if(!uploadId){
            alert("要设定一个id!");
            return;
        }
        opt.uploadId = uploadId;
        selectorTools.initWithLayout(opt);
        selectorTools.initSize(opt);
        //selectorTools.initWithCleanFile(opt);
        //selectedList.initFileList(opt);

        return opt;
    },
    
    "setSelected": function (opt, index, url, data) {
        selectorTools.setSelected(opt, index, url, data);
    },
    
    "resetSize": function (opt, size) {
        if (size === opt.selectedList.length) return;
        var uploadId = opt.uploadId;
        // 移除多余的空间
        if (size < opt.selectedList.length){
            var childArr = $("#" + uploadId + " .box").children();
            for (var i = 0; i < childArr.length; ++i){
                var child = childArr[i];
                var id = $(child).attr("fileCodeId");
                if (parseInt(id) >= size){
                    $(child).remove();
                }
            }
            opt.selectedList.splice(size, opt.selectedList.length-size);
        }else{
            var boxJsObj =  $("#"+uploadId+" .box").get(0);
            for (var i = opt.selectedList.length; i < size; ++i){
                var fileModel = selectorTools.getShowFileType(true, "", "未选择", null, i);
                $(boxJsObj).append(fileModel);
                var deleteBtn = $("#"+uploadId+" .fileItem .status i");
                deleteBtn.hide();
                deleteBtn.on("click",function(){
                    selectorTools.clearSelected(opt, this);
                });
                var imgBtn = $("#"+uploadId+" .fileItem .imgShow a");
                imgBtn.on("click", function () {
                    if (!!opt.clickEventCallback){
                        var fileItem = $(this).parent().parent();
                        var fileCodeId = fileItem.attr("fileCodeId");
                        opt.clickEventCallback(opt, fileCodeId);
                    }
                });
                opt.selectedList[i] = null;
            }
        }
    }
});

var selectorTools = {
    /**
     * 初始化布局
     * @param opt 参数对象
     */
    "initWithLayout":function(opt){
        var uploadId = opt.uploadId;
        var boxStr = "<div class='box'></div>";
        $("#"+uploadId).append(boxStr);
    },

    "initSize": function (opt) {
        opt.selectedList = [];
        var size = opt.maxNumber;
        // 创建待添加文件列表
        var uploadId = opt.uploadId;
        var boxJsObj =  $("#"+uploadId+" .box").get(0);
        for (var i = 0; i < size; ++i){
            var fileModel = selectorTools.getShowFileType(true, "", "未选择", null, i);
            $(boxJsObj).append(fileModel);
            var deleteBtn = $("#"+uploadId+" .fileItem .status i");
            deleteBtn.hide();
            deleteBtn.on("click",function(){
                selectorTools.clearSelected(opt, this);
            });
            var imgBtn = $("#"+uploadId+" .fileItem .imgShow a");
            imgBtn.on("click", function () {
                if (!!opt.clickEventCallback){
                    var fileItem = $(this).parent().parent();
                    var fileCodeId = fileItem.attr("fileCodeId");
                    opt.clickEventCallback(opt, fileCodeId);
                }
            });
            opt.selectedList[i] = null;
        }
    },

    "clearSelected": function (opt, obj) {
        var fileItem = $($(obj).parent().parent());
        var fileCodeId = $(fileItem).attr("fileCodeId");
        $(obj).hide();

        var imgObj = $(fileItem.find('img')[0]);
        imgObj.removeAttr('src');
        imgObj.addClass('select-empty');

        var nameObj = $($(fileItem).children()[2]);
        nameObj.text("未选择");

        opt.selectedList[fileCodeId] = null;
    },

    "setSelected": function (opt, index, url, data) {
        var uploadId = opt.uploadId;
        var childArr = $("#" + uploadId + " .box").children();
        var obj = null;
        for (var i = 0; i < childArr.length; ++i){
            var child = childArr[i];
            var id = $(child).attr("fileCodeId");
            if (id === index.toString()){
                obj = child;
                break;
            }
        }

        var imgObj = $($(obj).find("img")[0]);
        imgObj.removeClass('select-empty');
        imgObj.attr('src', url);

        //var deleteBtn = $($(obj).find("i")[0]);
        //deleteBtn.show();

        var nameObj = $($(obj).children()[2]);
        nameObj.text(data.name);

        opt.selectedList[index] = data;
    },

    "getShowFileType":function(isImg,fileType,fileName,isImgUrl,fileCodeId){
        var showTypeStr="<div class='fileType'>"+fileType+"</div><i class='iconfont icon-wenjian'></i>";//默认显示类型
        if(isImg){
            if(!!isImgUrl){//图片显示类型
                showTypeStr = "<img class='select-img' src='"+isImgUrl+"'/>";
                showTypeStr = '<a href="" class="l">'+ showTypeStr +'</a>';
            }else{
                showTypeStr = "<img class='select-img select-empty'/>";
                showTypeStr = "<a href='#' class='l'>"+ showTypeStr +"</a>";
            }
        }
        var modelStr="";
        modelStr+="<div class='fileItem selectItem'  fileCodeId='"+fileCodeId+"'>";
        modelStr+="<div class='imgShow'>";
        modelStr+=showTypeStr;
        modelStr+=" </div>";
        modelStr+="<div class='status'>";
        modelStr+="<i class='iconfont icon-shanchu'></i>";
        modelStr+="</div>";
        modelStr+=" <div class='fileName'>";
        modelStr+=fileName;
        modelStr+="</div>";
        modelStr+=" </div>";
        return modelStr;
    }
};

/**
 * 上传事件操作
 * */
var selectEvent = {
    /**
     * 拖动时操作事件
     */
    "dragListingEvent":function(e,opt){

        e.preventDefault();//取消默认浏览器拖拽效果 
        var fileList = e.dataTransfer.files;//获取文件对象
        uploadTools.addFileList(fileList,opt);
        if(opt.autoCommit){
            selectEvent.uploadFileEvent(opt);
        }

    },
    /**
     * 删除文件对应的事件
     * */
    "deleteFileEvent":function(opt,obj){
        var fileItem = $(obj).parent().parent();
        var fileCodeId = fileItem.attr("fileCodeId");
        var fileListArray = uploadFileList.getFileList(opt);
        delete fileListArray.splice(fileCodeId, 1);
        uploadFileList.setFileList(fileListArray,opt);
        fileItem.remove();

    },
    /**
     * 选择文件按钮事件
     * @param opt
     */
    "selectFileEvent":function(opt){
        var uploadId = opt.uploadId;
        var ismultiple = opt.ismultiple;
        var inputObj=document.createElement('input');
        inputObj.setAttribute('id',uploadId+'_file');
        inputObj.setAttribute('type','file');
        inputObj.setAttribute("style",'visibility:hidden');
        if(ismultiple){//是否选择多文件
            inputObj.setAttribute("multiple","multiple");
        }
        $(inputObj).on("change",function(){
            selectEvent.selectFileChangeEvent(this.files,opt);
        });
        document.body.appendChild(inputObj);
        inputObj.click();
    },
    /**
     * 选择文件后对文件的回调事件
     * @param opt
     */
    "selectFileChangeEvent":function(files,opt){
        uploadTools.addFileList(files,opt);
        uploadTools.cleanFilInputWithSelectFile(opt);

        if(opt.autoCommit){
            selectEvent.uploadFileEvent(opt);
        }
    },
    /**
     * 清除选择文件的input
     * */
    "cleanFilInputWithSelectFile":function(opt){
        var uploadId = opt.uploadId;
        $("#"+uploadId+"_file").remove();
    },
    /**
     * 上传文件的事件
     * */
    "uploadFileEvent":function(opt){
        opt.beforeUpload(opt);

        uploadTools.uploadFile(opt);
    },
    /**
     * 清除文件事件
     */
    "cleanFileEvent":function(opt){
        var uploadId = opt.uploadId;
        if(opt.showSummerProgress){
            $("#"+uploadId+" .subberProgress").css("display","none");
            $("#"+uploadId+" .subberProgress .progress>div").css("width","0%");
            $("#"+uploadId+" .subberProgress .progress>div").html("0%");
        }
        uploadTools.cleanFilInputWithSelectFile(opt);
        uploadFileList.setFileList([],opt);
        $("#"+uploadId+" .box").html("");
        uploadTools.initWithUpload(opt);//初始化上传
    }

};
var selectedList={
    "initFileList":function(opt){
        opt.selectedList = [];
    },
    "getSelectedList":function(opt){
        return opt.selectedList;
    },
    "setSelectedList":function(selectedList,opt){
        opt.selectedList = selectedList;
    }
};