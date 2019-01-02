/* global wss:false, ObjectId: false */

const NodeRSA = require("node-rsa");
const logger = require("../lib/logger");
const contractTronHelper = require("../lib/tronHelper").contractTronHelper;
const tokenTronHelper = require("../lib/tronHelper").tokenTronHelper;
const jwt = require("../lib/jwt");
const birdsCache = require("./cache").birds;
const leaderboardCache = require("./cache").leaderboard;

const updateLeaderboard = require("./cache").updateLeaderboard;
const gameLib = require("../lib/game");

const Users = require("../schema/users").model();
const Statistics = require("../schema/statistics.js").model();
const Buys = require("../schema/buys.js").model();
const Trains = require("../schema/trains").model();
const Rounds = require("../schema/rounds").model();
const Birds = require("../schema/birds").model();

const NOLOGIN = ["login", "checktoken", "price", "buy", "bought", "getleaderboards", "gameinfo"];

const handleReq = async (socket, message) => {
    //encrypt username on brown with public key and decrypt username on server with private key
    const privateKey = socket.privateKey;
    if (!privateKey) {
        return;
    }
    let json, act;
    try {
        const myKey = new NodeRSA(privateKey);
        myKey.setOptions({
            encryptionScheme: "pkcs1"
        });
        // const decrypted = myKey.decrypt(message, "utf8");
        const decrypted = message;
        try {
            json = JSON.parse(decrypted);
        } catch (err) {
            logger.error(err);
            return;
        }
        act = json.act;
    } catch (err) {
        logger.error(err)
        return;
    }

    if (!act) {
        return;
    }

    if (!NOLOGIN.includes(act) && (socket.username !== json.u)) {
        return socket.send("reply", { act, code: 401 });
    }

    switch (act) {
        case "login":
            {
                if (!socket.username) {
                    if (!contractTronHelper.checkLoginToken(json.u, socket.id, json.t)) {
                        return socket.send("reply", {
                            act,
                            code: 40502
                        });
                    }
                    socket.username = json.u;
                }
                const username = json.u;
                Users.findOne({
                    username
                }).lean().then((user) => {
                    if (!user) {
                        Users.create([{
                            username,
                            trx_address: contractTronHelper.tronWeb.address.toHex(username)
                        }]);
                        socket.send("reply", {
                            act,
                            code: 0,
                            data: {
                                t: jwt.sign({
                                    u: socket.username
                                }),
                                r: 0,
                                h: 0,
                                b: 0
                            }
                        });
                        wss.socketsMap.set(username, socket);
                    } else {
                        if (!user.trx_address) {
                            Users.updateOne({
                                username
                            }, {
                                    trx_address: contractTronHelper.tronWeb.address.toHex(username)
                                });
                        }
                        socket.send("reply", {
                            act,
                            code: 0,
                            data: {
                                t: jwt.sign({
                                    u: socket.username
                                }),
                                r: user.robots,
                                h: user.humans,
                                b: +user.bogs.toString()
                            }
                        });
                        wss.socketsMap.set(username, socket);
                    }
                });
                break;
            }

        case "refreshtoken":
            {
                if (!socket.username) {
                    return socket.send("reply", {
                        act,
                        code: 401
                    });
                }
                const username = socket.username;
                const user = await Users.findOne({
                    username
                }).lean();
                if (!user) {
                    return socket.send("reply", {
                        act,
                        code: 40506
                    });
                }
                socket.send("reply", {
                    act,
                    code: 0,
                    data: {
                        t: jwt.sign({
                            u: socket.username
                        }),
                        r: user.robots,
                        h: user.humans,
                        b: +user.bogs.toString()
                    }
                });
                wss.socketsMap.set(username, socket);
                break;
            }

        case "checktoken":
            {
                let username = false;
                if (!socket.username) {
                    username = await jwt.verify(json.t);
                    if (!username) {
                        return socket.send("reply", {
                            act,
                            code: 40502
                        });
                    }
                }
                socket.username = username;
                const user = await Users.findOne({
                    username
                }).lean();
                if (!user) {
                    return socket.send("reply", {
                        act,
                        code: 40506
                    });
                }
                socket.send("reply", {
                    act,
                    code: 0,
                    data: {
                        t: jwt.sign({
                            u: socket.username
                        }),
                        r: user.robots,
                        h: user.humans,
                        b: +user.bogs.toString()
                    }
                });
                wss.socketsMap.set(username, socket);
                break;
            }

        case "price":
            {
                const price = await Statistics.findOne({}).select("robot_price human_price").lean()
                socket.send("reply", {
                    act,
                    code: 0,
                    data: {
                        r: +price.robot_price.toString(),
                        h: +price.human_price.toString()
                    }
                });
                break;
            }
        case "gameinfo":
            {
                const gameInfo = (await Rounds.find({}).sort({ _id: -1 }).limit(1).lean())[0];
                socket.send("reply", {
                    act,
                    code: 0,
                    data: Object.assign({ n: Date.now() }, {
                        i: gameInfo.round_id,
                        s: gameInfo.start_time,
                        e: gameInfo.end_time,
                        ne: gameInfo.next_time,
                        st: Date.now() < gameInfo.end_time ? 1 : 2
                    })
                });
                break;
            }

        case "leaderboards":
            {
                let sort = {

                };
                if (+json.profits === 1 || +json.profits === -1) {
                    sort.profits = +json.profits
                } else if (+json.ath === 1 || +json.ath === -1) {
                    sort.ath = +json.ath
                } else if (+json.atl === 1 || +json.atl === -1) {
                    sort.atl = +json.atl
                }
                break;
            }
        case "buy":
            {
                const buy = new Buys();
                await buy.save();
                socket.send("reply", {
                    act,
                    code: 0,
                    data: {
                        i: String(buy._id)
                    }
                });
                break;
            }

        case "bought":
            {
                const id = json.i;
                let newUser;
                const buy = await Buys.findById(id).lean();
                if (!buy) {
                    return socket.send("reply", {
                        act,
                        code: 40506
                    });
                }

                if (buy.confirmed) {
                    return socket.send("reply", {
                        act,
                        code: 40503
                    });
                }
                if (0 && process.env.NODE_ENV !== "production") {
                    setTimeout(async () => {
                        const username = json.u || socket.username;
                        let robot_amount = 20;
                        let robot_price = 1;
                        let human_amount = 10;
                        let human_price = 10;
                        let coin_amount = robot_amount * robot_price + human_amount * human_price;

                        const update = await Buys.findByIdAndUpdate(id, {
                            robot_amount,
                            robot_price,
                            human_amount,
                            human_price,
                            coin_amount,
                            confirmed: true
                        }, {
                                new: true,
                                select: "confirmed"
                            }).lean();
                        if (!update.confirmed) {
                            return socket.send("reply", {
                                act,
                                code: 50002
                            });
                        }

                        const robotBirds = [];
                        const humanBirds = [];

                        for (let i = 0; i < robot_amount; i++) {
                            robotBirds.push({
                                username,
                                bird_type: 0,
                                buy_id: id
                            })
                        }
                        for (let j = 0; j < human_amount; j++) {
                            humanBirds.push({
                                username,
                                bird_type: 1,
                                buy_id: id
                            })
                        }
                        if (robotBirds.length > 0) {
                            await Birds.create(robotBirds);
                        }

                        if (humanBirds.length > 0) {
                            await Birds.create(humanBirds);
                        }
                        const robots = await Birds.find({
                            username,
                            status: 0,
                            bird_type: 0
                        }).countDocuments();
                        const humans = await Birds.find({
                            username,
                            status: 0,
                            bird_type: 1
                        }).countDocuments();

                        newUser = await Users.findOneAndUpdate({
                            username
                        }, {
                                robots,
                                humans
                            }, {
                                new: true
                            }).lean();
                        socket.send("reply", {
                            act,
                            code: 0,
                            data: {
                                r: newUser.robots,
                                h: newUser.humans
                            }
                        });
                    }, 5000)

                } else {
                    let retry = 0;
                    const intervalId = setInterval(async () => {
                        retry++;
                        if (retry > 10) {
                            logger.error("bought retry > 10, id:" + id)
                            clearInterval(intervalId);
                            socket.send("reply", {
                                act,
                                code: 40504
                            });
                            return;
                        }
                        const getContractInstance = await gameLib.getContractInstance();

                        getContractInstance.getBuy(id).call().then(async (result) => {
                            if (result.hp.toNumber()) {

                                clearInterval(intervalId);


                                const username = contractTronHelper.tronWeb.address.fromHex(result.buyer);
                                let robot_amount = parseInt(result.robotAmount.toNumber());
                                let robot_price = result.rp.toNumber();
                                let human_amount = parseInt(result.humanAmount.toNumber());
                                let human_price = result.hp.toNumber();
                                let coin_amount = robot_amount * robot_price + human_amount * human_price;

                                const update = await Buys.findByIdAndUpdate(id, {
                                    robot_amount,
                                    robot_price,
                                    human_amount,
                                    human_price,
                                    coin_amount,
                                    confirmed: true
                                }, {
                                        new: true,
                                        select: "confirmed"
                                    }).lean();
                                if (!update.confirmed) {
                                    return socket.send("reply", {
                                        act,
                                        code: 50002
                                    });
                                }

                                const robotBirds = [];
                                const humanBirds = [];

                                for (let i = 0; i < robot_amount; i++) {
                                    robotBirds.push({
                                        username,
                                        bird_type: 0,
                                        buy_id: id
                                    })
                                }
                                for (let j = 0; j < human_amount; j++) {
                                    humanBirds.push({
                                        username,
                                        bird_type: 1,
                                        buy_id: id
                                    })
                                }
                                if (robotBirds.length > 0) {
                                    await Birds.create(robotBirds);
                                }

                                if (humanBirds.length > 0) {
                                    await Birds.create(humanBirds);
                                }
                                const robots = await Birds.find({
                                    username,
                                    status: 0,
                                    bird_type: 0
                                }).countDocuments();
                                const humans = await Birds.find({
                                    username,
                                    status: 0,
                                    bird_type: 1
                                }).countDocuments();

                                newUser = await Users.findOneAndUpdate({
                                    username
                                }, {
                                        robots,
                                        humans
                                    }, {
                                        new: true
                                    }).lean();
                                socket.send("reply", {
                                    act,
                                    code: 0,
                                    data: {
                                        r: newUser.robots,
                                        h: newUser.humans
                                    }
                                });
                            }
                        }).catch(err => {
                            logger.error(err);
                        });
                    }, 500)
                }
                break;

            }

        case "startfly":
            {
                const username = json.u;
                const type = +json.t;
                const generation = json.g;
                const amount = +json.a;

                if (!username) {
                    return socket.send("reply", {
                        act,
                        code: 40501
                    })
                }

                if ((type != 0 && type != 1) || amount < 1) {
                    return socket.send("reply", {
                        act,
                        code: 40502
                    })
                }

                const gameInfo = (await Rounds.find({}).select("end_time round_id").sort({ _id: -1 }).limit(1).lean())[0];
                if (Date.now() > gameInfo.end_time) {
                    return socket.send("reply", { act, code: 40507 });
                }

                let birds = await Birds.find({
                    username,
                    bird_type: type,
                    status: 0
                }).select("_id").limit(amount).lean();


                birds = birds.map((bird) => {
                    birdsCache.set(String(bird._id), {
                        username,
                        bird_type: type,
                        generation,
                        round: gameInfo.round_id,
                        pillar: 0,
                        score: 0,
                        flytime: 0
                    });
                    return String(bird._id);
                });

                if (birds.length < amount) {
                    return socket.send("reply", {
                        act,
                        code: 40502,
                        data: {
                            b: birds.length
                        }
                    });
                }

                await Birds.updateMany({
                    _id: {
                        "$in": birds
                    }
                }, {
                        generation: type === 0 ? generation : undefined,
                        round: gameInfo.round_id,
                        status: 1
                    });
                const robots = await Birds.find({
                    username,
                    status: 0,
                    bird_type: 0
                }).countDocuments();
                const humans = await Birds.find({
                    username,
                    status: 0,
                    bird_type: 1
                }).countDocuments();
                const newUser = await Users.findOneAndUpdate({
                    username
                }, {
                        robots,
                        humans
                    }, {
                        new: true
                    }).lean();
                socket.send("reply", {
                    act,
                    code: 0,
                    data: {
                        b: birds,
                        r: newUser.robots,
                        h: newUser.humans
                    }
                });
                break;
            }

        case "uploadscore":
            {
                logger.info("uploadscore:", JSON.stringify(json));
                const score = parseInt(json.sc) || 0;
                const id = json.b;// id of bird
                const flytime = parseInt(json.f);//flight time
                const died = json.d; // if died
                const pillar = parseInt(json.p) || 0;//amount of pillar
                // const speed = json.sp;      //speed for fly

                if (!id || !flytime) {
                    return socket.send("reply", {
                        act,
                        code: 40501
                    })
                }

                if (score > flytime * 70) {
                    return socket.send("reply", {
                        act,
                        code: 40502
                    })
                }
                let birdCache = birdsCache.get(id)
                if (!birdCache) {
                    const bird = await Birds.findById(id).lean();
                    if (!bird && bird.status === 2) {
                        return socket.send("reply", { act, code: 40502 });
                    }
                    birdCache = bird;
                }

                if (!birdCache.start_time && score === 0) {
                    birdCache.start_time = new Date();
                } else if (flytime > (new Date() - birdCache.start_time + 1000 * 5)) {
                    return socket.send("reply", { act, code: 40502 })
                }

                if (birdCache.bird_type === 1 && birdCache.pillar > birdCache.pillar) {
                    tokenTronHelper.sendBogs(birdCache.username, parseInt(pillar - birdCache.pillar));
                }

                if (died) {
                    birdCache.end_time = new Date();
                    birdsCache.delete(id);
                    birdCache.status = 2;
                }

                await Birds.findByIdAndUpdate(id, birdCache);

                birdCache.score = score;
                birdCache.flytime = flytime;
                birdCache.pillar = pillar;

                updateLeaderboard(birdCache);

                socket.send("reply", {
                    act,
                    code: 0,
                    data: {
                        b: birdCache.pillar
                    }
                })
                break;
            }

        case "getleaderboards":
            {
                logger.info("getleaderboards:", JSON.stringify(json));
                console.time("getleaderboards")
                const p = parseInt(json.p) || 1;

                const total = (await Rounds.find({}).select("round_id").sort({
                    _id: -1
                }).limit(1).lean())[0];

                const result = (await Rounds.find({ round_id: total.round_id - (p - 1) }).select("round_id leaderboard").sort({
                    _id: -1
                }).limit(1).lean())[0];


                socket.send("reply", {
                    act,
                    code: 0,
                    data: {
                        r: result,
                        t: total.round_id
                    }
                });
                console.timeEnd("getleaderboards")
                break;
            }

        case "uploadtrains":
            {
                //TODO add user bird trains on database
                logger.info("uploadtrains:", JSON.stringify(json));
                const username = json.u;
                const population = json.p;
                const spanInterval = json.sp;
                const holeSize = json.h;
                const generation = json.gt;
                const score = json.sc;
                const maxScore = json.m;
                const genData = json.gd;

                if (!username || !genData) {
                    return socket.send("reply", {
                        act,
                        code: 40501
                    });
                }
                /* if (Object.prototype.toString.call(username) !== '[object String]' || Object.prototype.toString.call(genData) !== '[object Object]') {
                    return socket.send("reply", { act, code: 40502 });
                } */

                Trains.create([{
                    username: username,
                    population: population,
                    spanInterval: spanInterval,
                    holeSize: holeSize,
                    generation: generation,
                    score: score || 0,
                    maxScore: maxScore || 0,
                    genData: genData
                }], function (err) {
                    if (err) {
                        logger.error(err);
                        return socket.send("reply", {
                            act,
                            code: 40504,
                            msg: err.msg
                        });
                    }

                    socket.send("reply", {
                        act,
                        code: 0
                    });
                });
                break;
            }

        case "gettrains":
            {
                logger.info("gettrains:", JSON.stringify(json));
                const username = json.u;
                const num = Math.min(json.n || 100, 100);

                if (!username) {
                    return socket.send("reply", {
                        act,
                        code: 40501
                    });
                }
                const conditions = {
                    username,
                }
                if (ObjectId.isValid(json.f)) {
                    const startObjectId = ObjectId(json.f);
                    conditions._id = {
                        $lt: startObjectId
                    }
                }

                const result = await Trains.find(conditions).sort({
                    _id: -1
                }).limit(num).lean();
                socket.send("reply", {
                    act,
                    code: 0,
                    data: result
                });
                break;
            }

        case "deltrains":
            {
                logger.info("deltrains:", JSON.stringify(json));
                const username = json.u;
                if (!username || json.i) {
                    return socket.send("reply", {
                        act,
                        code: 40501
                    });
                }
                if (!ObjectId.isValid(json.i)) {
                    return socket.send("reply", {
                        act,
                        code: 40502
                    });
                }
                await Trains.findOneAndDelete({
                    _id: json.i,
                    username
                })
                socket.send("reply", {
                    act,
                    code: 0
                });
                break;
            }

        case "maxscore":
            {
                socket.send("reply", {
                    act,
                    code: 0,
                    data: {
                        r: (leaderboardCache.leaderboardsMap.get(socket.username + "#" + 0) || {}).max_score || 0,
                        h: (leaderboardCache.leaderboardsMap.get(socket.username + "#" + 1) || {}).max_score || 0,
                    }
                });
                break;
            }
    }
}

module.exports = {
    handleReq
};