const mongoose = require("mongoose");

const linkedAccountSchema = mongoose.Schema({
  mainMail: {
    type: String,
    required: [true, "main mail is required"],
  },
  linkedEmail: {
    type: String,
    required: [true, "email is must"],
  },
  refreshToken: {
    type: String,
    required: [true, "refresh token is must"],
  },
  provider: {
    type: String,
    enum: ["google", "outlook", "other"], // Optional: useful if you expand
    default: "google",
  },
});

const LinkedAccount = mongoose.model("LinkedAccount", linkedAccountSchema);

module.exports = LinkedAccount;
