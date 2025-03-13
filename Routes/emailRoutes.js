const { Router } = require("express");
const { getEmails } = require("../Controllers/emailController");

const route = Router();

route.get("/getmail", getEmails);

module.exports = route;
