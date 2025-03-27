const axios = require("axios");
// const { GoogleGenAI } = require("@google/genai");
const { parseBatchResponse } = require("../utils/parsing");
const { parseEmail } = require("../utils/parseBody");
// const getAccessToken = require("../utils/refreshToken");
// const { decryptedToken } = require("../utils/tokenSecurity");
// const LinkedAccount = require("../Schema/LinkedAccountSchema");
const redisClient = require("../Redis");
const { addToEmailQueue } = require("../Queues/emailQueue");
// console.log
module.exports.getEmails = async function (req, res) {
  try {
    const { page } = req.query;
    let { email } = req.query;
    const mainEmail = req.email.trim();
    email = decodeURIComponent(email).trim();
    let access_token = req.userId;
    // console.log(access_token);
    let finalData = null;
    if (mainEmail != email) {
      access_token = await redisClient.get(`accesstoken:${email}`);
    }
    const data = await redisClient.lrange(`emailCategory:${email}`, 0, -1);
    // let nextpageToken = null;
    // console.log(data);
    if (data.length === 0 || !data) {
      console.log("are we here");
      const emails = await axios
        .get(
          "https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=10",
          {
            headers: { Authorization: `Bearer ${access_token}` },
          }
        )
        .catch((err) => {
          console.log("there is some err");
        });
      // console.log("this is from get emails ", emails);
      if (emails.nextPageToken) {
        const nextpageToken = emails.nextPageToken;
        console.log(nextpageToken);
        await redisClient.set(`nextPageToken:${email}`, nextpageToken);
        await redisClient.expire(`nextPageToken:${email}`, 900);
      } else {
        console.log("there is no token");
        await redisClient.set(`nextPageToken:${email}`, 0);
        await redisClient.expire(`nextPageToken:${email}`, 900);
      }
      // console.log(nextpageToken);
      const batchboundry = `batch_boundary`;

      let body = "";
      emails?.data?.messages.forEach((ele) => {
        body += `--${batchboundry}\r\n`;
        body += `Content-Type: application/http\r\n`; // Added missing \r\n
        body += `\r\n`; // Added blank line between headers and body
        body += `GET /gmail/v1/users/me/messages/${ele.id} HTTP/1.1\r\n`;
        body += `\r\n`; // Added blank line after request
      });

      body += `--${batchboundry}--\r\n`;
      const response = await axios
        .post(
          "https://www.googleapis.com/batch/gmail/v1", // Gmail batch endpoint
          body,
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
              "Content-Type": `multipart/mixed; boundary=${batchboundry}`, // Corrected boundary
            },
          }
        )
        .catch((err) => {
          console.log("there is some error in batch reqeust");
        });
      // console.log(response);

      const parsedMessages = await parseBatchResponse(response.data);
      finalData = parseEmail(parsedMessages);
      addToEmailQueue({ emaila: email, allEmails: finalData });
    } else {
      const parsedData = data.map(JSON.parse);
      finalData = parsedData;
    }

    res.json({ email: finalData });
  } catch (error) {
    console.log(error);
  }
};

// Getting a single email

module.exports.getSingleEmail = async function (req, res) {
  const { messageid } = req.query;
  messageid = decodeURIComponent(messageid).trim();
  const access_token = req.userId;
  const data = await axios.get(
    `https://www.googleapis.com/gmail/v1/users/me/messages/${messageid}`,
    {
      headers: { Authorization: `Bearer ${access_token}` },
    }
  );
  res.json({
    message: data.data,
  });
};
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

// module.exports.categorizeEmails = async function (req, res) {
//   try {
//     const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
//     const emails = req.body;
//     const allEmail = emails
//       .map(
//         (ele) =>
//           `id:${ele.id} snippet:${ele.snippet} labels:${ele.labels}  from: ${ele.from} date: ${ele.date} body:${ele.body}`
//       )
//       .join("\n\n");
//     const prompt = `You are an AI assistant that categorizes emails based on content. Classify the following emails into one of these categories:
//     - Work
//     - Personal
//     - Promotions
//     - Spam
//     - Social
//     - Important

//     Provide the category along with a short reasoning. and return everything except the body of the email.
//     Return the response as a JSON object with this structure:
//     {
//       "emails": [
//         {"snippet": "Email snippet 1", "category": "Work", "id": "id the the email", labels :"labels of the email", from:"from", date: "date"},
//       ]
//     }
//     Here are the emails:
//      \n${allEmail}`;

//     // console.log("is this comming here");
//     const response = await ai.models.generateContent({
//       model: "gemini-2.0-flash",
//       contents: prompt,
//     });
//     // console.log(response.text);
//   } catch (error) {
//     console.log(error);
//   }
// };

module.exports.categorizeEmails = async function () {
  const emails = [
    { email: "email1", round: 1, nextpageToken: 8099 },
    { email: "email1", round: 1, nextpageToken: 0 },
    { email: "email1", round: 1, nextpageToken: 0 },
  ];
  const totalRound = 5;
  while (emails.length !== 0) {}
};
