const TronWeb = require('tronweb');
const logger = require("./logger");
const config = require("../config/config");

const Users = require("../schema/users").model();

const SUCC = 0;               // succeffully
const INVALID_PARAM = 40501;  // input paramters is invalid
const ERROR = 50001;          // server error

class Response {
    static succ(data) {
        var jsonStr = {
            code: SUCC,
            data,
        }
        return jsonStr;
    }

    static error(error) {
        logger.error(Error("Response Error").stack + '\n\n' + error.stack);
        var jsonStr = {
            code: ERROR,
            msg: error,
        }
        return jsonStr;
    }

    static invalidParams(message) {
        let errMsg = "invalid parameters";
        if (message) errMsg = message;
        var jsonStr = {
            code: INVALID_PARAM,
            msg: errMsg,
        }
        return jsonStr;
    }
}


class TronHelper {

    constructor() {
        const HttpProvider = TronWeb.providers.HttpProvider;
        this.tronWeb = new TronWeb(
            new HttpProvider(config.tronNode.full),
            new HttpProvider(config.tronNode.solidity),
            config.tronNode.event,
            "f5eb24de92cec6672fa5bac8c5e7747904b9f12600a9a07c43c2d40a495f2e28"
        );

        this.tokenContractInstance;
    }

    updateToken(options) {
        this.tronWeb.transactionBuilder.updateToken(options, this.tronWeb.defaultAddress.hex).then(function (result, err) {
            if (err) {
                logger.err("updateToken error:", err);
                return Response.error(err);
            }
            logger.info('updateToken result: \n' + JSON.stringify(result, null, 2), '\n');

            this.tronWeb.trx.sign(result, function (err, signResult) {
                if (err) {
                    logger.err("sign error:", err);
                    return Response.error(err);
                }
                logger.info('sign result: \n' + JSON.stringify(signResult, null, 2), '\n');

                this.tronWeb.trx.broadcast(signResult, {}, function (err, ret) {
                    if (err) {
                        logger.err("broadcast error:", err);
                        return Response.error(err);
                    }
                    logger.info('broadcast result: \n' + JSON.stringify(ret, null, 2), '\n');
                });
            });
        });
    }

    async transfer(to, quantity, tokenID) {
        if ("TRX" == tokenID) {
            return new Promise((resolve) => {
                this.tronWeb.trx.sendTransaction(to, quantity, (err, result) => {
                    if (err) {
                        logger.err("sendTransaction error:" + err, "to=" + to, "quantity=" + quantity, "tokenID=" + tokenID);
                        resolve(Response.error(err));
                        return;
                    }
                    let jsonRet = JSON.stringify(result);
                    logger.info("sendTransaction succ:", "to=" + to, "quantity=" + quantity, "tokenID=" + tokenID, "return=" + jsonRet);
                    resolve(Response.succ(jsonRet));
                });
            });
        } else {
            return new Promise((resolve) => {
                this.tronWeb.trx.sendToken(to, quantity, tokenID, (err, result) => {
                    if (err) {
                        logger.err("sendToken error:" + err, "to=" + to, "quantity=" + quantity, "tokenID=" + tokenID);
                        resolve(Response.error(err));
                        return;
                    }
                    let jsonRet = JSON.stringify(result);
                    logger.info("sendToken succ:", "to=" + to, "quantity=" + quantity, "tokenID=" + tokenID, "return=" + jsonRet);
                    resolve(Response.succ(jsonRet));
                });
            });
        }
    }

    async getAccount(account) {
        return new Promise((resolve) => {
            this.tronWeb.trx.getAccount(account, (err, result) => {
                if (err) {
                    logger.err("getAccount error:" + err, "account=" + account);
                    resolve(Response.error(err));
                    return;
                }
                let jsonRet = JSON.stringify(result);
                logger.info("getAccount succ: ", "account=" + account, "return=" + jsonRet);
                resolve(Response.succ(jsonRet));
            });
        });
    }

    async getBalanceByAccount(account) {
        return new Promise((resolve) => {
            this.tronWeb.trx.getBalance(account, (err, result) => {
                if (err) {
                    logger.err("getBalanceByAccount error:" + err, "account=" + account);
                    resolve(Response.error(err));
                    return;
                }
                let jsonRet = JSON.stringify(result);
                logger.info("getBalanceByAccount succ: ", "account=" + account, "return=" + jsonRet);
                resolve(Response.succ(jsonRet));
            });
        });
    }

