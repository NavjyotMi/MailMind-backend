const { Queue } = require("bullmq");
const redisClient = require("../Redis"); // Import shared Redis connection

const emailQueue = new Queue("emailQueue", {
  connection: redisClient,
});

module.exports = emailQueue;
