const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  first_name: { type: String, default: null },
  last_name: { type: String, default: null },
  email: { type: String, unique: true },
  password: { type: String },
  reset_token: { type: String },
  reset_token_expiry: { type: BigInt },
});

module.exports = mongoose.model("user", userSchema);
