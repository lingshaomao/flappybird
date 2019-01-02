const redis = require("redis");
const config = require("../config/config.js");
const logger = require("../lib/logger");
const RewardController = require("./rewardController");

const Statistics = require("../schema/statistics.js").model();
const Rounds = require("../schema/rounds").model();
const Birds = require("../schema/birds").model();



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


subClient.subscribe("reward", (err) => {
    if (err) {
        logger.error(err)
    }
});


subClient.on("message", (channel, message) => {
    let json;
    try {
        json = JSON.parse(message);
        switch (json.act) {
            case "end": {
                handleReward(json);
                break;
            }
        }
    } catch (err) {
        logger.error(err);
        return;
    }
});


const handleReward = async (json) => {
    const round = await Rounds.findOne({ round_id: json.round_id }).lean();
    if (!round || !round.leaderboard.length) {
        return;
    }

    const birdsSum = await Birds.aggregate([{
        $match: {
            round: json.round_id,
        }
    }, {
        $group: {
            _id: "$bird_type",
            sum: { $sum: 1 }
        }
    }]);


    const statistic = await Statistics.findOne({}).lean();


    let robot_price = statistic.robot_price;
    let human_price = statistic.human_price;

    let robot_sum = birdsSum[0]._id === 0 ? birdsSum[0].sum : birdsSum[1].sum;
    let human_sum = birdsSum[0]._id === 1 ? birdsSum[0].sum : birdsSum[1].sum;


    const profitSum = (robot_sum * robot_price) + (human_sum * human_price)


    const winType = round.leaderboard[0].bird_type;
    const winnerList = round.leaderboard.filter((user) => {
        return user.bird_type === winType;

    });
    const loserList = round.leaderboard.filter((user) => {
        return user.bird_type !== winType;
    });
    new RewardController(false, json.round_id, profitSum, round.leaderboard, winnerList, loserList).run();
}