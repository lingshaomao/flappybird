const logger = require("../lib/logger");
const pubClient = global.pubClient;
class User {
    constructor(username) {
        this.username = username;
        this.currentBet = {};
        this.nextBet = {};
        this.from;
    }

    placebet(bet, payout) {
        logger.info("=>placebet", this.username, bet, payout);
        try {
            this.currentBet = {
                bet: Number(bet),
                payout: Number(payout),
                profit: 0,
                tokens: 0
            };
        } catch (e) {
            logger.error('Maybe Number.parse error: ', e);
        }
    }
}

module.exports = User;