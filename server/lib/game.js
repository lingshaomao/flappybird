const Statistics = require('../schema/statistics.js').model();
const Rounds = require('../schema/rounds.js').model();
const contractTronHelper = require("../lib/tronHelper").contractTronHelper;
const getInitConfig = async () => {
    return (await Statistics.findOne({}).lean() || {
        init_jackpot: 1000,
        trx_jackpot: 0,
        eos_jackpot: 0,
        consolation_percent: 0.1,
        max_round_profit_percent: 0.0125,
        max_one_profit_percent: 0.0075,
        referred_reward_percent: 0.002,
        reward_percent: 0.8,
        reward_sum: 0,
        referred_reward_sum: 0,
        contract_address: "41b1c07e921926a2d241ac7cc287df34836759d3e2",
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
    const contract_address = (await Statistics.findOne({}).select("contract_address").lean()).contract_address
    let contractInstance = await contractTronHelper.tronWeb.contract().at(contract_address);
    return contractInstance;
}

module.exports = {
    getInitConfig,
    getNextRoundId,
    getContractInstance
}