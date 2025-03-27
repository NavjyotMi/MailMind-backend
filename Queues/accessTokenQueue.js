const { Queue } = require("bullmq");
const redisClient = require("../Redis");

const accessTokenQueue = new Queue("accessTokenQueue", {
  connection: redisClient,
});

const addAccessTokenQueue = async function (job) {
  console.log(job);
  await accessTokenQueue.add("fetch-access-token", job);
  // console.log("the email is added to the queue");
};
module.exports = { accessTokenQueue, addAccessTokenQueue };
