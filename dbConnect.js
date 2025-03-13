const mongoose = require("mongoose");

async function connectDb(params) {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
    console.log("the db is connected");
  } catch (error) {
    console.log(error);
  }
}

module.exports = connectDb;
