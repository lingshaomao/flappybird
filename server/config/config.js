const cluster = require('cluster');
const os = require('os');
const configs = {
	localhost: {
		mongo: "mongodb://127.0.0.1:27017/flayppy",
		ws: {
			port: 4100,
			masterPort: 4101,
			workers: 1,
			brokers: 2,
			brokersPorts: [
				9500,
				9501
			],
		},

		redis: {
			host: "127.0.0.1",//47.52.99.214
			port: 6379,
			passwd: ""
		},
		tronNode: {
			full: "https://api.shasta.trongrid.io",
			solidity: "https://api.shasta.trongrid.io",
			event: "https://api.shasta.trongrid.io/"
		},
		tokenAccount: "TGrLPyorCRygwt2cvv9GuHpbMbwnvcdykE",
		contractAccount: "TGrLPyorCRygwt2cvv9GuHpbMbwnvcdykE"
	}
}
const appCfg = configs["localhost"];
if (cluster.isWorker) {
	appCfg.instanceId = os.hostname() + "_" + cluster.worker.id
}
module.exports = appCfg;