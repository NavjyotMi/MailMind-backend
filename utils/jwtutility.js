const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET_KEY;
module.exports.verifytoken = function () {};

module.exports.createJwt = async function (payload) {
  return jwt.sign(payload, secretKey);
};
