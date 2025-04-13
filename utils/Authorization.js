const { verifytoken } = require("./jwtutility");

module.exports.authenticateUser = function (req, res, next) {
  const access_token = req.headers.cookie;
  console.log(access_token);
  if (!access_token) throw new Error("Access denied");
  const at = access_token.split("=")[1];
  const decoded = verifytoken(at);
  if (!decoded) {
    return res.json({
      message: "access denied",
    });
  }

  req.userId = decoded.access_token;
  req.email = decoded.email;
  next();
};
