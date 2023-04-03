/**
 * Created by zxm on 2017/8/30.
 */
$.fn.extend({
    "initUpload":function(opt) {
        if (typeof opt !== "object") {
            alert('参数错误!');
            return;
        }
        var uploadId = $(this).attr("id");
        if(uploadId===null||uploadId===""){
            alert("要设定一个id!");
        }
        $.each(uploadTools.getInitOption(uploadId), function (key, value) {
            if (!opt[key]) {
                opt[key] = value;
            }
        });
        uploadTools.initWithLayout(opt);            //初始化布局
        uploadTools.initWithDrag(opt);              //初始化拖拽
        uploadTools.initWithSelectFile(opt);        //初始化选择文件按钮
        uploadTools.initWithUpload(opt);            //初始化上传
        uploadTools.initWithCleanFile(opt);
        uploadFileList.initFileList(opt);

        return opt;
    },

    "initUploadFiles": function(fileList, opt){
        uploadTools.addFileList(fileList, opt);
    },

    "uploadFile": function(opt){
        if (!!opt.beforeUpload){
            opt.beforeUpload(opt);
        }
        uploadTools.uploadFile(opt);
    }
});
/**
 * 上传基本工具和操作
 */
var uploadTools = {
    /**
     * 基本配置参数
     * @param uploadId
     * @returns {{uploadId: *, url: string, autoCommit: string, canDrag: boolean, fileType: string, size: string, ismultiple: boolean, showSummerProgress: boolean}}
     */
    "getInitOption":function(uploadId){
        //url test测试需要更改
        var initOption={
            "uploadId":uploadId,
            "uploadUrl":"#",//必须，上传地址
            "autoCommit":false,//是否自动上传
            "canDrag":true,//是否可以拖动
            "fileType":"*",//文件类型
            "size":"-1",//文件大小限制,单位kB
            "ismultiple":true,//是否选择多文件
            "filelSavePath":"",//文件上传地址，后台设置的根目录
            "beforeUpload":function(opt){//在上传前面执行的回调函数
            },
            "success":function(opt){//在上传之后
                //alert("hellos");
            }

        };
        return initOption;
    },
    /**
     * 初始化布局
     * @param opt 参数对象
     */
    "initWithLayout":function(opt){
        var uploadId = opt.uploadId;
        //选择文件和上传按钮模板
        var btsStr = "";
        btsStr += "<div class='uploadBts'>";
        btsStr += "<div>";
        btsStr += "<div class='selectFileBt'>选择文件</div>";
        btsStr += "</div>";
        //btsStr += "<div class='uploadFileBt'>";
        //btsStr += "<i class='iconfont icon-shangchuan'></i>";
        //btsStr += " </div>";
        //btsStr += "<div class='cleanFileBt'>";
        //btsStr += "<i class='iconfont icon-qingchu'></i>";
        //btsStr += " </div>";
        btsStr += "</div>";
        $("#"+uploadId).append(btsStr);
        //添加文件显示框
        var boxStr = "<div class='box'></div>";
        $("#"+uploadId).append(boxStr);
    },
    /**
     * 初始化拖拽事件
     * @param opt 参数对象
     */
    "initWithDrag":function(opt){
        var canDrag = opt.canDrag;
        var uploadId = opt.uploadId;
        if(canDrag){
            $(document).on({
                dragleave:function(e){//拖离 
                    e.preventDefault();
                },
                drop:function(e){//拖后放 
                    e.preventDefault();
                },
                dragenter:function(e){//拖进 
                    e.preventDefault();
                },
                dragover:function(e){//拖来拖去 
                    e.preventDefault();
                }
            });
            var box = $("#"+uploadId+" .box").get(0);
            if(box!=null){
                //验证图片格式，大小，是否存在
                box.addEventListener("drop",function(e) {
                    uploadEvent.dragListingEvent(e,opt);
                });
            }
        }
    },
    /**
     * 初始化选择文件按钮
     * @param opt
     */
    "initWithSelectFile":function(opt){
        var uploadId = opt.uploadId;
        $("#"+uploadId+" .uploadBts .selectFileBt").on("click",function(){
            uploadEvent.selectFileEvent(opt);
        });
    },
    /**
     * 初始化文件上传
     * @param opt
     */
    "initWithUpload":function(opt){
        var uploadId = opt.uploadId;
        $("#"+uploadId+" .uploadBts .uploadFileBt").on("click",function(){
            uploadEvent.uploadFileEvent(opt);
        });
        $("#"+uploadId+" .uploadBts .uploadFileBt i").css("color","#0099FF");
    },
    "isInArray": function(str, arr){
        for (var i =0; i < arr.length; ++i){
            if (arr[i] === str) return true;
        }
        return false;
    },
    /**
     * 添加文件到列表
     * */
    "addFileList":function(fileList,opt){
        var uploadId = opt.uploadId;
        var boxJsObj =  $("#"+uploadId+" .box").get(0);
        var fileListArray=uploadFileList.getFileList(opt);
        var fileNumber = uploadTools.getFileNumber(opt);
        if(fileNumber+fileList.length>opt.maxFileNumber){
            alert("最多只能上传"+opt.maxFileNumber+"个文件");
            return;
        }
        var imgtest=/image\/(\w)*/;//图片文件测试
        var fileTypeArray = opt.fileType;//文件类型集合
        var fileSizeLimit = opt.size;//文件大小限制
        for(var i=0;i<fileList.length;i++){
            //判断文件是否存在
            if(uploadTools.fileIsExit(fileList[i],opt)){
                alert("文件（"+fileList[i].name+"）已经存在！");
                continue;
            }
            var fileTypeStr =  uploadTools.getSuffixNameByFileName(fileList[i].name);
            //文件大小显示判断
            if(fileSizeLimit!=-1&&fileList[i].size>(fileSizeLimit*1000)){
                alert("文件（"+fileList[i].name+"）超出了大小限制！请控制在"+fileSizeLimit+"KB内");
                continue;
            }
            //文件类型判断
            if(fileTypeArray=="*"||uploadTools.isInArray(fileTypeStr,fileTypeArray)){
                var fileTypeUpcaseStr = fileTypeStr.toUpperCase();
                if(imgtest.test(fileList[i].type)){
                    //var imgUrlStr = window.webkitURL.createObjectURL(fileList[i]);//获取文件路径
                    var imgUrlStr ="";//获取文件路径
                    if (!!fileList[i].imgUrlStr){
                        imgUrlStr = fileList[i].imgUrlStr;
                    }else if (window.createObjectURL != undefined) { // basic
                        imgUrlStr = window.createObjectURL(fileList[i]);
                    } else if (window.URL != undefined) { // mozilla(firefox)
                        imgUrlStr = window.URL.createObjectURL(fileList[i]);
                    } else if (window.webkitURL != undefined) { // webkit or chrome
                        imgUrlStr = window.webkitURL.createObjectURL(fileList[i]);
                    }
                    var fileModel = uploadTools.getShowFileType(true,fileTypeUpcaseStr,fileList[i].name,imgUrlStr,fileListArray.length);
                    $(boxJsObj).append(fileModel);
                }else{
                    var fileModel = uploadTools.getShowFileType(true,fileTypeUpcaseStr,fileList[i].name,null,fileListArray.length);
                    $(boxJsObj).append(fileModel);
                }
                uploadTools.initWithDeleteFile(opt);
                fileListArray[fileListArray.length] = fileList[i];
            }else{
                alert("不支持该格式文件上传:"+fileList[i].name);
            }
        }
        uploadFileList.setFileList(fileListArray,opt);

    },
    /**
     * 返回显示文件类型的模板
     * @param isImg 是否式图片：true/false
     * @param fileType 文件类型
     * @param fileName 文件名字
     * @param isImgUrl 如果事文件时的文件地址默认为null
     */
    "getShowFileType":function(isImg,fileType,fileName,isImgUrl,fileCodeId){
        var showTypeStr="<div class='fileType'>"+fileType+"</div> <i class='iconfont icon-wenjian'></i>";//默认显示类型
        if(isImg){
            if(isImgUrl!=null&&isImgUrl!="null"&&isImgUrl!=""){//图片显示类型
                showTypeStr = "<img src='"+isImgUrl+"'/>";
            }
        }
        var modelStr="";
        modelStr+="<div class='fileItem'  fileCodeId='"+fileCodeId+"'>";
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
    },
    /**
     * 删除文件
     * @param opt
     */
    "initWithDeleteFile":function(opt){
        var uploadId = opt.uploadId;
        $("#"+uploadId+" .fileItem .status i").on("click",function(){
            uploadEvent.deleteFileEvent(opt,this);
        })
    },
    /**
     * 获取文件个数
     * @param opt
     */
    "getFileNumber":function(opt){
        var number = 0;
        var fileList = uploadFileList.getFileList(opt);
        for(var i=0;i<fileList.length;i++){
            if(fileList[i]!=null){
                number++;
            }
        }
        return number;
    },
    /**
     * 禁用文件上传
     */
    "disableFileUpload":function(opt){
        var uploadId = opt.uploadId;
        $("#"+uploadId+" .uploadBts .uploadFileBt").off();
        $("#"+uploadId+" .uploadBts .uploadFileBt i").css("color","#DDDDDD");

    },
    /**
     * 禁用文件清除
     */
    "disableCleanFile":function(opt){
        var uploadId = opt.uploadId;
        $("#"+uploadId+" .uploadBts .cleanFileBt").off();
        $("#"+uploadId+" .uploadBts .cleanFileBt i").css("color","#DDDDDD");
    },
    /**
     * 初始化清除文件
     * @param opt
     */
    "initWithCleanFile":function(opt){

        var uploadId = opt.uploadId;
        $("#"+uploadId+" .uploadBts .cleanFileBt").on("click",function(){
            uploadEvent.cleanFileEvent(opt);
        });
        $("#"+uploadId+" .uploadBts .cleanFileBt i").css("color","#0099FF");

    },
    /**
     * 文件是否已经存在
     * */
    "fileIsExit":function(file,opt){
        var fileList = uploadFileList.getFileList(opt);
        var ishave = false;
        for(var i=0;i<fileList.length;i++){
            //文件名相同，文件大小相同
            if(fileList[i]!=null&&fileList[i].name ==file.name&&fileList[i].size==file.size){
                ishave = true;
            }
        }
        return ishave;
    },
    /**
     * 获取文件名后缀
     * @param fileName 文件名全名
     * */
    "getSuffixNameByFileName":function(fileName){
        var str = fileName;
        var pos = str.lastIndexOf(".")+1;
        var lastname = str.substring(pos,str.length);
        return lastname;
    },
    /**
     * 清除选择文件的input
     * */
    "cleanFilInputWithSelectFile":function(opt){
        var uploadId = opt.uploadId;
        $("#"+uploadId+"_file").remove();
    },

    /**
     *清楚服务器原有文件
     */
    "deleteFile": function (opt, cb) {
        var deleteUrl = opt.deleteUrl;
        var fileList = uploadFileList.getFileList(opt);
        var list = [];
        for (var i = 0; i < opt.originalFileList.length; ++i){
            var isExist = false;
            for (var j = 0; j < fileList.length; ++j){
                if (fileList[i].resUrl === opt.originalFileList[i]){
                    isExist = true;
                    break;
                }
            }
            if (!isExist){
                list.push(opt.originalFileList[i]);
            }
        }
        if(list.length <=0) {
            cb();
            return;
        }
        //var formData = new FormData();
        //formData.append('resList', JSON.stringify(list));
        $.ajax({
            type: "post",
            url: deleteUrl,
            data: {resList: JSON.stringify(list)},
            success: function () {
                cb();
            },
            error: function (e) {
                cb(e);
            }
        });
    },
    /**
     * 上传文件
     */
    "uploadFile":function(opt){
        var uploadUrl = opt.uploadUrl;
        var fileList = uploadFileList.getFileList(opt);
        uploadTools.deleteFile(opt, function (err) {
            if(!!err){
                alert("删除原有图片错误");
                if (!!error){
                    opt.error(err);
                }
            }else{
                var formData = new FormData();
                var fileNumber = uploadTools.getFileNumber(opt);
                if(fileNumber<=0){
                    opt.success(opt, []);
                    return;
                }
                if(!!opt.otherData){
                    for(var j=0;j<opt.otherData.length;j++){
                        formData.append(opt.otherData[j].name,opt.otherData[j].value);
                    }
                }
                console.log("zxm1:"+JSON.stringify(formData));

                for(var i=0;i<fileList.length;i++){
                    if (!!fileList[i] && !!fileList[i].imgUrlStr) continue;
                    if(fileList[i]!==null){
                        formData.append("file",fileList[i]);
                    }
                }

                formData.append("filelSavePath",opt.filelSavePath);
                if(uploadUrl!=="#"&&uploadUrl!=="") {
                    uploadTools.disableFileUpload(opt);             //禁用文件上传
                    uploadTools.disableCleanFile(opt);              //禁用清除文件
                    console.log("zxm2:"+JSON.stringify(formData));

                    /*var xhrs = new XMLHttpRequest();
                    xhrs.onreadystatechange = function () {
                        if (xhrs.readyState === 4 && (xhrs.status === 200)) {
                            uploadTools.initWithCleanFile(opt);
                            setTimeout(function () {
                                var imgUrlList = JSON.parse(data);
                                var fileList = uploadFileList.getFileList(opt);
                                for (var key in fileList){
                                    if (fileList.hasOwnProperty(key) && !!fileList[key].original){
                                        imgUrlList.push(fileList[key].resUrl);
                                    }
                                }
                                opt.success(opt, imgUrlList)
                            }, 500);
                        }
                    };
                    xhrs.open("post",uploadUrl, false);
                    //POST方式需要自己设置http的请求头
                    xhrs.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
                    xhrs.send(formData);*/

                    $.ajax({
                        type: "post",
                        url: uploadUrl,
                        data: formData,
                        processData: false,
                        contentType: false,
                        /*  beforeSend: function(request) {
                         request.setRequestHeader("filePath", file_path);
                         }, */
                        success: function (data) {
                            uploadTools.initWithCleanFile(opt);
                            setTimeout(function () {
                                var imgUrlList = data;
                                var fileList = uploadFileList.getFileList(opt);
                                for (var key in fileList){
                                    if (fileList.hasOwnProperty(key) && !!fileList[key].original){
                                        imgUrlList.push(fileList[key].resUrl);
                                    }
                                }
                                opt.success(opt, imgUrlList)
                            }, 500);
                        },
                        error: function (e) {
                            if (!!opt.error) opt.error(e);
                        }
                    });

                }
            }
        });
    },
    /**
     * 上传文件失败集体显示
     * @param opt
     */
    "uploadError":function(opt){
        var uploadId = opt.uploadId;
        $("#"+uploadId+" .box .fileItem .status>i").addClass("iconfont icon-cha");
    }

};

