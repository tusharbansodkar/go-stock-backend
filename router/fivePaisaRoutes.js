require("dotenv").config();
const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verifyTokenMiddleware");
const Token = require("../models/token");

const creds = {
  appSource: process.env.FIVEPAISA_APP_SOURCE,
  appName: process.env.FIVEPAISA_APP_NAME,
  userId: process.env.FIVEPAISA_USER_ID,
  password: process.env.FIVEPAISA_PASSWORD,
  userKey: process.env.FIVEPAISA_USER_KEY,
  encryptionKey: process.env.FIVEPAISA_ENCRYPTION_KEY,
};

const { FivePaisaClient } = require("5paisajs");
const client = new FivePaisaClient(creds);
let isFivePaisaLoggedIn = true; // Track if 5paisa is logged in

// Middleware to check if 5paisa api is logged in
const checkFivePaisaLogin = (req, res, next) => {
  if (!isFivePaisaLoggedIn) {
    return res.status(401).json({ error: "Not logged in to 5paisa" });
  }

  next();
};

router.post("/login-broker", async (req, res) => {
  try {
    const { TOTP } = req.body;
    if (!TOTP) {
      return res.status(400).json({ error: "TOTP is required" });
    }

    let response = await client.get_TOTP_Session(
      process.env.FIVEPAISA_CLIENT_CODE,
      TOTP,
      process.env.FIVEPAISA_PIN
    );

    if (response) {
      isFivePaisaLoggedIn = true;
      await Token.findOneAndUpdate(
        { service: "5paisa" },
        { token: response },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({ message: "5paisa login successful" });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: error?.message });
  }
});

router.post(
  "/market-feed",
  verifyToken,
  checkFivePaisaLogin,
  async (req, res) => {
    try {
      const response = await client.fetch_market_feed_by_scrip(req.body);

      res.status(200).json(response);
    } catch (error) {
      console.error("Error during market feed:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

router.post("/historical-data", async (req, res) => {
  const { Exch, ExchType, ScripCode, TimeFrame, FromDate, ToDate } = req.body;

  const apiUrl = `https://openapi.5paisa.com/V2/historical/${Exch}/${ExchType}/${ScripCode}/${TimeFrame}?from=${FromDate}&end=${ToDate}`;

  try {
    const tokenDoc = await Token.findOne({ service: "5paisa" });
    const token = tokenDoc?.token;

    const apiResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.trim()}`,
      },
    });

    const response = await apiResponse.json();

    const result = response.data.candles;

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text;
      throw new Error(
        `API request failed with status ${apiResponse.status}: ${errorBody}`
      );
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error during fetching data:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
