require("dotenv").config();
const WebSocket = require("ws");
const Token = require("./models/token");

let ws5paisa;
let socketIO;
let fivePaisaToken;

function init(socket) {
  socketIO = socket;
  connectTo5paisa();
}

function update5paisaSubscription(dataToFetch) {
  if (ws5paisa && ws5paisa.readyState === WebSocket.OPEN) {
    const subscriptionPayload = {
      Method: "MarketFeedV3",
      Operation: "Subscribe",
      ClientCode: `${process.env.FIVEPAISA_CLIENT_CODE}`,
      MarketFeedData: dataToFetch,
    };

    ws5paisa.send(JSON.stringify(subscriptionPayload));
  }
}

function unsubscribeMarketData(dataToUnsubscribe) {
  if (ws5paisa && ws5paisa.readyState === WebSocket.OPEN) {
    const unsubscriptionPayload = {
      Method: "MarketFeedV3",
      Operation: "Unsubscribe",
      ClientCode: `${process.env.FIVEPAISA_CLIENT_CODE}`,
      MarketFeedData: dataToUnsubscribe,
    };

    ws5paisa.send(JSON.stringify(unsubscriptionPayload));
    console.log("unsuscribed for watchlist");
  }
}

async function connectTo5paisa() {
  const tokenDoc = await Token.findOne({ service: "5paisa" });

  if (tokenDoc) {
    fivePaisaToken = tokenDoc?.token;
  }

  ws5paisa = new WebSocket(
    `wss://openfeed.5paisa.com/feeds/api/chat?Value1=${fivePaisaToken}|${process.env.FIVEPAISA_CLIENT_CODE}`
  );

  ws5paisa.on("open", () => {
    console.log("Connected to 5Paisa WebSocket");
  });

  ws5paisa.on("message", (bufferData) => {
    const jsonString = Buffer.from(bufferData).toString("utf-8");

    try {
      const parsed = JSON.parse(jsonString);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      items.forEach((item) => {
        socketIO.sockets.emit("marketData", item);
      });
    } catch (error) {
      console.log("Failed to parse json string:", error);
    }
  });

  ws5paisa.on("error", (err) => {
    console.error("WebSocket error:", err);
  });

  ws5paisa.on("close", () => {
    console.warn("Reconnecting to 5paisa...");
    setTimeout(connectTo5paisa, 3000);
  });
}

module.exports = {
  init,
  update5paisaSubscription,
  unsubscribeMarketData,
};
