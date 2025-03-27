require("dotenv").config();
const { emailQueue } = require("./Queues/emailQueue");
require("./Queues/Workers/emailWorker");
require("./Queues/Workers/accessTokenWorker");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const Routes = require("./Routes/Routes");
const connectDb = require("./dbConnect");
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(
  cors({
    origin: "http://localhost:5173", // ✅ Allow frontend
    credentials: true, // ✅ Allow cookies
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

connectDb();

// Test adding a job
// async function testJob() {
//   await emailQueue.add("categorized-email", {
//     emailId: "test123",
//     text: "This is a test email",
//   });
//   console.log("✅ Job added to queue!");
// }

// testJob();

app.use("/api/v1", Routes);

app.listen(5000, () => {
  console.log("Server is running");
});
