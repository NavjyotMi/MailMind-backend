/**
 * Email Controller Module
 *
 * This module handles email fetching, categorization, summarization, and single email retrieval using the Gmail API.
 * It leverages Redis for caching, handles email pagination, and uses Gemini AI for summarizing email content.
 *
 * **Key Functions:**
 * 1. **getEmails**: Fetches recent emails, handles pagination, and caches results in Redis.
 * 2. **categorizeEmails**: Categorizes emails with a round-robin approach and batch processing.
 * 3. **summarize**: Summarizes email content using Gemini AI.
 * 4. **getSingleEmail**: Retrieves detailed data for a single email using its message ID.
 * 5. **sentEmails**: Fetches and returns sent emails in batch.
 *
 * **Dependencies:**
 * - `axios`: For HTTP requests to Gmail API.
 * - `redisClient`: For caching email data, tokens, and pagination info.
 * - `GoogleGenAI`: For AI-powered email summarization.
 * - Utility functions (`parseBatchResponse`, `parseSingleEmail`, etc.) for parsing API responses.
 *
 * **Caching & Optimization:**
 * - Redis stores access tokens and email data for improved performance.
 * - Batch processing and pagination ensure efficient email retrieval.
 *
 * **Error Handling:**
 * - Errors are managed using custom `AppError` to provide detailed failure messages.
 */

/**
 * Fetches emails for the user. If email data is cached in Redis, it fetches from there,
 * otherwise it fetches from Gmail API and caches the result.
 * @param {object} req - The request object containing query parameters.
 * @param {object} res - The response object to send the email data back.
 * @throws {AppError} Throws an error if the Gmail API call fails or if email data is missing.
 */

const axios = require("axios");
const redisClient = require("../Redis");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catAsync");
const { GoogleGenAI } = require("@google/genai");
const { parseEmail } = require("../utils/parseBody");
const { fetchAndPush } = require("../Queues/fetchAndPush");
const { parseBatchResponse } = require("../utils/parsing");
const { addToEmailQueue } = require("../Queues/emailQueue");
const { parseSingleEmail } = require("../utils/parseSingleEmail");
const LinkedAccount = require("../Schema/LinkedAccountSchema");
const { decryptedToken } = require("../utils/tokenSecurity");
const getAccessToken = require("../utils/refreshToken");

module.exports.getEmails = catchAsync(async (req, res) => {
  console.log("is get email hit first");
  let { email } = req.query;
  email = decodeURIComponent(email).trim();
  const mainEmail = req.email.trim();
  let access_token = req.userId;
  let finalData = null;
  if (mainEmail != email) {
    let at = await redisClient.get(`accesstoken:${email}`);

    if (!at) {
      const linkedUser = await LinkedAccount.findOne({ linkedEmail: email });
      const decryptedRefreshtoken = decryptedToken(linkedUser.refreshToken);
      at = await getAccessToken(decryptedRefreshtoken);
      console.log(at);
      await redisClient.set(`accesstoken:${email}`, at, "EX", 3600);
    }
    access_token = at;
    // console.log("this is getemail inside mainEmail != email", access_token);
  }
  const data = await redisClient.lrange(`emailCategory:${email}`, 0, -1);

  if (!data || data.length === 0) {
    const emails = await axios
      .get(
        "https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=20",
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      )
      .catch((err) => {
        console.log(err);
        throw new AppError(400, "couldn't fetch the email from gmail");
      });
    if (!emails?.data.messages || emails.data.messages.length === 0) {
      return res.json({ email: [] });
    }
    // if there is next token then we will store it inside the redis

    if (emails.data.nextPageToken) {
      const nextpageToken = emails.data.nextPageToken;

      await redisClient.set(
        `nextPageToken:${email}`,
        nextpageToken,
        "EX",
        3600
      );
    }
    // batch the request
    const batchboundry = `batch_boundary`;

    let body = "";
    emails?.data?.messages.forEach((ele) => {
      body += `--${batchboundry}\r\n`;
      body += `Content-Type: application/http\r\n`;
      body += `\r\n`;
      body += `GET /gmail/v1/users/me/messages/${ele.id} HTTP/1.1\r\n`;
      body += `\r\n`;
    });

    body += `--${batchboundry}--\r\n`;
    const response = await axios.post(
      "https://www.googleapis.com/batch/gmail/v1",
      body,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": `multipart/mixed; boundary=${batchboundry}`,
        },
      }
    );

    if (!response?.data) {
      throw new AppError(400, "Failed to fetch emails from Gmail batch.");
    }

    const parsedMessages = await parseBatchResponse(response?.data);
    finalData = parseEmail(parsedMessages);
    addToEmailQueue({ emaila: email, allEmails: finalData });
  } else {
    const parsedData = data.map(JSON.parse);
    finalData = parsedData;
  }

  res.status(200).json({
    success: true,
    message: "All the email are sent",
    email: finalData,
  });
});

