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
// /api/v1/auth/google/add-account
routes.get("/google/add-account", addAccount);
routes.get("/addAccount", authenticateUser, addAccountRoute);

module.exports = routes;
