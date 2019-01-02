const redis = require("redis");
const bluebird = require("bluebird");
const config = require('../config/config.js');
const logger = require('../lib/logger');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);


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


redisClient.zrevrange("wsinstances", 0, 0, (err, instances) => {
    global.undertaker = instances[0];
});

const subClient = redis.createClient(config.redis.port, config.redis.host, {
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

subClient.on("error", (err) => {
    logger.error(err);
});

if (config.redis.passwd) {
    subClient.auth(config.redis.passwd);
}


subClient.psubscribe("ws#*", (err) => {
    if (err) {
        logger.error(err)
    }
});


subClient.on("pmessage", (pattern, channel, message) => {
    let json;
    try {
        json = JSON.parse(message);
        const instanceId = channel.split("#")[1];
        if (instanceId) {
            global.undertaker = instanceId;
        }
        switch (json.act) {
            case "sayhello": {
                break;
            }
            default: {
                const fun = "req_" + json.act;
                if (!global.gameServer[fun]) {
                    return;
                }
                global.gameServer[fun](json);
                break;
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
            logger.error("The server refused the connection");
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            logger.error("Retry time exhausted");
        }
        if (options.attempt > 10) {
            logger.error("Retry time exhausted");
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


global.subClient = subClient;
global.pubClient = pubClient;
global.redisClient = redisClient;