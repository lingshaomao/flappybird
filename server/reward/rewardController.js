
const bUnitTest = 0;

/**************************************************************/
require("../startup/mongo");

const eosHelper = require("../lib/eoshelper");
const trxHelper = require("../lib/tronHelper").contractTronHelper;
const logger = require("../lib/logger");
const gameLib = require('../lib/game');
const Users = require("../schema/users").model();
const Rewards = require("../schema/rewards").model();
const Statistics = require("../schema/statistics").model();

/**************************************************************/
class RewardType {
    static get BOG_HOLDER() { return 101; }
    static get LEADERBOARD() { return 102; }
    static get WINNER() { return 103; }
    static get LOSER() { return 104; }
}

class RewardController {
    constructor(isEos, roundId, profitSum, rankList, winnerList, loserList) {
        this.isEos = isEos;
        this.roundId = roundId;
        this.profitSum = profitSum;
        this.rankList = rankList;
        this.winnerList = winnerList;
        this.loserList = loserList;
        this.initParams();
    }

    initParams() {
        this.bogSum = 0.0;
        this.referredRewardSum = 0.0;
    }

    /************************************************************************************/
    run() {
        logger.info("**********************Run reward schedule job**********************");
        this.doReward();
    }

    cancel() {
        logger.info("********************Cancel reward schedule job********************");
    }

    /************************************************************************************/
    async getConf() {
        this.conf = await gameLib.getInitConfig();
        if (!this.conf) {
            logger.err("[CONF] getInitConfig failed");
            return false;
        }
        logger.info("[CONF] referred_reward_percent=" + this.conf.referred_reward_percent);
        logger.info("[CONF] reward_percent=" + this.conf.reward_percent);

        logger.info("[CONF] bog_reward_percent=" + this.conf.bog_reward_percent);
        if (!this.conf.bog_reward_percent) { logger.err("[CONF] bog_reward_percent invalid"); return false; }

        logger.info("[CONF] team_reward_percent=" + this.conf.team_reward_percent);
        if (!this.conf.team_reward_percent) { logger.err("[CONF] team_reward_percent invalid"); return false; }

        logger.info("[CONF] win_team_reward_percent=" + this.conf.win_team_reward_percent);
        if (!this.conf.win_team_reward_percent) { logger.err("[CONF] win_team_reward_percent invalid"); return false; }

        logger.info("[CONF] lose_team_reward_percent=" + this.conf.lose_team_reward_percent);
        if (!this.conf.lose_team_reward_percent) { logger.err("[CONF] lose_team_reward_percent invalid"); return false; }

        logger.info("[CONF] top_1_reward_percent=" + this.conf.top_1_reward_percent);
        if (!this.conf.top_1_reward_percent) { logger.err("[CONF] top_1_reward_percent invalid"); return false; }

        logger.info("[CONF] top_2_reward_percent=" + this.conf.top_2_reward_percent);
        if (!this.conf.top_2_reward_percent) { logger.err("[CONF] top_2_reward_percent invalid"); return false; }

        logger.info("[CONF] top_3_reward_percent=" + this.conf.top_3_reward_percent);
        if (!this.conf.top_3_reward_percent) { logger.err("[CONF] top_3_reward_percent invalid"); return false; }

        logger.info("[CONF] top_4_reward_percent=" + this.conf.top_4_reward_percent);
        if (!this.conf.top_4_reward_percent) { logger.err("[CONF] top_4_reward_percent invalid"); return false; }

        logger.info("[CONF] top_5_reward_percent=" + this.conf.top_5_reward_percent);
        if (!this.conf.top_5_reward_percent) { logger.err("[CONF] top_5_reward_percent invalid"); return false; }

        logger.info("[CONF] top_6to10_reward_percent=" + this.conf.top_6to10_reward_percent);
        if (!this.conf.top_6to10_reward_percent) { logger.err("[CONF] top_6to10_reward_percent invalid"); return false; }

        logger.info("[CONF] top_11to20_reward_percent=" + this.conf.top_11to20_reward_percent);
        if (!this.conf.top_11to20_reward_percent) { logger.err("[CONF] top_11to20_reward_percent invalid"); return false; }

        logger.info("[CONF] top_21to30_reward_percent=" + this.conf.top_21to30_reward_percent);
        if (!this.conf.top_21to30_reward_percent) { logger.err("[CONF] top_21to30_reward_percent invalid"); return false; }

        this.teamProfit = this.profitSum * this.conf.team_reward_percent;
        logger.info("[CONF] teamProfit=" + this.teamProfit, "profitSum=" + this.profitSum, "round=" + this.roundId);
        if (!this.teamProfit || this.teamProfit <= 0) {
            logger.err("[CONF] teamProfit=" + this.teamProfit + " is invalid", "round=" + this.roundId);
            return false;
        }
        return true;
    }

