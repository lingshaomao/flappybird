
/* global wss:false*/
function Worker() {
    global.wss = this.wss;
    const server = this.server;

    wss.socketsMap = new Map();
    require("./pubsub");
    const middleware = require("./middleware");
    wss.setMiddleware("onMessageReceive", middleware.onMessageReceive);
    wss.setMiddleware("onSubscribe", middleware.onSubscribe);
    wss.setMiddleware("onPublish", middleware.onPublish);
    wss.on("connection", (socket, req) => {
        middleware.connection(socket, req);
    });
}

process.on("uncaughtException", (err) => {
    if (err) {
        console.error("stack trace is: ", err.stack);
    }
});

process.on("unhandledRejection", (err, promise) => {
    if (err) {
        console.error("unhandledRejection", err);
        console.error("unhandledRejection", promise);
    }
});

module.exports = Worker;