/**
 * 上传事件操作
 * */
var uploadEvent = {
    /**
     * 拖动时操作事件
     */
    "dragListingEvent":function(e,opt){

        e.preventDefault();//取消默认浏览器拖拽效果 
        var fileList = e.dataTransfer.files;//获取文件对象
        uploadTools.addFileList(fileList,opt);
        if(opt.autoCommit){
            uploadEvent.uploadFileEvent(opt);
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
            uploadEvent.selectFileChangeEvent(this.files,opt);
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
            uploadEvent.uploadFileEvent(opt);
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
var uploadFileList={
    "initFileList":function(opt){
        opt.fileList = [];
        // 添加初始文件
        var arr = [];
        for (var i = 0; i < opt.originalFileList.length; ++i){
            var pathArr = opt.originalFileList[i].split('/');
            arr.push({
                size: 1,
                type: "image/jpeg",
                name: pathArr[pathArr.length-1].split('?')[0],
                imgUrlStr: SERVER_URL + '/' + opt.originalFileList[i],
                resUrl: opt.originalFileList[i],
                original: true
            })
        }
        uploadTools.addFileList(arr, opt);
    },
    "getFileList":function(opt){
        return opt.fileList;
    },
    "setFileList":function(fileList,opt){
        opt.fileList = fileList;
    }
};