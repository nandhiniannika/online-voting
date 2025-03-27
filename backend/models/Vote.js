const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
    voterId: { type: String, required: true, unique: true },
    candidateId: { type: String, required: true },
    candidateName: { type: String, required: true } // This field is required
}, { timestamps: true });

module.exports = mongoose.model('Vote', VoteSchema);
