const eosHelper = require('../lib/eoshelper');
const logger = require('../common/logger');
const eoshelper = new eosHelper();
const getAccountInfo = () => {
    eoshelper.api.rpc.get_account("bogoadmin333").then((result) => {
        let str = "";
        if (result.net_limit.available < 3000) {
            str += `the net for bogoadmin333 is insufficient:${result.net_limit.available}.\n`
        }
        if (result.cpu_limit.available < 20000) {
            str += `the cpu for bogoadmin333 is insufficient:${result.cpu_limit.available}.\n`
        }
        if (result.ram_quota - result.ram_usage < 50000) {
            str += `the ram for bogoadmin333 is insufficient:${result.ram_quota - result.ram_usage}.\n`
        }
        if (parseFloat(result.core_liquid_balance.split(" ")[0]) < 800) {
            str += `the balance for bogoadmin333 is  insufficient:${parseFloat(result.core_liquid_balance.split(" ")[0])}.\n`
        }
        if (str) {
            logger.error(str, 2);
        }
    }).catch((err) => {
        logger.error(err);
    });
}

getAccountInfo();

setInterval(() => {
    getAccountInfo();
}, 1000 * 60 * 10)
