require("dotenv").config();
require("./Queues/Workers/emailWorker");
require("./Queues/Workers/accessTokenWorker");

const http = require("http");
const cors = require("cors");
const express = require("express");
const connectDb = require("./dbConnect");
const Routes = require("./Routes/Routes");
const cookieParser = require("cookie-parser");
const { setupWebSocket } = require("./websocket");

const app = express();
const server = http.createServer(app);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

connectDb();

setupWebSocket(server);
app.use("/api/v1", Routes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});
server.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection: ", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception: ", err);
  process.exit(1);
});
