module.exports.parseSingleEmail = (email) => {
  const headers = {};
  if (Array.isArray(email.payload.headers)) {
    email.payload.headers.forEach((header) => {
      headers[header.name] = header.value;
    });
  }
  let body = {};
  if (
    email.payload.mimeType === "text/plain" ||
    email.payload.mimeType === "text/html"
  ) {
    const data = email.payload.body?.data;
    const decoded = data ? Buffer.from(data, "base64").toString("utf-8") : "";

    if (email.payload.mimeType === "text/plain") body.textBody = decoded;
    else body.htmlBody = decoded;
  } else {
    email.payload.parts.forEach((ele) => {
      let decoded;
      if (ele.mimeType !== "application/pdf")
        decoded = Buffer.from(ele.body.data, "base64").toString("utf-8");
      if (ele.mimeType === "text/plain") body.textBody = decoded;
      else if (ele.mimeType === "text/html") body.htmlBody = decoded;
      else if (ele.mimeType === "application/pdf")
        body.attachmentId = ele.body.attachmentId;
    });
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
};
