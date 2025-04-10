const { Queue } = require("bullmq");
const redisClient = require("../Redis"); // Import shared Redis connection
const catchAsync = require("../utils/catAsync");

const emailQueue = new Queue("emailQueue", {
  connection: redisClient,
});

const addToEmailQueue = catchAsync(async (job) => {
  await emailQueue.add("emailCategorization", job, {
    removeOnComplete: true,
    removeOnFail: true,
  });
  console.log("the categorization job has been added");
});
// const cleanup = async function () {
//   await emailQueue.clean(0, 10000, "waiting");
//   console.log("all jobs cleaned");
// };
// cleanup();
module.exports = { emailQueue, addToEmailQueue };
