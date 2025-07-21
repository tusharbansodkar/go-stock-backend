const express = require("express");
const Parser = require("rss-parser");
const verifyToken = require("../middlewares/verifyTokenMiddleware");

const router = express.Router();
const parser = new Parser();

router.get("/topnews", verifyToken, async (req, res) => {
  try {
    const feed = await parser.parseURL(
      "https://www.google.co.in/alerts/feeds/15157022309067656403/11909945288205571726"
    );

    const news = feed.items.map((item) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      content: item.contentSnippet,
    }));

    res.status(200).json(news);
  } catch (error) {
    console.error("Failed to fetch RSS feed:", error);
    res.status(500).json({ error: "Failed to fetch news." });
  }
});

module.exports = router;
