const mongoose = require("mongoose");

const scripSchema = new mongoose.Schema({
  Exch: String,
  ExchType: String,
  ScripCode: String,
  Name: String,
  FullName: String,
  ScripData: String,
});

module.exports = mongoose.model("Scrip", scripSchema);
