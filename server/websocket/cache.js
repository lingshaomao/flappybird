const logger = require("../lib/logger");
const Rounds = require("../schema/rounds.js").model();

const birds = new Map();
const leaderboard = {
    round_id: 1,
    leaderboardsMap: new Map(),
    leaderboardsArray: [],
};

// birdsCache.set(String(bird._id), {
//     username,
//     bird_type: type,
//     generation,
//     round: gameInfo.round_id,
//     pillar: 0,
//     score: 0,
//     flytime: 0,
//     start_time: Date.now(),
//     died_time: Date.now(),
// });

const updateLeaderboard = async (bird) => {
    const key = bird.username + "#" + bird.bird_type;
    if (bird.round !== leaderboard.round_id) {
        const round = await Rounds.findOne({ round_id: bird.round }).lean();
        if (!round) {
            return;
        }
        leaderboard.round_id = round.round_id;
        leaderboard.leaderboardsMap.clear();

        round.leaderboard.forEach((user) => {
            leaderboard.leaderboardsMap.set(user.username + "#" + user.bird_type, user);
        });
    }
    if (!leaderboard.leaderboardsMap.has(key) || bird.score > leaderboard.leaderboardsMap.get(key).max_score) {
        leaderboard.leaderboardsMap.set(key, {
            username: bird.username,
            max_score: bird.score,
            bird_type: bird.bird_type
        });
        sortLeaderboard();
    }
}


const sortLeaderboard = () => {
    leaderboard.leaderboardsArray = [];
    leaderboard.leaderboardsMap.forEach((value) => {
        leaderboard.leaderboardsArray.push(value);
    })
    leaderboard.leaderboardsArray = leaderboard.leaderboardsArray.sort((a, b) => {
        return b.max_score - a.max_score;
    });
    Rounds.findOneAndUpdate({ round_id: leaderboard.round_id }, { leaderboard: leaderboard.leaderboardsArray }, (err) => {
        err && logger.error(err);
    });


}
module.exports = {
    birds,
    leaderboard,
    updateLeaderboard
}