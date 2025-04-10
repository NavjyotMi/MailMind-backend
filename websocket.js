const WebSocket = require("ws");

let wss = null;
const clients = new Map();
const setupWebSocket = (server) => {
  wss = new WebSocket.Server({ server });

  wss.on("connection", (ws, request) => {
    console.log("✅ Client Connected");
    console.log("websocket url ", request.url);
    const clientId = getUserIdFromRequest(request.url);
    console.log("client id is ", clientId);

    if (!clientId) {
      ws.close();
      return;
    }
    // console.log(`✅ User ${userId} Connected`);
    clients.set(clientId, ws);
  });
  wss.on("close", () => {
    console.log("disconnected");
    clients.delete(userId);
  });
};

const getWss = () => wss;

const sendToUser = (userId, message) => {
  const ws = clients.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ event: "categorized_email", data: message }));
    console.log(`📢 Sent to User ${userId}:`, message);
  } else {
    console.log(`⚠️ User ${userId} is not connected`);
  }
};
module.exports = { setupWebSocket, getWss, sendToUser };
const getUserIdFromRequest = (req) => {
  const id = req.split("=")[1];
  return id;
};
