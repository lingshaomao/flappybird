
process.env.NODE_ENV = "localhost";
const mongoose = require("mongoose");
const conf = require("../config/config");
mongoose.Promise = global.Promise;
mongoose.connect(conf.mongo, { poolSize: 10, useNewUrlParser: true });
global.ObjectId = mongoose.Types.ObjectId;

const Statistics = require("../schema/statistics.js").model();
const Birds = require("../schema/birds.js").model();
const Users = require("../schema/users.js").model();
const Buys = require("../schema/buys.js").model();
const Rounds = require("../schema/rounds.js").model();


const initStatistics = () => {
    Statistics.update({}, {
        token_contract_address: "413dc49a75dcca4f61e2991434bb3cd5f1e7083022"
    }, { upsert: true, setDefaultsOnInsert: true }).catch(err => {
        console.error(err);
    })

    process.on('uncaughtException', (err) => {
        if (err) {
            console.error('stack trace is: ' + err.stack);
        }
    });

    process.on('unhandledRejection', (err, promise) => {
        if (err) {
            console.error('unhandledRejection:', err);
            console.error('unhandledRejection:', promise);
        }
    });
}

initStatistics()


const addBirds = async () => {
    await Birds.remove({ "_id": { "$lte": global.ObjectId("5c26f732662747319871e277") } })

    setInterval(async () => {
        // const buy = new Buys();
        // await buy.save();
        // const id = buy._id;
        // const username = "TMuwpKx7zMS6UkJVQeqSak69yjoS2tEMpd";
        // let robot_amount = 20;
        // let robot_price = 1;
        // let human_amount = 10;
        // let human_price = 10;
        // let coin_amount = robot_amount * robot_price + human_amount * human_price;

        // await Buys.findByIdAndUpdate(id, {
        //     robot_amount,
        //     robot_price,
        //     human_amount,
        //     human_price,
        //     coin_amount,
        //     confirmed: true
        // }, { new: true, select: "confirmed" }).lean();
        // const robotBirds = [];
        // const humanBirds = [];

        // for (let i = 0; i < robot_amount; i++) {
        //     robotBirds.push({
        //         username,
        //         bird_type: 0,
        //         buy_id: id
        //     })
        // }
        // for (let j = 0; j < human_amount; j++) {
        //     humanBirds.push({
        //         username,
        //         bird_type: 1,
        //         buy_id: id
        //     })
        // }
        // if (robotBirds.length > 0) {
        //     await Birds.create(robotBirds);
        // }

        // if (humanBirds.length > 0) {
        //     await Birds.create(humanBirds);
        // }
        // const robots = await Birds.find({ username, status: 0, bird_type: 0 }).count();
        // const humans = await Birds.find({ username, status: 0, bird_type: 1 }).count();
        // //await Birds.remove({ status: 2 })

        // await Users.findOneAndUpdate({ username }, { robots, humans }, { new: true }).lean();
    }, 500)

}
//addBirds();






const test = async (json) => {

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

    let robot_sum = birdsSum[0]._id === 0 ?  birdsSum[0].sum :  birdsSum[1].sum;
    let human_sum = birdsSum[0]._id === 1 ?  birdsSum[0].sum :  birdsSum[1].sum;


    const profitSum = (robot_sum * robot_price) + (human_sum* human_price)


    const winType = round.leaderboard[0].bird_type;
    const winnerList = round.leaderboard.filter((user) => {
        return user.bird_type === winType;

    });
    const loserList = round.leaderboard.filter((user) => {
        return user.bird_type !== winType;
    });



}

// test({
//     round_id:125
// });
process.on('uncaughtException', (err) => {
    if (err) {
        console.error('stack trace is: ' + err.stack);
    }
});

process.on('unhandledRejection', (err, promise) => {
    if (err) {
        console.error('unhandledRejection:', err);
        console.error('unhandledRejection:', promise);
    }
});