    fixRewardNum(func, rewardNum) {
        let oldNum = rewardNum;
        if (this.isEos)
            rewardNum = oldNum.toFixed(4);
        else 
            rewardNum = parseInt(oldNum);//oldNum.toFixed(0);

        if (!rewardNum || rewardNum <= 0) {
            logger.info(func, "after fixed,RewardNum=" + rewardNum + " is too small,no need reward", "oldNum=" + oldNum, "round=" + this.roundId);
            return null;
        }
        return rewardNum;
    }

    /************************************************************************************/
    async doReward() {
        try {
            var func = "[doReward]";
            logger.info();
            this.initParams();
            if (!(await this.getConf())) return;
            if (this.profitSum <= 0) { logger.err(func, "invalid profitSum=" + profitSum); return; }
            if (this.roundId <= 0) { logger.err(func, "invalid roundId=" + roundId); return; }

            //----------------------------------------------------//
            logger.info(func, "-----------doTeamReward start-----------");
            let result = await this.doTeamReward();
            logger.info(func, "doTeamReward finish, result=" + result);
            if (0 != result) return;

            //----------------------------------------------------//
            logger.info(func, "-----------doBogHolderReward start-----------");
            result = await this.doBogHolderReward();
            logger.info(func, "doBogHolderReward finish, result=" + result);
            if (0 != result) return;

            //----------------------------------------------------//
            // TODO: add if nzj
            // logger.info(func, "-----------doReferredReward start-----------");
            // let userBets = await this.getBets();
            // let referredMap = await this.getReferred(userBets);
            // result = await this.doReferredReward(referredMap);
            // logger.info(func, "doReferredReward finish, result=" + result);
            // if (0 != result) return;

        } catch (e) {
            logger.err(func, 'Caught exception: ' + e);
        }
    }

    /*******************************************************************/
    async getBogHolder() {
        let fucn = "[getBogHolder]";
        try {
            let users = await Users.find({ bogs: { $gt: 0 } }).select("username status bogs trx_address").lean();
            users.forEach(user => {
                this.bogSum += user.bogs;
            });
            return users;

        } catch (e) {
            logger.err(func, 'Caught exception:\n' + e);
            return null;
        }
    }

    calcBogHolderReward(bogHolderList) {
        var func = "[calcBogHolderReward]";
        try {
            if (!bogHolderList) {
                logger.err(func, "bogHolderList is null, nothing to reward");
                return null;
            }
            if (!this.bogSum || this.bogSum <= 0 || !this.profitSum || this.profitSum <= 0) {
                logger.err(func, "this.bogSum:" + this.bogSum, "this.profitSum:" + this.profitSum, " invalid, nothing to reward");
                return null;
            }
            var bogProfit = this.profitSum * this.conf.bog_reward_percent;
            logger.info(func, "bogProfit=" + bogProfit);
            if (!this.bogProfit || this.bogProfit <= 0) {
                logger.err(func, "this.bogProfit:" + this.bogProfit, " invalid, nothing to reward");
                return null;
            }

            var rewardList = [];

            bogHolderList.forEach(val => {
                var num = (val.bogs / this.bogSum) * bogProfit;
                rewardNum = this.fixRewardNum(func, num);
                if (!rewardNum) return null;

                var rewardData = {
                    username: val.username,
                    reward_type: RewardType.BOG_HOLDER,
                    coin_num: rewardNum,
                    desc: "BOG holder reward",
                    round_id: this.roundId,
                    trx_address: val.trx_address,
                };
                rewardList.push(rewardData);
                logger.info(func, "username=" + val.username, "reward type=" + (this.isEos ? "EOS" : "TRX") + ",Num=" + rewardNum, "round=" + this.roundId);
            });
            return rewardList;

        } catch (e) {
            logger.err(func, 'Caught exception:');
            logger.err(func, e);
            return null;
        }
    }