// Getting a single email

module.exports.getSingleEmail = catchAsync(async (req, res) => {
  let { id: messageid } = req.params;

  const { email } = req.body;
  const access_token = await redisClient.get(`accesstoken:${email}`);
  if (!access_token) {
    throw new AppError(400, "Access token not found for the provided email.");
  }
  const data = await axios
    .get(
      `https://www.googleapis.com/gmail/v1/users/${email}/messages/${messageid}`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    )
    .catch((err) => {
      console.log(err);
      throw new AppError(400, `Failed to fetch email with ID: ${messageid}`);
    });

  // console.log(data.data);

  const parsedData = parseSingleEmail(data.data);

  res.status(200).json({
    success: true,
    parsedData,
  });
});
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

module.exports.summarize = catchAsync(async (req, res) => {
  const { email, body } = req.body;
  if (!email || !body) {
    return next(new AppError(400, "Email and body content are required."));
  }
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const prompt = `You are an AI assistant. Summarize the following email clearly and concisely in plain English.

    The email may contain HTML tags, signatures, or long replies. Ignore those and focus only on the main content and intent of the email. 
    Summarize it in 2-3 lines max.
    Email content:
    ${body}`;

  let response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });
  if (
    !response ||
    !response.candidates ||
    !response.candidates[0] ||
    !response.candidates[0].content ||
    !response.candidates[0].content.parts[0]
  ) {
    return next(new AppError(500, "Invalid response from AI service"));
  }
  response = response.candidates[0].content.parts[0];
  res.json({
    response,
  });
});

module.exports.categorizeEmails = catchAsync(async (req, res) => {
  console.log("categorizeEmail endpoint ishit");
  const emailList = req.body.body.emailList;
  const userId = req.email;
  if (!Array.isArray(emailList) || emailList.length === 0) {
    return res
      .status(400)
      .json({ message: "Email list is required and should be an array." });
  }
  let emailArray = [];
  let totalround = 5;
  // constructs the array of object which has email round and nexpagetoken

  for (const element of emailList) {
    const nextPageToken = await redisClient.get(`nextPageToken:${element}`);
    emailArray.push({
      email: element,
      round: nextPageToken ? 1 : 0,
      nextPageToken: nextPageToken || 0,
    });
  }
  const queue = [...emailArray];
  while (queue.length > 0) {
    const { email, round, nextPageToken } = queue.shift();

    const npt = await fetchAndPush(email, nextPageToken, userId);
    const newRound = round + 1;

    // **Skip iteration if no nextPageToken AND rounds are still left**
    if (npt === 0 && newRound < totalround) {
      continue; // Skip adding back to the queue
    }

    // **Re-add email only if there are more rounds OR a valid token**
    if (newRound < totalround && npt !== 0) {
      queue.push({ email, round: newRound, nextPageToken: npt });
    }

    // **If it's the last round, reset the Redis token**
    if (newRound === totalround) {
      await redisClient.set(`nextPageToken:${email}`, 0, "EX", 3600);
    }
  }
  res.json({ success: true, message: "Emails categorized successfully" });
});

