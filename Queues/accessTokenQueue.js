const { Queue } = require("bullmq");
const redisClient = require("../Redis");

const accessTokenQueue = new Queue("accessTokenQueue", {
  connection: redisClient,
});

const addAccessTokenQueue = async function (job) {
  await accessTokenQueue.add("fetch-access-token", job, {
    removeOnComplete: true,
    removeOnFail: { age: 200 },
  });
  console.log("the access token job is added to the queue");
};
// const cleanup = async function () {
//   await accessTokenQueue.clean(0, 10000, "waiting");
//   console.log("all jobs cleaned");
// };
// cleanup();
module.exports = { accessTokenQueue, addAccessTokenQueue };
