const express = require("express");
const { LoginUser, getUser } = require("../Controllers/authController");
const routes = express.Router();

routes.get("/google/callback", LoginUser);
routes.get("/userinfo", getUser);

module.exports = routes;
