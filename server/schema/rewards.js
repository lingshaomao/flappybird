const mongoose = require("mongoose");

const args = [{
    username: {
        type: String
    },
    reward_type: {
        type: Number,
        default: 0
    },
    coin_type: {
        type: String
    },
    coin_num: {
        type: Number,
        default: 0
    },
    desc: {
        type: String
    },
    round_id: {
        type: Number,
    }
}, {
    collection: "rewards"
}];

const schema = new mongoose.Schema(...args);

module.exports = mongoose.models["rewards"] ? mongoose.models["rewards"].schema : schema;

module.exports.args = args;

module.exports.model = function (name = "rewards") {
    if (mongoose.models[name]) {
        return mongoose.model(name, mongoose.models[name].schema);
    }
    return mongoose.model(name, schema);
};