module.exports.checkRedis = catchAsync(async (req, res) => {
  const email = req.email;

  const size = await redisClient.llen(`emailCategory:${email}`);

  return res.status(200).json({
    success: true,
    size,
  });
});

module.exports.sentEmails = catchAsync(async (req, res) => {
  const { id } = req.params;

  const access_token = await redisClient.get(`accesstoken:${id}`);

  const data = await axios
    .get(
      `https://www.googleapis.com/gmail/v1/users/${id}/messages?q=label:sent&maxResults=50`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    )
    .catch((err) => {
      console.log(err);
    });

  // console.log(data.data.resultSizeEstimate);
  if (data.data.resultSizeEstimate === 0) {
    return res.json({
      email: [],
    });
  }
  const batchboundry = `batch_boundary`;
  let body = "";
  data?.data?.messages.forEach((ele) => {
    body += `--${batchboundry}\r\n`;
    body += `Content-Type: application/http\r\n`;
    body += `\r\n`;
    body += `GET /gmail/v1/users/me/messages/${ele.id} HTTP/1.1\r\n`;
    body += `\r\n`;
  });
  body += `--${batchboundry}--\r\n`;
  const response = await axios.post(
    "https://www.googleapis.com/batch/gmail/v1",
    body,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": `multipart/mixed; boundary=${batchboundry}`,
      },
    }
  );
  if (response?.status !== 200) {
    throw new AppError(400, "Error in batch request.");
  }
  const parsedMessages = await parseBatchResponse(response?.data);
  finalData = parseEmail(parsedMessages);
  res.json({
    email: finalData,
  });
});

module.exports.getspam = catchAsync(async (req, res) => {
  const { email } = req.body;
  const access_token = await redisClient.get(`accesstoken:${email}`);

  let response = await axios.get(
    `https://www.googleapis.com/gmail/v1/users/${id}/messages?q=label:spam&maxResults=50`,
    {
      headers: { Authorization: `Bearer ${access_token}` },
    }
  );
  const batchboundry = `batch_boundary`;
  let body = "";
  data?.data?.messages.forEach((ele) => {
    body += `--${batchboundry}\r\n`;
    body += `Content-Type: application/http\r\n`;
    body += `\r\n`;
    body += `GET /gmail/v1/users/me/messages/${ele.id} HTTP/1.1\r\n`;
    body += `\r\n`;
  });
  body += `--${batchboundry}--\r\n`;
  response = await axios.post(
    "https://www.googleapis.com/batch/gmail/v1",
    body,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": `multipart/mixed; boundary=${batchboundry}`,
      },
    }
  );
  if (response?.status !== 200) {
    throw new AppError(400, "Error in batch request.");
  }
  const parsedMessages = await parseBatchResponse(response?.data);
  finalData = parseEmail(parsedMessages);
  res.json({
    email: finalData,
  });
});

module.exports.getstrash = catchAsync(async (req, res) => {
  const { email } = req.body;
  const access_token = await redisClient.get(`accesstoken:${email}`);

  let response = await axios.get(
    `https://www.googleapis.com/gmail/v1/users/${id}/messages?q=label:trash&maxResults=50`,
    {
      headers: { Authorization: `Bearer ${access_token}` },
    }
  );
  const batchboundry = `batch_boundary`;
  let body = "";
  data?.data?.messages.forEach((ele) => {
    body += `--${batchboundry}\r\n`;
    body += `Content-Type: application/http\r\n`;
    body += `\r\n`;
    body += `GET /gmail/v1/users/me/messages/${ele.id} HTTP/1.1\r\n`;
    body += `\r\n`;
  });
  body += `--${batchboundry}--\r\n`;
  response = await axios.post(
    "https://www.googleapis.com/batch/gmail/v1",
    body,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": `multipart/mixed; boundary=${batchboundry}`,
      },
    }
  );
  if (response?.status !== 200) {
    throw new AppError(400, "Error in batch request.");
  }
  const parsedMessages = await parseBatchResponse(response?.data);
  finalData = parseEmail(parsedMessages);
  res.json({
    email: finalData,
  });
});
