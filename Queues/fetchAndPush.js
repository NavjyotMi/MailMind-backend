const redisClient = require("../Redis");
const { parseEmail } = require("../utils/parseBody");
const { parseBatchResponse } = require("../utils/parsing");

module.exports.fetchAndPush = async function (email) {
  const access_token = await redisClient.get(`accesstoken:${email}`);
  const nextPageToken = await redisClient.get(`nextPageToken:${email}`);

  const emails = await axios
    .get("https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=1", {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    .catch((err) => {
      console.log("there is some err");
    });
  const nextpageToken = emails.nextPageToken;

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
  const parsedMessages = await parseBatchResponse(response.data);
  finalData = parseEmail(parsedMessages);
};
