const mongoose = require("mongoose");

const args = [{
    round_id: {
        type: Number,
        unique: true
    },
    leaderboard: {
        type: [{
            _id: false,
            username: String,
            max_score: Number,
            bird_type: Number,// 0:robot 1:human,
        }],
    },
    ended: {
        type: Boolean,
        default: false
    },
    start_time: {
        type: Number,
    },
    end_time: {
        type: Number,
    },
    next_time: {
        type: Number,
    }
}, {
    timestamps: {
        createdAt: "ctime",
        updatedAt: "utime",
    },
    collection: "rounds"
}];

const schema = new mongoose.Schema(...args);

module.exports = mongoose.models["rounds"] ? mongoose.models["rounds"].schema : schema;

module.exports.args = args;

module.exports.model = function (name = "rounds") {
    if (mongoose.models[name]) {
        return mongoose.model(name, mongoose.models[name].schema);
    }
    return mongoose.model(name, schema);
};