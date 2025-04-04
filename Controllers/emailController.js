const axios = require("axios");
const { parseBatchResponse } = require("../utils/parsing");
const { parseEmail } = require("../utils/parseBody");
const redisClient = require("../Redis");
const { addToEmailQueue } = require("../Queues/emailQueue");
const { fetchAndPush } = require("../Queues/fetchAndPush");
// console.log;
module.exports.getEmails = async function (req, res) {
  try {
    const { page } = req.query;
    let { email } = req.query;
    email = decodeURIComponent(email).trim();
    const mainEmail = req.email.trim();
    let access_token = req.userId;
    let finalData = null;
    if (mainEmail != email) {
      access_token = await redisClient.get(`accesstoken:${email}`);
    }

    const data = await redisClient.lrange(`emailCategory:${email}`, 0, -1);
    // if no then this section is for that
    if (data.length === 0 || !data) {
      // fetches the message id
      const emails = await axios
        .get(
          "https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=20",
          {
            headers: { Authorization: `Bearer ${access_token}` },
          }
        )
        .catch((err) => {
          console.log("there is some err");
        });
      if (!emails?.data.messages || emails.data.messages.length === 0) {
        return res.json({ email: [] });
      }
      // if there is next token then we will store it inside the redis
      if (emails.data.nextPageToken) {
        const nextpageToken = emails.data.nextPageToken;
        // console.log(nextpageToken);

        await redisClient.set(`nextPageToken:${email}`, nextpageToken);
        await redisClient.expire(`nextPageToken:${email}`, 900);
      }
      // batch the request
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

      // parse the data
      const parsedMessages = await parseBatchResponse(response?.data);
      finalData = parseEmail(parsedMessages);
      // add the parsed data to emailcategorizatio queue
      addToEmailQueue({ emaila: email, allEmails: finalData });
    } else {
      // if the email is already in the redis then json it
      const parsedData = data.map(JSON.parse);
      finalData = parsedData;
    }

    // send the data
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

module.exports.categorizeEmails = async function (req, res) {
  const emailList = req.body.body.emailList;
  const userId = req.email;
  console.log(emailList);
  console.log(req.body);
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
  console.log("the categorization controller is hit");
  console.log(queue);

  // roundRobin
  while (queue.length > 0) {
    // console.log("Before removal:", queue);
    const { email, round, nextPageToken } = queue.shift();
    // console.log("After removal:", queue);

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
      await redisClient.set(`nextPageToken:${email}`, 0);
      await redisClient.expire(`nextPageToken:${email}`, 300);
    }
  }
  res.json({ message: "Emails categorized successfully" });
};

module.exports.checkRedis = async function (req, res) {
  const email = req.email;

  const size = await redisClient.llen(`emailCategory:${email}`);

  return res.status(200).json({
    size,
  });
};
