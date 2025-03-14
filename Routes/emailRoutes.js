const { Router } = require("express");
const { getEmails } = require("../Controllers/emailController");
const { authenticateUser } = require("../utils/Authorization");

const route = Router();

route.get("/getmail", authenticateUser, getEmails);

module.exports = route;
