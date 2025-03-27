const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    voter_id: { type: String, required: true, unique: true },
    image_filename: { type: String, required: true },
    hasVoted: { type: Boolean, default: false }, // ✅ Track if voter has voted
});

module.exports = mongoose.model("User", userSchema);
