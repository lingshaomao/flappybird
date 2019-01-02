const mongoose = require("mongoose");

const args = [{
    username: {
        type: String,
        index: true,
    },
    // game params
    population: {
        type: String,
    },
    spanInterval:{
        type: String,
    },
    holeSize: {
        type: String,
    },
    // generation data
    generation: {
        type: String,
    },
    score: {
        type: Number,
        default: 0
    },
    maxScore: {
        type: Number,
        default: 0
    },
    // train data
    genData: {
        gen: [{
            _id: false,
            layers: [{
                _id: false,
                id: Number,
                neurons: [{
                    _id: false,
                    value: mongoose.Types.Decimal128,
                    weights: []
                }]
            }]
        }]
    }
}, {
    timestamps: {
        createdAt: "ctime",
        updatedAt: false
    },
    collection: "trains"
}];

const schema = new mongoose.Schema(...args);

module.exports = mongoose.models["trains"] ? mongoose.models["trains"].schema : schema;

module.exports.args = args;

module.exports.model = function (name = "trains") {
    if (mongoose.models[name]) {
        return mongoose.model(name, mongoose.models[name].schema);
    }
    return mongoose.model(name, schema);
};