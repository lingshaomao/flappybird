/**
  { privateKey:
     'xx',
    publicKey:
     '04D69E0087BF3AE1CBA694A1B7D8F9969F1B26065E81A66E4F1D4CE83D49E50B20C8A469E7E462E1518E06FD3719D8E3F3F1CF75AEE5666AC4F3960C94C9486426',
    address:
     { base58: 'TUfxE1ZzNWFtHDrpEjjSW361X845zFqQkN',
       hex: '41CD26FBCBAD1D7037911D035D920E3472C639E994' } } }
 */
const fs = require("fs");
const crypto = require("crypto");
const TronWeb = require('tronweb');
const logger = require("./logger");
const config = require("../config/config");
const tokenContractAddress = require("../websocket/cache").tokenContractAddress;

const Users = require("../schema/users").model();
const Statistics = require("../schema/statistics").model();


/**************************************************************************************************/

function getPrivateKey(account) {
    let key = config.encryptKey;
    let iv = config.encryptIv;
    const crypted = fs.readFileSync(__dirname + "/../config/keys", { encoding: "utf8" });
    let decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    const keys = JSON.parse(decipher.update(crypted, "hex", "utf8") + decipher.final("utf8"));
    return keys[account].privateKey;
}

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

/**************************************************************************************************/
var TOKEN_OPTIONS =
    {
        "name": "BOG",
        "abbreviation": "BOG",
        "description": "BOG",
        "url": "https://luckyburst.bogo.one/",
        "totalSupply": 10000000000,
        "trxRatio": 1, // How much TRX will tokenRatio cost?
        "tokenRatio": 1, // How many tokens will trxRatio afford?
        "saleStart": Date.now() + 60000,
        "saleEnd": Date.now() + 2 * 365 * 24 * 60 * 60 * 1000,
        "freeBandwidth": 0, // The creator's "donated" bandwidth for use by token holders
        "freeBandwidthLimit": 0, // Out of totalFreeBandwidth, the amount each token holder get
        "frozenAmount": 1,
        "frozenDuration": 2
    };

class TronHelper {

    constructor(account) {
        const HttpProvider = TronWeb.providers.HttpProvider;
        this.tronWeb = new TronWeb(
            new HttpProvider(config.tronNode.full),
            new HttpProvider(config.tronNode.solidity),
            config.tronNode.event,
            getPrivateKey(account)
        );

        this.tokenContractInstance;
    }
    createToken() {
        this.tronWeb.transactionBuilder.createToken(options = TOKEN_OPTIONS, this.tronWeb.defaultAddress.hex).then(function (result, err) {
            if (err) {
                logger.err("createToken error:", err);
                return Response.error(err);
            }
            logger.info('createToken result: \n' + JSON.stringify(result, null, 2), '\n');

            this.tronWeb.trx.sign(transaction = result, function (err, signResult) {
                if (err) {
                    logger.err("sign error:", err);
                    return Response.error(err);
                }
                logger.info('sign result: \n' + JSON.stringify(signResult, null, 2), '\n');

                this.tronWeb.trx.broadcast(signedTransaction = signResult, {}, function (err, ret) {
                    if (err) {
                        logger.err("broadcast error:", err);
                        return Response.error(err);
                    }
                    logger.info('broadcast result: \n' + JSON.stringify(ret, null, 2), '\n');
                });
            });
        });
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
        try {
            const hexAddress = this.tronWeb.address.toHex(username);

            const hexAddressBuf = Buffer.from(hexAddress.replace(/^41/, ""), "hex");
            const saltBuf = Buffer.alloc(10);
            for (let i = 0; i < hexAddressBuf.length; i++) {
                if (i % 2 === 0) {
                    saltBuf[parseInt(i / 2)] = hexAddressBuf[i];
                }
            }

            const socketIdBuf = Buffer.from(socketId);
            const allBuf = Buffer.concat([saltBuf, hexAddressBuf, socketIdBuf]);

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
            const statistics = (await Statistics.findOne({}).select("token_contract_address").lean());
            let tokenContractAddress = statistics.token_contract_address;
            this.tokenContractInstance = await this.tronWeb.contract().at(tokenContractAddress);
        }

        let args = {
            shouldPollResponse: true,
        }
        this.tokenContractInstance.transfer(receiverAddress, values).send(args).then((result) => {
            logger.info("sendBogs", result);
            this.tokenContractInstance.balanceOf(receiverAddress).call().then((balance) => {
                Users.findOneAndUpdate({ trx_address: receiverAddress, bogs: { "$gt": balance.balance.toNumber() } }, { bogs: balance.balance.toNumber() }, (err) => {
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

async function unitTest() {
    //const tokenTronHelper = new TronHelper(config.tokenAccount);
    const tokenTronHelper = new TronHelper(config.contractAccount);

    // let result = await tokenTronHelper.transfer('TYgi6pLggdmEZE1peZdi18YtbNT75jJxjb', 50, '1000018');
    // console.log(result);

    let result0 = await tokenTronHelper.transfer('TYgi6pLggdmEZE1peZdi18YtbNT75jJxjb', 15, 'TRX');
    console.log(result0);

    // let result1 = await tokenTronHelper.getAccount('41CD26FBCBAD1D7037911D035D920E3472C639E994');
    // console.log(result1);

    // let result2 = await tokenTronHelper.getBalanceByAccount('41CD26FBCBAD1D7037911D035D920E3472C639E994');
    // console.log(result2);

    // result2 = await tokenTronHelper.getBalance();
    // console.log(result2);

    // let result3 = await tokenTronHelper.createAccount();
    // console.log(result3);

    // let result4 = await tokenTronHelper.getTokensIssuedByAddress('TUfxE1ZzNWFtHDrpEjjSW361X845zFqQkN');
    // console.log(result4);

    // let result5 = await tokenTronHelper.getTokenFromID('shao');
    // console.log(result5);

    // let result6 = await tokenTronHelper.getBandwidthByAccount('41CD26FBCBAD1D7037911D035D920E3472C639E994');
    // console.log(result6);

    // result6 = await tokenTronHelper.getBandwidth();
    // console.log(result6);

    // var option = {
    //     "description": "slagga",
    //     "url": "http://www.slagga.top/",
    //     "frozenAmount": 1,
    //     "frozenDuration": 2
    // }
    // let result7 = await tokenTronHelper.updateToken(option);
    // console.log(result7);

}
// unitTest();

module.exports = {
    tokenTronHelper: new TronHelper(config.tokenAccount),
    contractTronHelper: new TronHelper(config.contractAccount)
};

