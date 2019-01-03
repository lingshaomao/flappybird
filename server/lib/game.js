const logger = require("../lib/logger");
const Rounds = require("../schema/rounds.js").model();

const Statistics = require('../schema/statistics.js').model();
const contractTronHelper = require("../lib/tronHelper").contractTronHelper;

const leaderboard = {
    round_id: 1,
    leaderboardsMap: new Map(),
    leaderboardsArray: [],
};


const getInitConfig = async () => {
    return (await Statistics.findOne({}).lean() || {
        referred_reward_percent: 0.002,
        reward_percent: 0.8,
        reward_sum: 0,
        referred_reward_sum: 0,
        bog_reward_percent: 0.49,
        team_reward_percent: 0.49,
        win_team_reward_percent: 0.2,
        lose_team_reward_percent: 0.1,
        top_1_reward_percent: 0.12,
        top_2_reward_percent: 0.08,
        top_3_reward_percent: 0.06,
        top_4_reward_percent: 0.05,
        top_5_reward_percent: 0.04,
        top_6to10_reward_percent: 0.02,
        top_11to20_reward_percent: 0.015,
        top_21to30_reward_percent: 0.01,
    })
}

const getNextRoundId = async (startTime, endTime, nextTime) => {
    let nextId = 1;
    const current = (await Rounds.find({}).sort({ _id: -1 }).limit(1).lean())[0];
    if (!current) {
        await Rounds.create([{
            round_id: nextId,
            start_time: startTime,
            end_time: endTime,
            next_time: nextTime
        }]);
    } else if (current && !current.ended && current.end_time <= Date.now()) {
        await Rounds.findByIdAndUpdate(current._id, { ended: true });
        nextId = current.round_id + 1;
        await Rounds.create([{
            round_id: nextId,
            start_time: startTime,
            end_time: endTime,
            next_time: nextTime
        }]);
    } else if (current && !current.ended && current.end_time > Date.now()) {
        nextId = current.round_id;
        startTime = current.start_time;
        endTime = current.end_time;
        nextTime = current.next_time;

    } else {
        nextId = current.round_id + 1;
        await Rounds.create([{
            round_id: nextId,
            start_time: startTime,
            end_time: endTime,
            next_time: nextTime
        }]);
    }

    return {
        nextId,
        startTime,
        endTime,
        nextTime
    };

}


const getContractInstance = async () => {
    let contractInstance = await contractTronHelper.tronWeb.contract().at("418e5eede1e6fe86b81b4bd98deec30e1d053e7bce");
    return contractInstance;
}




const updateLeaderboard = async (bird) => {
    const key = bird.username + "#" + bird.bird_type;
    if (bird.round !== leaderboard.round_id) {
        const round = await Rounds.findOne({ round_id: bird.round }).lean();
        if (!round) {
            return;
        }
        leaderboard.round_id = round.round_id;
        leaderboard.leaderboardsMap.clear();

        round.leaderboard.forEach((user) => {
            leaderboard.leaderboardsMap.set(user.username + "#" + user.bird_type, user);
        });
    }
    if (!leaderboard.leaderboardsMap.has(key) || bird.score > leaderboard.leaderboardsMap.get(key).max_score) {
        leaderboard.leaderboardsMap.set(key, {
            username: bird.username,
            max_score: bird.score,
            bird_type: bird.bird_type
        });
        sortLeaderboard();
    }
}


const sortLeaderboard = () => {
    leaderboard.leaderboardsArray = [];
    leaderboard.leaderboardsMap.forEach((value) => {
        leaderboard.leaderboardsArray.push(value);
    })
    leaderboard.leaderboardsArray = leaderboard.leaderboardsArray.sort((a, b) => {
        return b.max_score - a.max_score;
    });
    Rounds.findOneAndUpdate({ round_id: leaderboard.round_id }, { leaderboard: leaderboard.leaderboardsArray }, (err) => {
        err && logger.error(err);
    });
    global.gameServer.broadcast("leaderboard", leaderboard);
}


module.exports = {
    getInitConfig,
    getNextRoundId,
    getContractInstance,
    updateLeaderboard
}