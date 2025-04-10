const { default: axios } = require("axios");
const redisClient = require("../Redis");
const { parseEmail } = require("../utils/parseBody");
const { parseBatchResponse } = require("../utils/parsing");
const { addToEmailQueue } = require("./emailQueue");
const catchAsync = require("../utils/catAsync");
module.exports.fetchAndPush = catchAsync(
  async (email, nextPageToken, userId) => {
    // fetch the access token
    // console.log("or firs and forget hit first");
    const access_token = await redisClient.get(`accesstoken:${email}`);
    // modify the url based on nextpagetoken
    let GMAIL_URL =
      "https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=10";
    if (nextPageToken != 0) {
      GMAIL_URL = `${GMAIL_URL}&pageToken=${nextPageToken}`;
    }

    // fetch the message id
    const emails = await axios
      .get(GMAIL_URL, {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      .catch((err) => {
        console.log("there is some err");
      });
    let npt = 0;
    if (!emails?.data?.messages) return npt;
    // get the nextpagetoken if there is any
    if (emails?.data?.nextPageToken) npt = emails.data.nextPageToken;
    // create the mime batch request
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
    // request to get the full body
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
    // parse the body
    const parsedMessages = await parseBatchResponse(response.data);
    let finalData = parseEmail(parsedMessages);
    // add the email to the queue
    addToEmailQueue({ emaila: email, allEmails: finalData, userId });

    return npt;
  }
);
