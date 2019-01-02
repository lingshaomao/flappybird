const contractTronHelper = require("../lib/tronHelper").contractTronHelper;
const Statistics = require('../schema/statistics.js').model();
const logger = require("../lib/logger");
(async () => {
    const contract_address = (await Statistics.findOne({}).select("contract_address").lean()).contract_address
    let contractInstance = await contractTronHelper.tronWeb.contract().at(contract_address);
    if (!global.pubClient) {
        require('./redis');
    }

    contractInstance["BirdsBought"]().watch(function (err, res) {
        err && logger.error(err);
        res && logger.info(res);

    });
})();


