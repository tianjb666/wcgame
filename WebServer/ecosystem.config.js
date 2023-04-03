module.exports = {
	"apps":[{
        "name": "WebServer",                              // 项目名          
        "script": "./bin/www",                      // 执行文件
        "interpreter_args": "",                     // 传递给解释器的参数
        "watch": [
			"app", 
			"config",
			"app.js"
		],       									// 是否监听文件变动然后重启
        "ignore_watch": [                           // 不用监听的文件
            "node_modules",
            "logs",
			"public"
        ],
		"watch_options": {
			"followSymlinks": false
		},
        "exec_mode": "fork",                     	// 应用启动模式，支持fork和cluster模式
        "instances": 1,                             // 应用启动实例个数，仅在cluster模式有效 默认为fork；或者 max
        "error_file": "./logs/app-err.log",         // 错误日志文件
        "out_file": "./logs/app-out.log",           // 正常日志文件
        "merge_logs": true,                         // 设置追加日志而不是新建日志
        "log_date_format": "YYYY-MM-DD HH:mm:ss"    // 指定日志文件的时间格式
    }]
};