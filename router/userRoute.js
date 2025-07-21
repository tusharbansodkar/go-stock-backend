const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const verifyToken = require("../middlewares/verifyTokenMiddleware");
const mongoose = require("mongoose");
const router = express.Router();

router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await user.save();

    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    res
      .status(200)
      .json({ message: "Profile updated successfully", user: userResponse });
  } catch (error) {
    console.log("Error while updating details: ", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/watchlist", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .select("-password")
      .populate("watchlist");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(user.watchlist);
  } catch (error) {
    console.error("Error while fetching watchlist: ", error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/watchlist", verifyToken, async (req, res) => {
  try {
    const { scripId } = req.body;
    const userId = req.user.id;

    if (!scripId || !mongoose.Types.ObjectId.isValid(scripId)) {
      return res.status(400).json({ message: "A valid scripId is required." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: { watchlist: scripId },
      },
      { new: true }
    )
      .select("-password")
      .populate("watchlist");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res
      .status(200)
      .json({ message: "Scrip added to watchlist", user: updatedUser });
  } catch (error) {
    console.error("Error while adding scrip to watchlist: ", error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/watchlist/:scripId", verifyToken, async (req, res) => {
  try {
    const { scripId } = req.params;
    const userId = req.user.id;

    if (!scripId || !mongoose.Types.ObjectId.isValid(scripId)) {
      return res.status(400).json({ message: "A valid scripId is required." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { watchlist: scripId } },
      { new: true }
    )
      .select("-password")
      .populate("watchlist");

    res
      .status(200)
      .json({ message: "Scrip removed from watchlist.", user: updatedUser });
  } catch (error) {
    console.error("Error while removing scrip to watchlist: ", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
