const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const verifyToken = require("../middlewares/verifyTokenMiddleware");
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

module.exports = router;
