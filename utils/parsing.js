const parseMultipart = require("parse-multipart");

module.exports.parseBatchResponse = async function (response) {
  // 🔹 Step 1: Extract Boundary from Content-Type Header
  const parts = response.split("--batch"); // Split into sections
  const jsonResponses = [];

  for (const part of parts) {
    if (part.includes("Content-Type: application/json")) {
      const jsonStart = part.indexOf("{");
      const jsonString = part.substring(jsonStart).trim();
      try {
        jsonResponses.push(JSON.parse(jsonString));
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    }
  }

  return jsonResponses;
};
