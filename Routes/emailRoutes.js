const { Router } = require("express");
const {
  getEmails,
  getSingleEmail,
  categorizeEmails,
} = require("../Controllers/emailController");
const { authenticateUser } = require("../utils/Authorization");

const route = Router();

route.get("/getmail", authenticateUser, getEmails);
route.get("/email", authenticateUser, getSingleEmail);
route.post("/categorize", authenticateUser, categorizeEmails);

module.exports = route;
