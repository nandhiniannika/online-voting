const mongoose = require("mongoose");

const CandidateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    party: { type: String, required: true },  // ✅ Added `party` field
    logo: { type: String, default: "default-placeholder.png" },  
    voteCount: { type: Number, default: 0 },
});

module.exports = mongoose.model("Candidate", CandidateSchema);
