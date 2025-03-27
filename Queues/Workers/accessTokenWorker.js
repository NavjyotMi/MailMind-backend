const { Worker } = require("bullmq");
const redisClient = require("../../Redis");
const LinkedAccount = require("../../Schema/LinkedAccountSchema");
const { decryptedToken } = require("../../utils/tokenSecurity");
const getAccessToken = require("../../utils/refreshToken");
const accessTokenWorker = new Worker(
  "accessTokenQueue",
  async (job) => {
    const user = await LinkedAccount.findOne({ linkedEmail: job.data.email });
    const refreshToken = decryptedToken(user.refreshToken);
    const access_token = await getAccessToken(refreshToken);
    await redisClient.set(`accesstoken:${job.data.email}`, access_token);
    await redisClient.expire(`accesstoken:${job.data.email}`, 900);
  },
  {
    connection: redisClient,
  }
);

module.exports = accessTokenWorker;
