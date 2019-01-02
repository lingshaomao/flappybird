const request = require("request");
const logger = require("./logger");
const baseUri = require("../config/config").userCenter;

const source = "game";
const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
}


module.exports.login = (username, password) => {

    return new Promise((resolve) => {
        request.post(baseUri + "/user/login", {
            headers,
            form: {
                source,
                username,
                password
            },
            json: true
        }, (err, resp, body) => {
            if (err || !body) {
                logger.error(err || body);
                return resolve({ code: 50001 });
            }
            if (body.code !== 0) {
                return resolve({ code: body.code || 50001 });
            }
            return resolve(body);
        });
    })
};



module.exports.getVerifyCode = (email) => {
    return new Promise((resolve) => {
        request.post(baseUri + "/user/register/verify_code", {
            headers,
            form: {
                source,
                email
            },
            json: true
        }, (err, resp, body) => {
            if (err || !body) {
                logger.error(err || body);
                return resolve({ code: 50001 });
            }
            if (body.code !== 0) {
                logger.error(body);
                return resolve({ code: body.code || 50001 });
            }
            return resolve(body);
        });
    })
};



module.exports.register = (email, verifyCode, password, username) => {
    logger.info({
        source,
        email,
        verify_code: verifyCode,
        password,
        username
    })
    return new Promise((resolve) => {
        request.post(baseUri + "/user/register", {
            headers,
            form: {
                source,
                email,
                verify_code: verifyCode,
                password,
                username
            },
            json: true
        }, (err, resp, body) => {
            if (err || !body) {
                logger.error(err || body);
                return resolve({ code: 50001 });
            }
            if (body.code !== 0) {
                logger.error(body);
                return resolve({ code: body.code || 50001 });
            }
            console.log(body)
            return resolve(body);
        });
    })
};