
function parseQueryString (url){
    var obj = {};
    var start = url.indexOf("?")+1;
    var str = url.substr(start);
    var arr = str.split("&");
    for(var i = 0 ;i < arr.length;i++){
        var arr2 = arr[i].split("=");
        obj[arr2[0]] = arr2[1];
    }
    return obj;
};

function dateBoxTimeToIntTime (dateBoxTime){
    var ss = (dateBoxTime.split('-'));
    var y = parseInt(ss[0],10);
    var m = parseInt(ss[1],10);
    var d = parseInt(ss[2],10);

    if (!isNaN(y) && !isNaN(m) && !isNaN(d)){
        return new Date(y,m-1,d).getTime();
    } else {
        return null;
    }
};

function invokeCallback(cb) {
    if (!!cb && typeof cb === 'function') {
        cb.apply(null, Array.prototype.slice.call(arguments, 1));
    }
}

function JSONToExcelConvertor(JSONData, ReportTitle, ShowLabel) {
    //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
    var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;

    var CSV = '';
    //Set Report title in first row or line

    //CSV += ReportTitle + '\r\n\n';

    //This condition will generate the Label/Header
    if (ShowLabel) {
        var row = "";

        //This loop will extract the label from 1st index of on array
        for ( var index in arrData[0]) {

            //Now convert each value to string and comma-seprated
            row += index + ',';
        }

        row = row.slice(0, -1);

        //append Label row with line break
        CSV += row + '\r\n';
    }

    //1st loop is to extract each row
    for (var i = 0; i < arrData.length; i++) {
        var row = "";

        //2nd loop will extract each column and convert it in string comma-seprated
        for ( var index in arrData[i]) {
            row +=  arrData[i][index] + ',';
        }

        row.slice(0, row.length - 1);

        //add a line break after each row
        CSV += row + '\r\n';
    }

    if (CSV == '') {
        alert("Invalid data");
        return;
    }

    //Generate a file name
    var fileName = "";
    //this will remove the blank-spaces from the title and replace it with an underscore
    fileName += ReportTitle.replace(/ /g, "_");

    //Initialize file format you want csv or xls
    var uri = 'data:text/csv;charset=utf-8,' + CSV;
    //var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);
    //var uri = 'data:application/vnd.ms-excel;charset=utf-8,' + CSV;

    // Now the little tricky part.
    // you can use either>> window.open(uri);
    // but this will not work in some browsers
    // or you will not get the correct file extension

    //this trick will generate a temp <a /> tag
    var link = document.createElement("a");
    link.href = encodeURI(uri);

    //set the visibility hidden so it will not effect on your web-layout
    link.style = "visibility:hidden";
    link.download = fileName + " " + Global.utils.formatTime(Date.now()) + ".csv";

    //this part will append the anchor tag and remove it after automatic click
    document.body.appendChild(link);
    link.click();
    //window.open(encodeURI(uri));
    document.body.removeChild(link);
}

function checkIsAllCharOrNumber(str){
    for (var i = 0; i < str.length; ++i){
        var c = str[i];
        if((c>='a'&&c<='z')||(c>='A'&&c<='Z') || (c>='0'&&c<='9')) continue;
        return false;
    }
    return true;
};

function formatTime(time) {
    var str = new Date();
    str.setTime(time);

    var year = str.getFullYear();
    var month = str.getMonth()+1;
    if(month < 10){
        month="0"+month;
    }
    var date = str.getDate();
    if(date < 10){
        date="0"+date;
    }
    var hours = str.getHours();
    if(hours < 10){
        hours="0"+hours;
    }
    var min = str.getMinutes();
    if(min < 10){
        min="0"+min;
    }
    var sec = str.getSeconds();
    if(sec < 10){
        sec="0"+sec;
    }
    return year+"-"+month+"-"+date+" "+hours+":"+min+":"+sec;
};