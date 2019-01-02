
const redis = require("redis");
const bluebird = require("bluebird");
const logger = require('../lib/logger');
const config = require("../config/config");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

(() => {
    const redisClient = redis.createClient(config.redis.port, config.redis.host, {
        retry_strategy: function (options) {
            if (options.error && options.error.code === 'ECONNREFUSED') {
                logger.error('The server refused the connection');
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
                logger.error('Retry time exhausted');
            }
            if (options.attempt > 10) {
                logger.error('Retry time exhausted');
            }
            return 3000;
        }
    });

    redisClient.on("error", (err) => {
        logger.error(err);
    });
    if (config.redis.passwd) {
        redisClient.auth(config.redis.passwd);
    }
    global.redisClient = redisClient;

    global.redisClient.zadd("wsinstances", Date.now(), config.instanceId, (err) => {
        if (err) {
            logger.error(err);
        }
    });

    const wss = global.wss;
    const subClient = redis.createClient(config.redis.port, config.redis.host, {
        retry_strategy: function (options) {
            if (options.error && options.error.code === 'ECONNREFUSED') {
                console.error('The server refused the connection');
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
                console.error('Retry time exhausted');
            }
            if (options.attempt > 10) {
                console.error('Retry time exhausted');
            }
            return 3000;
        }
    });
    subClient.on("error", (err) => {
        logger.error(err);
    });

    if (config.redis.passwd) {
        subClient.auth(config.redis.passwd);
    }
    subClient.subscribe("broadcast", (err) => {
        if (err) {
            logger.error(err);
        }
    });

    subClient.subscribe(config.instanceId, (err) => {
        console.log(config.instanceId)
        if (err) {
            logger.error(err);
        }
    });

    subClient.on("message", (channel, message) => {
        let json;
        try {
            json = JSON.parse(message);
            if (channel === String(config.instanceId)) {
                if (json.reply && wss.socketsMap.get(json.username)) {
                    wss.socketsMap.get(json.username).send("reply", json.reply);
                } else if (json.notice) {
                    wss.publish(json.username, json.notice);
                }
            } else if (channel === "broadcast") {
                if (config.instanceId === json.undertaker) {
                    wss.publish(json.channel, json.data);
                }
            }
        } catch (err) {
            logger.error(err);
            return;
        }
    });



    const pubClient = redis.createClient(config.redis.port, config.redis.host, {
        retry_strategy: function (options) {
            if (options.error && options.error.code === "ECONNREFUSED") {
                console.error("The server refused the connection");
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
                console.error("Retry time exhausted");
            }
            if (options.attempt > 10) {
                console.error("Retry time exhausted");
            }
            return 3000;
        }
    });

    pubClient.on("error", (err) => {
        logger.error(err);
    });
    if (config.redis.passwd) {
        pubClient.auth(config.redis.passwd);
    }

    global.sendToServer = (pin, msg) => {
        msg.from = config.instanceId;
        msg.pin = pin;
        pubClient.publish("ws#" + config.instanceId, JSON.stringify(msg), (err) => {
            if (err) {
                logger.error(err);
            }
        })
    };

})();

