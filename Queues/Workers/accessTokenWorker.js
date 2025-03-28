const { Worker } = require("bullmq");
const redisClient = require("../../Redis");
const LinkedAccount = require("../../Schema/LinkedAccountSchema");
const { decryptedToken } = require("../../utils/tokenSecurity");
const getAccessToken = require("../../utils/refreshToken");
const accessTokenWorker = new Worker(
  "accessTokenQueue",
  async (job) => {
    try {
      let at = await redisClient.get(`accesstoken:${job.data.email}`);
      if (!at) {
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
          await redisClient.set(`accesstoken:${job.data.email}`, access_token);
          await redisClient.expire(`accesstoken:${job.data.email}`, 900);
        } else {
          console.log(`Failed to fetch new access token for ${job.data.email}`);
        }
      }
    } catch (e) {
      console.log("there has been an error to fetch the access toekn");
    }
  },
  {
    connection: redisClient,
  }
);

module.exports = accessTokenWorker;
