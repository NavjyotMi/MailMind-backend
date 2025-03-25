const express = require("express");
const {
  LoginUser,
  getUser,
  addAccount,
  addAccountRoute,
} = require("../Controllers/authController");
const { authenticateUser } = require("../utils/Authorization");
const routes = express.Router();
routes.get("/google/callback", LoginUser);
routes.get("/userinfo", authenticateUser, getUser);
routes.get("/google/add-account", addAccount);
routes.get("/addaccount", authenticateUser, addAccountRoute);

module.exports = routes;
