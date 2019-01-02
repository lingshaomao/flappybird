const mongoose = require("mongoose");

const args = [{
    username: {
        type: String,
        index: true
    },
    coin_type: {
        type: String,
        default: 'trx'
    },
    coin_amount: {
        type: mongoose.Types.Decimal128,
        default: 0
    },
    robot_amount: {
        type: Number,
        default: 0
    },
    robot_price: {
        type: mongoose.Types.Decimal128,
        default: 1
    },
    human_amount: {
        type: Number,
        default: 0
    },
    human_price: {
        type: mongoose.Types.Decimal128,
        default: 10
    },
    confirmed: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: {
        createdAt: "ctime",
        updatedAt: "utime"
    },
    collection: "buys"
}];

const schema = new mongoose.Schema(...args);

module.exports = mongoose.models["buys"] ? mongoose.models["buys"].schema : schema;

module.exports.args = args;

module.exports.model = function (name = "buys") {
    if (mongoose.models[name]) {
        return mongoose.model(name, mongoose.models[name].schema);
    }
    return mongoose.model(name, schema);
};