    async doBogHolderReward() {
        var func = "[doBogHolderReward]";
        try {
            var bogHolderList = this.getBogHolder();
            if (!bogHolderList) {
                logger.err(func, "getBogHolder failed, nothing to reward");
                return -1;
            }
            if (bogHolderList.length < 1) {
                logger.err(func, "bogHolderList is empty, nothing to reward");
                return 0;
            }
            var rewardList = this.calcBogHolderReward(bogHolderList);
            if (!rewardList) {
                logger.err(func, "calcBogHolderReward failed, nothing to reward");
                return -1;
            }
            if (rewardList.length < 1) {
                logger.err(func, "rewardList is empty, nothing to reward");
                return 0;
            }

            Rewards.create(rewardList, (err) => {
                if (err) {
                    logger.err(func, "Rewards.create error:", err, "round=" + this.roundId);
                    logger.err(func, JSON.stringify(rewardList));
                    return -1;
                }
                logger.info(func, "Rewards.create succ", "round=" + this.roundId, JSON.stringify(rewardList));
            });

            var result;
            for (let reward of rewardList) {
                if (bUnitTest) { reward.coin_num = 1.0; }
                if (this.isEos)
                    result = await eosHelper.transfer(reward.username, `${reward.coin_num} EOS`, "BOG holder reward");
                else
                    result = await trxHelper.transfer(reward.trx_address, reward.coin_num, "TRX");
                logger.info(func, "transfer to user result:" + JSON.stringify(result), "round=" + this.roundId);
            }
            logger.info(func, "reward succ");
            return 0;

        } catch (e) {
            logger.err(func, 'Caught exception:');
            logger.err(func, e);
            return -1;
        }
    }

    /*******************************************************************/
    sortRankList() {
        this.rankList.sort(function (a, b) {
            return b.max_score - a.max_score;
        });
    }

    calcRankReward(rewardList) {
        let func = "[calcRankReward]";
        try {
            if (!this.rankList || this.rankList.length < 1) {
                logger.err(func, "rankList is empty", "round=" + this.roundId);
                return false;
            }

            var index = 0;
            for (var i = 0; i < this.rankList.length; i++) {
                var rewardNum = 0.0, num = 0.0;
                if (0 == index) {
                    num = this.conf.top_1_reward_percent * this.teamProfit;
                } else if (1 == index) {
                    num = this.conf.top_2_reward_percent * this.teamProfit;
                } else if (2 == index) {
                    num = this.conf.top_3_reward_percent * this.teamProfit;
                } else if (3 == index) {
                    num = this.conf.top_4_reward_percent * this.teamProfit;
                } else if (4 == index) {
                    num = this.conf.top_5_reward_percent * this.teamProfit;
                } else if (5 <= index && index <= 10) {
                    num = this.conf.top_6to10_reward_percent * this.teamProfit;
                } else if (11 <= index && index <= 20) {
                    num = this.conf.top_11to20_reward_percent * this.teamProfit;
                } else if (21 <= index && index <= 30) {
                    num = this.conf.top_21to30_reward_percent * this.teamProfit;
                } else {
                    break;
                }
                ++index;
                rewardNum = this.fixRewardNum(func, num);
                if (!rewardNum) continue;

                var rewardData = {
                    username: this.rankList[i].username,
                    reward_type: RewardType.LEADERBOARD,
                    coin_num: rewardNum,
                    desc: "leaderboard reward",
                    round_id: this.roundId,
                    trx_address: trxHelper.getHexAddress(this.rankList[i].username),
                };
                rewardList.push(rewardData);
                logger.info(func, "username=" + this.rankList[i].username, "reward type=" + (this.isEos ? "EOS" : "TRX") + ",Num=" + rewardNum, "round=" + this.roundId);
            }
            return true;

        } catch (e) {
            logger.err(func, 'Caught exception:');
            logger.err(func, e);
            return false;
        }
    }

    calcWinnerReward(rewardList) {
        let func = "[calcWinnerReward]";
        try {
            if (!this.winnerList || this.winnerList.length < 1) {
                logger.err(func, "winnerList is empty", "round=" + this.roundId);
                return null;
            }

            this.winnerList.forEach(val => {
                var rewardNum = 0.0, num = 0.0;
                num = this.conf.win_team_reward_percent * this.teamProfit / this.winnerList.length;
                rewardNum = this.fixRewardNum(func, num);
                if (!rewardNum) return null;

                var rewardData = {
                    username: val.username,
                    reward_type: RewardType.WINNER,
                    coin_num: rewardNum,
                    desc: "winner reward",
                    round_id: this.roundId,
                    trx_address: trxHelper.getHexAddress(val.username),
                };
                rewardList.push(rewardData);
                logger.info(func, "username=" + val.username, "reward type=" + (this.isEos ? "EOS" : "TRX") + ",Num=" + rewardNum, "round=" + this.roundId);
            });
            return rewardList;

        } catch (e) {
            logger.err(func, 'Caught exception:');
            logger.err(func, e);
            return null;
        }
    }

