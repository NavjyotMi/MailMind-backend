const { Worker } = require("bullmq");
const redisClient = require("../../Redis");
const LinkedAccount = require("../../Schema/LinkedAccountSchema");
const { decryptedToken } = require("../../utils/tokenSecurity");
const getAccessToken = require("../../utils/refreshToken");
const accessTokenWorker = new Worker(
  "accessTokenQueue",
  async (job) => {
    try {
      const user = await LinkedAccount.findOne({
        linkedEmail: job.data.email,
      });
      if (!user) {
        console.log(`User not found for email: ${job.data.email}`);
        return;
      }
      const refreshToken = decryptedToken(user.refreshToken);
      const access_token = await getAccessToken(refreshToken);
      if (access_token) {
        await redisClient.set(
          `accesstoken:${job.data.email}`,
          access_token,
          "EX",
          3600
        );
      } else {
        console.log(`Failed to fetch new access token for ${job.data.email}`);
      }
      console.log(
        "the access token is added to the redis this is from access token worker"
      );
    } catch (e) {
      console.log("there has been an error to fetch the access toekn");
    }
  },
  {
    connection: redisClient,
  }
);

// accessTokenWorker.on("drained", async () => {
//   console.log(
//     "All access token jobs drained. Closing worker to save Redis requests."
//   );
//   await accessTokenWorker.close();
// });

// accessTokenWorker.on("close", (err) => {
//   console.error("Worker closed:", err);
// });

accessTokenWorker.on("error", (err) => {
  console.error("Worker error:", err);
});

module.exports = accessTokenWorker;
