require("dotenv").config();
require("./Queues/Workers/emailWorker");
require("./Queues/Workers/accessTokenWorker");
const express = require("express");
const cors = require("cors");
const http = require("http");
const Routes = require("./Routes/Routes");
const connectDb = require("./dbConnect");
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
server.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
