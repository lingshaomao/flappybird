const mongoose = require("mongoose");

const args = [{
    eos_profits: {
        type: mongoose.Types.Decimal128,
        default: 0
    },
    trx_profits: {
        type: mongoose.Types.Decimal128,
        default: 0
    },
    bogs: {
        type: mongoose.Types.Decimal128,
        default: 0
    },
    players: {
        type: Number,
        default: 0
    },
    birds: {
        type: Number,
        default: 0
    },
    init_jackpot: {
        type: Number,
        default: 1000
    },
    trx_jackpot: {
        type: Number,
        default: 0
    },
    eos_jackpot: {
        type: Number,
        default: 0
    },
    referred_reward_percent: {
        type: Number,
        default: 0.002
    },
    reward_percent: {
        type: Number,
        default: 0.8
    },
    reward_sum: {
        type: Number,
        default: 0
    },
    referred_reward_sum: {
        type: Number,
        default: 0
    },
    contract_address: {
        type: String,
        default: "418e5eede1e6fe86b81b4bd98deec30e1d053e7bce"
    },
    token_contract_address: {
        type: String,
        default: "413dc49a75dcca4f61e2991434bb3cd5f1e7083022"
    },
    robot_price: {
        type: mongoose.Types.Decimal128,
        default: 1
    },
    human_price: {
        type: mongoose.Types.Decimal128,
        default: 10
    },
    //----------------------------------------------------//
    bog_reward_percent: {
        type: Number,
        default: 0.49
    },
    team_reward_percent: {
        type: Number,
        default: 0.49
    },
    win_team_reward_percent: {
        type: Number,
        default: 0.2
    },
    lose_team_reward_percent: {
        type: Number,
        default: 0.1
    },    
    top_1_reward_percent: {
        type: Number,
        default: 0.12
    },
    top_2_reward_percent: {
        type: Number,
        default: 0.08
    },
    top_3_reward_percent: {
        type: Number,
        default: 0.06
    },
    top_4_reward_percent: {
        type: Number,
        default: 0.05
    },
    top_5_reward_percent: {
        type: Number,
        default: 0.04
    },
    top_6to10_reward_percent: {
        type: Number,
        default: 0.02
    },
    top_11to20_reward_percent: {
        type: Number,
        default: 0.015
    },
    top_21to30_reward_percent: {
        type: Number,
        default: 0.01
    },
    //----------------------------------------------------//

}, {
    timestamps: {
        createdAt: false,
        updatedAt: "utime"
    },
    collection: "statistics"
}];

const schema = new mongoose.Schema(...args);

module.exports = mongoose.models["statistics"] ? mongoose.models["statistics"].schema : schema;

module.exports.args = args;

module.exports.model = function (name = "statistics") {
    if (mongoose.models[name]) {
        return mongoose.model(name, mongoose.models[name].schema);
    }
    return mongoose.model(name, schema);
};