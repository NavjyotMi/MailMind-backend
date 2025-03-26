const { Worker } = require("bullmq");
const redisClient = require("../../Redis"); // Import shared Redis instance

const emailWorker = new Worker(
  "emailQueue",
  async (job) => {
    console.log("Processing email:", job.data);

    // Simulate AI categorization (Replace this with actual logic)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(`Email ${job.data.emailId} categorized!`);
  },
  {
    connection: redisClient.options, // Use the shared Redis client
  }
);

console.log("Worker is listening for jobs...");
module.exports = emailWorker;
