const CryptoJS = require("crypto-js");
const secretKey = process.env.ENCRYPTION_KEY;
module.exports.encryptedToken = function (refreshToken) {
  return CryptoJS.AES.encrypt(refreshToken, secretKey).toString();
};

module.exports.decryptedToken = function (encryptedToken) {
  return CryptoJS.AES.decrypt(encryptedToken, secretKey).toString(
    CryptoJS.enc.Utf8
  );
};
