/**
 * Created by 52835 on 2017/7/18.
 */
$(document).ready(function(){
    let parameter = parseQueryString(window.location.href);
    window.open("/gm-tools/html/other/welcome.html?nickname=" + parameter.nickname + '&permission=' + parameter.permission, "frm_main_content");
});