const { Queue } = require("bullmq");
const redisClient = require("../Redis");

const accessTokenQueue = new Queue("accessTokenQueue", {
  connection: redisClient,
});

const addAccessTokenQueue = async function (job) {
  await accessTokenQueue.add("fetch-access-token", job);
};
module.exports = { accessTokenQueue, addAccessTokenQueue };
