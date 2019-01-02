const nodemailer = require("nodemailer");
const config = require("../config/config");
const logger = require("./logger");


function calcGamePayout(ms) {
    if (ms <= 0) {
        return 0;
    }
    let gamePayout = Math.floor(100 * growthFunc(ms)) / 100;
    return gamePayout;
}

function growthFunc(ms) {
    const r = 0.0001;
    return Math.pow(2, r * ms);
}

const sendEmail = (subject, receiver, html) => {

    const transporter = nodemailer.createTransport({
        host: "hwsmtp.exmail.qq.com",
        port: 465,
        secureConnection: true,
        auth: {
            user: config.email.user,
            pass: config.email.pass
        }
    });

    const mailOptions = {
        from: config.email.user,
        to: receiver,
        subject: subject,
        html: html
    };
    transporter.sendMail(mailOptions, (err) => {
        if (err) {
            logger.error(err)
        }
    })
}
const randomStr = (originSource, length) => {
    let source = originSource || "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    let str = "";

    for (let i = 0; i < length; i++) {
        let pos = parseInt((Math.random() * Date.now()) % source.length);
        str += source.substr(pos, 1);
    }
    return str;
}
module.exports = {
    calcGamePayout,
    sendEmail,
    randomStr
}