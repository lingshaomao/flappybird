
const mongoose = require('mongoose');
const config = require('../config/config.js');
mongoose.Promise = global.Promise;
mongoose.connect(config.mongo, { poolSize: 10, useNewUrlParser: true});
global.ObjectId = mongoose.Types.ObjectId;
