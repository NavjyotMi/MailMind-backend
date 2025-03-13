module.exports.parseEmail = function (emailList) {
  return emailList
    .map((email) => {
      if (!email.payload) {
        console.error("Missing payload for email with ID:", email.id);
        return null;
      }

      // Extract headers into a key-value object
      const headers = {};
      if (Array.isArray(email.payload.headers)) {
        email.payload.headers.forEach((header) => {
          headers[header.name] = header.value;
        });
      }

      // Decode body (handling potential nested parts)
      let body = "";
      if (email.payload.body && email.payload.body.data) {
        body = Buffer.from(email.payload.body.data, "base64").toString("utf-8");
      } else {
        console.warn(`No direct body found for email ID: ${email.id}`);
      }

      return {
        id: email.id,
        threadId: email.threadId,
        snippet: email.snippet,
        labels: email.labelIds,
        subject: headers["Subject"] || "No Subject",
        from: headers["From"] || "Unknown Sender",
        to: headers["To"] || "Unknown Recipient",
        date: headers["Date"] || "Unknown Date",
        body: body || "No Content",
      };
    })
    .filter((email) => email !== null);
};
