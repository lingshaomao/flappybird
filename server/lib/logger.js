const https = require('https');
const os = require('os');

const errReport = function (stack, level) {
	//调用时请直接传stack，保证错误栈位置
	let token = 'a66f8a31901fb069db52bce6bdbc31df1a2ccd38eb2d82b661488dbe49e5e76b';
	if (process.env.NODE_ENV === "production") {
		token = '467497cf9fbee16717832f3a36193f1c5434d291639c03251cb770df1ebdf36b';
	}

	const data = JSON.stringify({
		msgtype: 'text',
		text: {
			content: 'env: ' + (process.env.NODE_ENV) + '\n'
				+ 'pid: ' + process.pid + '\n'
				+ 'hostname: ' + os.hostname() + '\n'
				+ 'err: ' + stack
		},
		at: {
			isAtAll: level >= 1,
		}
	});
	const options = {
		hostname: 'oapi.dingtalk.com',
		port: 443,
		path: '/robot/send?access_token=' + token,
		method: 'POST',
		headers: {
			'Content-Length': data.length,
			'Content-Type': 'application/json',
		},
	};

	const req = https.request(options, (res) => {
		res.on('error', (err) => {
			console.error(err);
		});
	});
	req.on('error', (e) => {
		console.error(e);
	});
	req.write(data);
	req.end();

};

const logger = {
	info: function () {
		console.log(new Date(), ...arguments)
	},
	error: (msg, level) => {
		console.error(new Date(), msg.stack || msg);
		errReport(msg.stack || msg, level)
	},
	err: function () {
		console.error(new Date(), ...arguments);
	}
};


module.exports = logger;