    calcLoserReward(rewardList) {
        let func = "[calcLoserReward]";
        try {
            if (!this.loserList || this.loserList.length < 1) {
                logger.err(func, "loserList is empty", "round=" + this.roundId);
                return null;
            }

            this.loserList.forEach(val => {
                var rewardNum = 0.0, num = 0.0;
                num = this.conf.lose_team_reward_percent * this.teamProfit / this.loserList.length;
                rewardNum = this.fixRewardNum(func, num);
                if (!rewardNum) return null;

                var rewardData = {
                    username: val.username,
                    reward_type: RewardType.LOSER,
                    coin_num: rewardNum,
                    desc: "loser reward",
                    round_id: this.roundId,
                    trx_address: trxHelper.getHexAddress(val.username),
                };
                rewardList.push(rewardData);
                logger.info(func, "username=" + val.username, "reward type=" + (this.isEos ? "EOS" : "TRX") + ",Num=" + rewardNum, "round=" + this.roundId);
            });
            return rewardList;

        } catch (e) {
            logger.err(func, 'Caught exception:');
            logger.err(func, e);
            return null;
        }
    }

    async doTeamReward() {
        var func = "[doTeamReward]";
        try {
            var rewardList = [];
            this.sortRankList();
            var ret = this.calcRankReward(rewardList);
            if (!ret) {
                logger.err(func, "calcRankReward failed, nothing to reward");
                return -1;
            }
            ret = this.calcWinnerReward(rewardList);
            if (!ret) {
                logger.err(func, "calcWinnerReward failed, nothing to reward");
                return -1;
            }
            ret = this.calcLoserReward(rewardList);
            if (!ret) {
                logger.err(func, "calcLoserReward failed, nothing to reward");
                return -1;
            }
            if (!rewardList || rewardList.length < 1) {
                logger.err(func, "rewardList is empty, nothing to reward");
                return 0;
            }

            Rewards.create(rewardList, (err) => {
                if (err) {
                    logger.err(func, "Rewards.create error:", err, "round=" + this.roundId);
                    logger.err(func, JSON.stringify(rewardList));
                    return -1;
                }
                logger.info(func, "Rewards.create succ", "round=" + this.roundId, JSON.stringify(rewardList));
            });

            var result;
            for (let reward of rewardList) {
                if (bUnitTest) { reward.coin_num = 1.0; }
                if (this.isEos)
                    result = await eosHelper.transfer(reward.username, `${reward.coin_num} EOS`, "BOG holder reward");
                else
                    result = await trxHelper.transfer(reward.trx_address, reward.coin_num, "TRX");
                logger.info(func, "transfer to user result:" + JSON.stringify(result), "round=" + this.roundId);
            }
            logger.info(func, "reward succ");
            return 0;

        } catch (e) {
            logger.err(func, 'Caught exception:');
            logger.err(func, e);
            return -1;
        }
    }

    /*******************************************************************/
    async getBets() {
        let func = "[getBest]";
        try {
            let userBets = await Bets.find({ _id: { $lt: this.endId }, rewarded: false, bet: { $gt: 0 } }).
                select("_id bet profit username tokens rewarded").lean();

            return userBets;

        } catch (e) {
            logger.err(func, 'Caught exception:\n' + e);
            return null;
        }
    }

