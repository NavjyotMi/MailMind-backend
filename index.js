require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
// const crypto = require("crypto");
const app = express();
const Routes = require("./Routes/Routes");
const connectDb = require("./dbConnect");

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173", // ✅ Allow frontend
    credentials: true, // ✅ Allow cookies
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

connectDb();
// app.use((req, res, next) => {
//   console.log("Cookies received:", req.cookies);
//   next();
// });
app.use("/api/v1", Routes);

app.listen(5000, () => {
  console.log("Server is running");
});
