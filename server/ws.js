const ClusterWS = require("clusterws");
const config = require("./config/config");
const Worker = require("./websocket/work");
const glob = require("glob");
const libRule = 'startup/+(mongo).js';
glob.sync(libRule).forEach((file) => {
    try {
        require("./" + file);
    } catch (e) {
        console.error(e);
    }
});

const Configurations = {
    port: config.ws.port,
    worker: Worker,
    workers: config.ws.workers,
    brokers: config.ws.brokers,
    brokersPorts: config.ws.brokersPorts,
    restartWorkerOnFail: false,
    pingInterval: 3000
}
if (process.env.MASTER === "true") {
    Configurations.horizontalScaleOptions = {
        masterOptions: {
            port: config.ws.masterPort
        },
        brokersUrls: []
    }
}

new ClusterWS(Configurations);

process.on('uncaughtException', (err) => {
    if (err) {
        console.error(err);
    }
});

process.on('unhandledRejection', (err, promise) => {
    if (err) {
        console.error(err, promise);
    }
});