    async getReferred(userBets) {
        var func = "[getReferred]";
        try {
            if (!userBets) {
                logger.err(func, "paramter is null");
                return null;
            }
            if (userBets.length <= 0) {
                logger.info(func, "userBets is empty, nothing to reward");
                return null;
            }

            var usernameList = [];
            userBets.forEach(bet => {
                usernameList.push(bet.username);
            });

            let referred = await Users.find({ _id: { $lt: this.endId }, username: { $in: usernameList }, referred: { $ne: "", $ne: null } }).
                select("_id username referred").lean();

            logger.info(func, "referred.length=" + referred.length, "userBets.length=" + userBets.length);
            if (referred.length <= 0) {
                logger.info(func, "referred is empty, nothing to reward");
                return null;
            }

            var referredMap = new Map();

            userBets.forEach(bet => {
                referred.forEach(ref => {
                    if (bet.username === ref.username && ref.referred) {
                        var rewardNum = bet.bet * this.conf.referred_reward_percent;
                        //console.log("+++"+rewardNum+"+++"+bet.bet+"+++"+this.conf.referred_reward_percent);
                        this.referredRewardSum += rewardNum;
                        //console.log("+++referredRewardSum="+this.referredRewardSum);
                        this.setReferredMap(referredMap, ref.referred, rewardNum);
                    }
                });
            });

            this.profitSum -= this.referredRewardSum;
            this.profitSum *= this.conf.reward_percent;
            logger.info(func, "referredRewardSum=" + this.referredRewardSum, "profitSum after=" + this.profitSum);

            return referredMap;

        } catch (e) {
            logger.err(func, 'Caught exception:' + e);
            return null;
        }
    }

    setReferredMap(referredMap, referred, rewardNum) {
        try {
            if (referredMap.has(referred)) {
                var num = referredMap.get(referred);
                num += rewardNum;
                referredMap.set(referred, num);
            } else {
                referredMap.set(referred, rewardNum);
            }
        } catch (e) {
            logger.err("[setReferredMap]", 'Caught exception:' + e);
        }
    }

    async doReferredReward(referredMap) {
        let func = "[doReferredReward]";
        try {
            if (null == referredMap || undefined == referredMap) {
                logger.err(func, "paramter is null");
                return 0;
            }
            if (undefined == referredMap.size || referredMap.size <= 0) {
                logger.info(func, "referredMap is empty, nothing to reward");
                return 0;
            }
            logger.info(func, "referredMap.size=" + referredMap.size);

            var rewardList = [];

            for (var [key, val] of referredMap) {
                let oldNum = val;
                val = oldNum.toFixed(4);
                //console.log("+++"+val+"+++"+oldNum);
                if (!val || val <= 0) {
                    logger.info(func, "referred=" + key, "after fixed(4),RewardNum=" + val + " too small,no need reward", "oldNum=" + oldNum);
                    continue;
                }
                var rewardData = {
                    username: key,
                    reward_type: RewardType.REFERRED_SHARING,
                    coin_type: "EOS",
                    coin_num: val,
                    desc: "bets referred reward",
                };
                rewardList.push(rewardData);
                logger.info(func, "username=" + key, "reward type=EOS,Num=" + val);
            }

            Rewards.create(rewardList, (err) => {
                if (err) {
                    logger.err(func, "Rewards.create error:", err);
                    logger.err(func, JSON.stringify(rewardList));
                    return -1;
                }
            });

            for (let reward of rewardList) {
                if (bUnitTest) { reward.coin_num = 0.0001; }
                let result = await eosHelper.transfer(reward.username, `${reward.coin_num} ${reward.coin_type}`, "bets referred reward");
                //let result = await eosHelper.transfer(reward.username, `${reward.coin_num} BOG`, "bets referred reward");
                // let result = await eosHelper.transfer(reward.username, "0.0001 EOS", "bets referred reward");
                logger.info(func, "transfer result:" + JSON.stringify(result));
            }
            logger.info(func, "reward succ");
            return 0;

        } catch (e) {
            logger.err(func, 'Caught exception:' + e);
            return -1;
        }
    }

    incRewardSum() {
        let func = "[setRewardSum]";
        try {
            if (this.profitSum <= 0 && this.referredRewardSum <= 0) {
                logger.err(func, "sum <= 0, no need update");
                return -1;
            }
            this.profitSum = this.profitSum.toFixed(4);
            this.referredRewardSum = this.referredRewardSum.toFixed(4);

            return new Promise((resolve) => {
                Statistics.update({}, {
                    "$inc": {
                        reward_sum: +this.profitSum,
                        referred_reward_sum: +this.referredRewardSum,
                    }
                }, { upsert: true, setDefaultsOnInsert: true }, (err) => {
                    if (err) {
                        logger.err(func, "profitSum=" + this.profitSum, "referredRewardSum=" + this.referredRewardSum, "update error:", err);
                        resolve(-1);
                    }
                    logger.info(func, "profitSum=" + this.profitSum, "referredRewardSum=" + this.referredRewardSum, "update succ");
                    resolve(0);
                });
            });
        } catch (e) {
            logger.err(func, 'Caught exception:');
            logger.err(func, e);
            return -1;
        }
    }
}

module.exports = RewardController;