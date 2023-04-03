function on_mobile(){
    var ua = navigator.userAgent.toLowerCase();
	if (/mobile/.test(ua)) {return true;} else {return false;}
}
function on_pc(){
    var ua = navigator.userAgent.toLowerCase();
	if (/android|iphone|ipad|ipod|symbianos|windows phone/.test(ua)) {return false;} else {return true;}
}
function on_ios(){
	var ua = navigator.userAgent.toLowerCase();
	if (/iphone|ipad|ipod/.test(ua)) {return true;} else {return false;}
}
function on_android(){
    var ua = navigator.userAgent.toLowerCase();
    if (/android/.test(ua)) {return true;} else {return false;}
}
function on_weixn(){
    var ua = navigator.userAgent.toLowerCase();
	if (/micromessenger/.test(ua)) {return true;} else {return false;}
}
function thousand_num(num,decimal) {
	decimal = decimal !== undefined ? decimal : 0;
	num = Number(num).toFixed(decimal);
    var source = String(num).split(".");
    source[0] = source[0].replace(/\d{1,3}(?=(\d{3})+(\.\d*)?$)/g, '$&,');
    return source.join(".");
}
function hide_part_str(str, first_num, last_num, replace_str){
	first_num = first_num !== undefined ? first_num : 3;
	last_num = last_num !== undefined ? last_num : 4;
	replace_str = replace_str !== undefined ? replace_str : '****';
	return str.substr(0,first_num)+replace_str+str.substr(-last_num,last_num);
}
function is_mobile(mobile){
	return /^13[\d]{9}$|^14[5,7]{1}\d{8}$|^15[^4]{1}\d{8}$|^17[0,6,7,8]{1}\d{8}$|^18[\d]{9}$/.test(mobile);
}
function show_username(username){
	username = username.split('_');
	for(var i = 0;i<username.length;++i){
		if(is_mobile(username[i])){
			username[i] = hide_part_str(username[i]);
		}
	}
	username = username.join('_');
	return username;
}
function show_mobile(mobile){
	return hide_part_str(mobile);
}
function confirmurl(url,message) {
	url = url+'&nl_hash='+nl_hash;
	if(confirm(message)) redirect(url);
}
function go_forward(url,istop){
	istop = istop !== undefined ? istop : true;
	if(url){
		redirect(url,istop);
	}
}
function redirect(url,istop) {
	istop = istop !== undefined ? istop : true;
	if(istop){
		top.location.href = url;
	}else{
		location.href = url;
	}
}
function getUrlParam(name) {
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|)");
	var r = window.location.search.substr(1).match(reg);
	if (r != null) return unescape(r[2]); return '';
}
//滚动条
(function(){
	(":text").addClass('input-text');
})

/**
 * 全选checkbox,注意：标识checkbox id固定为为check_box
 * @param string name 列表check名称,如 uid[]
 */
function selectall(name,check_box) {
	if(check_box===undefined){
		check_box = 'check_box';
	}
	if (("#"+check_box).is(":checked")) {
		("input[name='"+name+"']").each(function() {
  			if(!(this).is(":disabled")){
				(this).prop("checked",true);
			}
		});
	} else {
		("input[name='"+name+"']").each(function() {
			if(!(this).is(":disabled")){
				(this).prop("checked",false);
			}
		});
	}
}
function openwinx(url,name,w,h) {
	if(!w) w=screen.width-4;
	if(!h) h=screen.height-95;
	url = url+'&pc_hash='+pc_hash;
    window.open(url,name,"top=100,left=400,width=" + w + ",height=" + h + ",toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no");
}
//弹出对话框
function omnipotent(id,linkurl,title,close_type,w,h) {
	if(!w) w=700;
	if(!h) h=500;
	art.dialog({id:id,iframe:linkurl, title:title, width:w, height:h, lock:true},
	function(){
		if(close_type==1) {
			art.dialog({id:id}).close()
		} else {
			var d = art.dialog({id:id}).data.iframe;
			var form = d.document.getElementById('dosubmit');form.click();
		}
		return false;
	},
	function(){
			art.dialog({id:id}).close()
	});void(0);
}

function timetostr(time)   {
	var date = new Date(time);
	var y=date.getFullYear();
	var m=date.getMonth()+1;
	var d=date.getDate();
	var h=date.getHours();
	var i=date.getMinutes();
	var s=date.getSeconds();
	y = y>9 ? y : '0'+y;
	m = m>9 ? m : '0'+m;
	d = d>9 ? d : '0'+d;
	h = h>9 ? h : '0'+h;
	i = i>9 ? i : '0'+i;
	s = s>9 ? s : '0'+s;
	return y+"-"+m+"-"+d+" "+h+":"+i+":"+s;
}