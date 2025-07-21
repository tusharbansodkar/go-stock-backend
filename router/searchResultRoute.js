const express = require("express");
const Scrip = require("../models/scrip.js");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { string } = req.query;

    if (!string || typeof string !== "string" || string.trim() === "") {
      return res.status(400).json({
        message: "Search string is required and must be a non-empty string.",
      });
    }

    const result = await Scrip.find({
      $or: [
        { Name: { $regex: string, $options: "i" } },
        { FullName: { $regex: string, $options: "i" } },
      ],
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error during search:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
