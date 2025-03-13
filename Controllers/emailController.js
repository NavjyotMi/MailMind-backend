const axios = require("axios");
const mimemessage = require("mimemessage");
const { parseBatchResponse } = require("../utils/parsing");
const { parseEmail } = require("../utils/parseBody");
module.exports.getEmails = async function (req, res) {
  const { page } = req.query;

  console.log();
  const access_token = req.headers.cookie;
  const at = access_token.split("=")[1];
  const emails = await axios.get(
    "https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=1",
    {
      headers: { Authorization: `Bearer ${at}` },
    }
  );
  // const readEmail = await emails.json;
  console.log("this is email ", emails.data);
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
  // console.log(body);
  // const email = await axios.get(
  //   `https://www.googleapis.com/gmail/v1/users/me/messages/1955b8e9df7ba25d`,
  //   {
  //     headers: { Authorization: `Bearer ${at}` },
  //   }
  // );
  const response = await axios.post(
    "https://www.googleapis.com/batch/gmail/v1", // Gmail batch endpoint
    body,
    {
      headers: {
        Authorization: `Bearer ${at}`,
        "Content-Type": `multipart/mixed; boundary=${batchboundry}`, // Corrected boundary
      },
    }
  );

  const contentType = response.headers["content-type"];

  // 🔹 Parse the multipart response
  // console.log(response.data);
  const parsedMessages = await parseBatchResponse(response.data);
  console.log("Parsed Messages:", parsedMessages);
  const lets = parseEmail(parsedMessages);
  console.log(lets);

  // const parsedData = parseBatchResponse(response.data);
  // for (const part of parsedData.body) {
  //   console.log("part headers: ", part.header);
  //   console.log("part boyd: ", part.body.toString());
  // }
  // console.log("what the fuck is this", parsedData);
  // const names = response.data.parts.map((ele) => {
  //   const finaldata = JSON.parse(ele.body);
  //   console.log(finaldata);
  // }); // Get raw response as text

  // Extract JSON from the multipart response

  res.json({ name: "i don't know" });
};
