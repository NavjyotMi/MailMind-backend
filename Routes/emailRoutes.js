const { Router } = require("express");
const {
  getEmails,
  getSingleEmail,
  categorizeEmails,
  checkRedis,
  summarize,
  sentEmails,
  getstrash,
  getspam,
} = require("../Controllers/emailController");
const { authenticateUser } = require("../utils/Authorization");

const route = Router();

route.get("/getmail", authenticateUser, getEmails);
route.post("/email/:id", authenticateUser, getSingleEmail);
route.post("/categorize", authenticateUser, categorizeEmails);
route.get("/size", authenticateUser, checkRedis);
route.post("/summarize", authenticateUser, summarize);
route.get("/sentemail/:id", authenticateUser, sentEmails);
route.get("/trash/:id", authenticateUser, getstrash);
route.get("/spam/:id", authenticateUser, getspam);

module.exports = route;
