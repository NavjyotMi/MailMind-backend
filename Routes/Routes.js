const express = require("express");
const authRoute = require("./auth");
const emailRoute = require("./emailRoutes");
const routes = express.Router();

routes.use("/auth", authRoute);
routes.use("/user", emailRoute);

module.exports = routes;
