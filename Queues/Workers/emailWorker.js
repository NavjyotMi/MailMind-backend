const { Worker } = require("bullmq");
const { GoogleGenAI } = require("@google/genai");
const redisClient = require("../../Redis");
const { getWss, sendToUser } = require("../../websocket");
console.log;
const emailWorker = new Worker(
  "emailQueue",
  async (job) => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const wss = getWss();
    // console.log("coming from the email worker", job.data.allEmails);
    const allEmail = job.data.allEmails
      .map(
        (ele) =>
          `id:${ele.id} snippet:${ele.snippet} labels:${ele.labels}  from: ${ele.from} date: ${ele.date} body:${ele.body}`
      )
      .join("\n\n");
    const prompt = `You are an AI assistant that categorizes emails based on content. Classify the following emails into one of these categories:
      - Work
      - Personal
      - Promotions
      - Spam
      - Social
      - Important
      - Primary (if no email body is found)
    
    Ensure that every email contains these fields:
    {
      "emails": [
        {
          "snippet": "Email snippet 1",
          "subject": "Extracted subject of the email (must be included)",
          "category": "Work",
          "id": "Email ID",
          "labels": "Labels of the email",
          "from": "Sender of the email",
          "date": "Date of the email"
        }
      ]
    }
    If no email body is found, categorize it as "Primary" and make the subject the subject is there.
    
    Here are the emails:
    \n${allEmail}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    const jsonMatch = response.text.match(/```json([\s\S]*?)```/);
    if (!jsonMatch) {
      console.error("Failed to extract JSON from AI response:", response.text);
      return;
    }
    console.log(
      "this is from emailWorker: the email has been succesfully categorized"
    );
    const jsonString = jsonMatch[1].trim();

    try {
      const parsedData = JSON.parse(jsonString);
      const processedEmails = parsedData.emails.map((email) => ({
        snippet: email.snippet,
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
      const length = await redisClient.rpush(
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
