const axios = require("axios");
const { parseBatchResponse } = require("../utils/parsing");
const { parseEmail } = require("../utils/parseBody");
module.exports.getEmails = async function (req, res) {
  const { page } = req.query;

  console.log();
  const access_token = req.userId;

  const emails = await axios.get(
    "https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=6",
    {
      headers: { Authorization: `Bearer ${access_token}` },
    }
  );
  // const readEmail = await emails.json;
  // console.log("this is email ", emails.data);
  const batchboundry = `batch_boundary`;
  let body = "";
  emails.data.messages.forEach((ele) => {
    body += `--${batchboundry}\r\n`;
    body += `Content-Type: application/http\r\n`; // Added missing \r\n
    body += `\r\n`; // Added blank line between headers and body
    body += `GET /gmail/v1/users/me/messages/${ele.id} HTTP/1.1\r\n`;
    body += `\r\n`; // Added blank line after request
  });

  body += `--${batchboundry}--\r\n`;
  const response = await axios.post(
    "https://www.googleapis.com/batch/gmail/v1", // Gmail batch endpoint
    body,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": `multipart/mixed; boundary=${batchboundry}`, // Corrected boundary
      },
    }
  );
  console.log(response);

  const parsedMessages = await parseBatchResponse(response.data);
  // console.log("Parsed Messages:", parsedMessages);
  const lets = parseEmail(parsedMessages);
  // console.log(lets);

  res.json({ email: lets });
};
