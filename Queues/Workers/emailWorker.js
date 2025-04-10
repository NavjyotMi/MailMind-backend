const { Worker } = require("bullmq");
const { GoogleGenAI } = require("@google/genai");
const redisClient = require("../../Redis");
const { getWss, sendToUser } = require("../../websocket");

const emailWorker = new Worker(
  "emailQueue",
  async (job) => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const wss = getWss();

    // console.log(job.data.allEmails);
    const allEmail = job.data.allEmails
      .map(
        (ele) =>
          `id:${ele.id} subject:${ele.subject} snippet:${ele.snippet} labels:${ele.labels}  from: ${ele.from} date: ${ele.date} `
      )
      .join("\n\n");
    // console.log(allEmail);
    const prompt = `You are an AI assistant that categorizes emails based on content.
You must return a valid JSON with this structure:
{
  "emails": [
    {
      "id": "email_id",
      "subject": "Email subject(Required)",
      "snippet": "Short summary",
      "from": "Sender",
      "date": "Date string",
      "labels": "Comma-separated list",
      "category": "Work | Personal | Promotions | Social | Important | Primary"
    }
  ]
}
---
Here is an example:

Input:
[
  {
    "id": "123abc",
    "snippet": "Meeting at 3PM",
    "subject": "Team Meeting",
    "from": "boss@company.com",
    "date": "Mon, 7 Apr 2025 10:31:21 +0000",
    "labels": ["INBOX"]
    "body": body
  }
]

Output:
{
  "emails": [
    {
      "id": "123abc",
      "subject": "Team Meeting",
      "snippet": "Meeting at 3PM",
      "from": "boss@company.com",
      "date": "Mon, 7 Apr 2025 10:31:21 +0000",
      "labels": [labels],
      "category": "Work"
    }
  ]
}
---

Now classify the following:

${JSON.stringify(allEmail, null, 2)}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    const jsonMatch = response.text.match(/```json([\s\S]*?)```/);
    if (!jsonMatch) {
      console.error("Failed to extract JSON from AI response:", response.text);
      return;
    }
    const jsonString = jsonMatch[1].trim();

    try {
      const parsedData = JSON.parse(jsonString);
      const processedEmails = parsedData.emails.map((email) => ({
        snippet: email.snippet,
        subject: email.subject,
        category: email.category,
        from: email.from,
        date: email.date,
        labels: email.labels,
        id: email.id,
      }));

      // console.log("Processed Emails:", processedEmails);
      const key = `emailCategory:${job.data.emaila}`;
      const keyType = await redisClient.type(key);

      if (keyType !== "list" && keyType !== "none") {
        console.error(`Key ${key} is of type ${keyType}, deleting it.`);
        await redisClient.del(key);
      }
      await redisClient.rpush(
        `emailCategory:${job.data.emaila}`,
        ...processedEmails.map((ele) => JSON.stringify(ele))
      );
      await redisClient.expire(`emailCategory:${job.data.emaila}`, 900);
      // console.log("okay the length is ", length);
      sendToUser(job.data.userId, {
        message: "please fetch the email again",
        emailAccount: job.data.emaila,
      });
    } catch (error) {
      console.error("Error parsing JSON:", error.message);
    }
  },
  {
    connection: redisClient.options,
  }
);

module.exports = emailWorker;
