
process.env.NODE_ENV = "production";
const crypto = require("crypto");
const mongoose = require("mongoose");
const conf = require("../config/config");
mongoose.Promise = global.Promise;
mongoose.connect(conf.mongo, { poolSize: 10, useNewUrlParser: true });


const Seeds = require("../schema/seeds.js").model();

let previous = "0cb6a0262b1261fb24515ba34d41ec161415499f8d60560209f137482c6c7df4";
let salt = "01e67a65d5673f2147f8ad83db62640a0ef6959608b7aae3324fe303e21384c2"


const generateSeedS = async () => {

    for (let i = 0; i < 1000000; i++) {
        const seed = new Seeds();
        seed.previous = previous;
        const result = gameResult(previous);
        seed.hash = result.hash;
        seed.result = result.result;
        await seed.save();
        previous = seed.hash;
        console.log(seed);
    }
}


function gameResult(seed) {
    const nBits = 52;
    const hmac = crypto.createHmac("sha256", salt);
    hmac.update(seed);
    seed = hmac.digest("hex");
    let hash = seed;
    seed = seed.slice(0, nBits / 4);
    const r = parseInt(seed, 16);
    let X = r / Math.pow(2, nBits);
    X = 99 / (1 - X);
    let result = Math.floor(X);
    return {
        hash: hash,
        result: Math.max(1, result / 100)
    }
}

process.on('uncaughtException', (err) => {
    if (err) {
        console.error('stack trace is: ' + err.stack);
    }
});

process.on('unhandledRejection', (err, promise) => {
    if (err) {
        console.error('unhandledRejection:', err);
        console.error('unhandledRejection:', promise);
    }
});

generateSeedS();