    async getBalance() {
        return new Promise((resolve) => {
            this.tronWeb.trx.getBalance((err, result) => {
                if (err) {
                    logger.err("getBalance error:" + err);
                    resolve(Response.error(err));
                    return;
                }
                let jsonRet = JSON.stringify(result);
                logger.info("getBalance succ: ", "return=" + jsonRet);
                resolve(Response.succ(jsonRet));
            });
        });
    }

    async createAccount() {
        return this.tronWeb.createAccount();
    }

    async getTokensIssuedByAddress(address) {
        return new Promise((resolve) => {
            this.tronWeb.trx.getTokensIssuedByAddress(address, (err, tokens) => {
                if (err) {
                    logger.err("getTokensIssuedByAddress error:" + err, "address=" + address);
                    resolve(Response.error(err));
                    return;
                }
                let jsonRet = JSON.stringify(tokens);
                logger.info("getTokensIssuedByAddress succ: ", "address=" + address, "return=" + jsonRet);
                resolve(Response.succ(jsonRet));
            });
        });
    }

    async getTokenFromID(tokenID) {
        return new Promise((resolve) => {
            this.tronWeb.trx.getTokenFromID(tokenID, (err, token) => {
                if (err) {
                    logger.err("getTokenFromID error:" + err, "tokenID=" + tokenID);
                    resolve(Response.error(err));
                    return;
                }
                let jsonRet = JSON.stringify(token);
                logger.info("getTokenFromID succ: ", "tokenID=" + tokenID, "return=" + jsonRet);
                resolve(Response.succ(jsonRet));
            });
        });
    }

    async getBandwidthByAccount(account) {
        return new Promise((resolve) => {
            this.tronWeb.trx.getBandwidth(account, (err, result) => {
                if (err) {
                    logger.err("getBandwidthByAccount error:" + err, "account=" + account);
                    resolve(Response.error(err));
                    return;
                }
                let jsonRet = JSON.stringify(result);
                logger.info("getBandwidthByAccount succ: ", "account=" + account, "return=" + jsonRet);
                resolve(Response.succ(jsonRet));
            });
        });
    }

    async getBandwidth() {
        return new Promise((resolve) => {
            this.tronWeb.trx.getBandwidth((err, result) => {
                if (err) {
                    logger.err("getBandwidth error:" + err);
                    resolve(Response.error(err));
                    return;
                }
                let jsonRet = JSON.stringify(result);
                logger.info("getBandwidth succ: ", "return=" + jsonRet);
                resolve(Response.succ(jsonRet));
            });
        });
    }

    checkLoginToken(username, socketId, loginToken) {
        if (process.env.NODE_ENV !== "production") {
            return true;
        }
        try {
            const hexAddress = this.tronWeb.address.toHex(username);

            const hexAddressBuf = Buffer.from(hexAddress.replace(/^41/, ""), "hex");

            const socketIdBuf = Buffer.from(socketId);
            const allBuf = Buffer.concat([hexAddressBuf, socketIdBuf]);

            const array = this.tronWeb.utils.crypto.SHA256(allBuf);
            return this.tronWeb.utils.bytes.byteArray2hexStr(array).toLowerCase() === loginToken.toLowerCase().replace(/^0x/, "");
        } catch (err) {
            logger.error(err);
            return false;
        }

    }

    async sendBogs(username, values) {
        let receiverAddress = this.tronWeb.address.toHex(username)
        if (!this.tokenContractInstance) {
            this.tokenContractInstance = await this.tronWeb.contract().at("41b50f4250ebc04c6e35ff98c0a28c30fbe899f1f7");
        }

        let args = {
            shouldPollResponse: false,
        }
        this.tokenContractInstance.transfer(receiverAddress, values).send(args).then((result) => {
            this.tokenContractInstance.balanceOf(receiverAddress).call().then((balance) => {
                Users.findOneAndUpdate({ trx_address: receiverAddress, bogs: { "$lt": balance.balance.toNumber() } }, { bogs: balance.balance.toNumber() }, (err) => {
                    if (err) {
                        logger.error(err)
                    }
                })
            }).catch(err => {
                logger.error(err)
            });
        }).catch(err => {
            logger.error(err)
        });
    }

    getHexAddress(username) {
        try {
            let hexAddress = this.tronWeb.address.toHex(username);
            return hexAddress;

        } catch (err) {
            logger.error(err);
            return null;
        }
    }
}


module.exports = {
    tokenTronHelper: new TronHelper(),
    contractTronHelper: new TronHelper()
};

