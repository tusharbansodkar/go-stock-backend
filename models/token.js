const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema(
  {
    service: {
      type: String,
      require: true,
      unique: true,
      default: "5paisa",
    },
    token: {
      type: String,
      require: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Token", tokenSchema);
