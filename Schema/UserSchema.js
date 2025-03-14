const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  fname: {
    type: String,
    required: [true, "First name is required"],
    minlength: [3, "At least 3 characters are required"],
    maxlength: [15, "At most 15 characters are allowed"],
  },
  lname: {
    type: String,
    minlength: [3, "At least 3 characters are required"],
    maxlength: [15, "At most 15 characters are allowed"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },
  refreshToken: {
    type: String,
    required: [true, "Refresh token is required"],
    minlength: [15, "At least 15 characters are required for refresh token"],
  },
  picture: {
    type: String,
    required: [true, "image is required"],
  },
  linkedAccounts: [
    {
      email: {
        type: String,
      },
    },
  ],
});

const User = mongoose.model("User", userSchema);
module.exports = User;
