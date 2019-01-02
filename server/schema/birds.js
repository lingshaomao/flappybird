const mongoose = require("mongoose");

const args = [{
    username: {
        type: String,
        index: true
    },
    bird_type: {
        type: Number,
        default: 0, // 0:robot 1:human,
        index: true,
    },
    buy_id: {
        type: mongoose.Schema.Types.ObjectId,
    },
    generation: {
        type: Number
    },
    score: {
        type: Number,
        default: 0,
    },
    round: {
        type: Number,
        index: true
    },
    status: {
        type: Number, //  0:unused 1:fly 2:died
        default: 0,
        index: true,
    },
    pillars: {
        type: Number, //  pillars
        default: 0,
    },
    flytime: {
        type: Number, //  flytime
        default: 0,
    },
    start_time: {
        type: Date
    },
    died_time: {
        type: Date
    }
}, {
    timestamps: {
        createdAt: "ctime",
        updatedAt: "utime"
    },
    collection: "birds"
}];

const schema = new mongoose.Schema(...args);

module.exports = mongoose.models["birds"] ? mongoose.models["birds"].schema : schema;

module.exports.args = args;

module.exports.model = function (name = "birds") {
    if (mongoose.models[name]) {
        return mongoose.model(name, mongoose.models[name].schema);
    }
    return mongoose.model(name, schema);
};