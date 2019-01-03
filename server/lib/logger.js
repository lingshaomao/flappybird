const logger = {
	info: function () {
		console.log(new Date(), ...arguments)
	},
	error: (msg, level) => {
		console.error(new Date(), msg.stack || msg)
	},
	err: function () {
		console.error(new Date(), ...arguments);
	}
};


module.exports = logger;
