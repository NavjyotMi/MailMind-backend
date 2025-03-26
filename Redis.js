const Redis = require("ioredis");

// Create a single shared Redis connection
const redisClient = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redisClient.on("connect", () => console.log("Connected to Redis ✅"));
redisClient.on("error", (err) => console.error("Redis Error ❌", err));

module.exports = redisClient;
