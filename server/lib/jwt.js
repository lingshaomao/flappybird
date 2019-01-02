const jwt = require("jsonwebtoken");
const secret = "0375041884719867d5d0d2b018eaf4241456ba951bb5d5e665927df46c6781e0";

module.exports.sign = (payload) => {
    return jwt.sign(payload, secret, { algorithm: 'HS256', "expiresIn": 60 * 60 * 3 });
};



module.exports.verify = (token) => {
    return new Promise((resolve) => {
        if (!token) {
            return resolve(false);
        }
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                return resolve(false);
            }
            return resolve(decoded.u);
        });
    })
};