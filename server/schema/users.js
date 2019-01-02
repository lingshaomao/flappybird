const mongoose = require("mongoose");

const args = [{
    username: {
        type: String,
        unique: true
    },
    referred: {
        type: String,
        index: true
    },
    status: {
        type: Number,
        default: 0
    },
    bogs: {
        type: mongoose.Types.Decimal128,
        default: 0
    },
    max_score: {
        type: Number,
        default: 0
    },
    trx_address: {
        type: String,
        unique: true
    },
    robots: {
        type: Number,
        default: 0
    },
    humans: {
        type: Number,
        default: 0
    },
}, {
    timestamps: {
        createdAt: "ctime",
        updatedAt: false
    },
    collection: "users"
}];

const schema = new mongoose.Schema(...args);

module.exports = mongoose.models["users"] ? mongoose.models["users"].schema : schema;

module.exports.args = args;

module.exports.model = function (name = "users") {
    if (mongoose.models[name]) {
        return mongoose.model(name, mongoose.models[name].schema);
    }
    return mongoose.model(name, schema);
};