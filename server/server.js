const glob = require("glob");
const logger = require("./lib/logger");
const libRule = 'startup/*.js';
const EventEmitter = require('events').EventEmitter;
const event = new EventEmitter();


let PLAYDURATION = 1000 * 60 * 55;
let WAITDURATION = 1000 * 60 * 5;


glob.sync(libRule).forEach((file) => {
    try {
        require("./" + file);
    } catch (e) {
        logger.error(e);
    }
});
const Game = require("./model/game");

const gameServer = new Game(event);
gameServer.play(Date.now(), Date.now() + PLAYDURATION, Date.now() + PLAYDURATION + WAITDURATION);
global.gameServer = gameServer;



event.on("end", (nextTime) => {
    setTimeout(() => {
        global.gameServer.notice("reward", {
            act: "end",
            round_id: global.gameServer.id,
            coin: "trx"
        });


        const gameServer = new Game(event);
        gameServer.play(Date.now(), Date.now() + PLAYDURATION, Date.now() + PLAYDURATION + WAITDURATION);
        global.gameServer = gameServer;


    }, parseInt(nextTime) - Date.now());


});

process.on('uncaughtException', (err) => {
    if (err) {
        logger.error('stack trace is: ' + err.stack);
    }
});

process.on('unhandledRejection', (err, promise) => {
    if (err) {
        logger.error(err);
        logger.error(promise);
    }
});
