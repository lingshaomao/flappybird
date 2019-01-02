
const gameLib = require("../lib/game");
const logger = require("../lib/logger");

const PLAYING = 1;
const END = 2;

const pubClient = global.pubClient;

class Game {
    constructor(event) {
        this.id;
        this.startTime;
        this.endTime;
        this.nextTime;
        this.status;
        this.event = event;
    }

    async play(startTime, endTime, nextTime) {
        const round = await gameLib.getNextRoundId(startTime, endTime, nextTime);
        this.id = round.nextId
        this.startTime = round.startTime;
        this.endTime = round.endTime;
        this.nextTime = round.nextTime;
        this.status = PLAYING;

        if (this.timeOutId) {
            clearTimeout(this.timeOutId);
        }

        this.timeOutId = setTimeout(() => {
            this.end();
        }, this.endTime - Date.now());
    }

    async end() {
        this.status = END;
        this.event.emit("end", this.nextTime);
    }

    reply(req, reply) {
        const wsInstanceId = req.from;
        reply.act = req.act;
        const pin = req.pin;
        if (!wsInstanceId || !pin) {
            return;
        }
        pubClient.publish(wsInstanceId, JSON.stringify({
            pin,
            reply,
            req,
        }), (err) => {
            if (err) {
                logger.error(err);
            }
        })
    }

    broadcast(channel, data) {
        //logger.info(channel, data);
        pubClient.publish("broadcast", JSON.stringify({
            channel,
            data,
            undertaker: global.undertaker
        }), (err) => {
            if (err) {
                logger.error(err);
            }
        });
    }


    notice(receiver, data) {
        pubClient.publish(receiver, JSON.stringify(data), (err) => {
            if (err) {
                logger.error(err);
            }
        });
    }
}

module.exports = Game;