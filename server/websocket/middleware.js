const logger = require("../lib/logger");
const handle = require("./handle");
const game = require("../lib/game");
const Rounds = require('../schema/rounds.js').model();

const onPublish = (channel, data) => {
    switch (channel) {
        case "leaderboard": {
            require("./cache").leaderboard = data;
            break;
        }
    }
};
const connection = (socket, req) => {

    socket.on("disconnect", (code, reason) => {
        logger.info("disconnect", code, reason);
    });

    socket.on("error", (err) => {
        logger.error(err, 1);
    });

    socket.on("req", (message) => {
        handle.handleReq(socket, message);
    });

    game.getInitConfig().then(async (initConfig) => {
        const gameInfo = (await Rounds.find({}).sort({ _id: -1 }).limit(1).lean())[0];
        const init = {
            act: "init",
            code: 0,
            data: {
                c: initConfig.contract_address,
                s: socket.id,
                g: Object.assign({ n: Date.now() }, {
                    i: gameInfo.round_id,
                    s: gameInfo.start_time,
                    e: gameInfo.end_time,
                    ne: gameInfo.next_time,
                    st: Date.now() < gameInfo.end_time ? 1 : 2
                })
            }
        }
        socket.send("reply", init);
    })

}


module.exports = {
    connection,
    onPublish
};