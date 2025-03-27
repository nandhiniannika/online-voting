const Vote = require("../models/Vote");
const Candidate = require("../models/Candidate");

exports.castVote = async (req, res) => {
    const { voter_id, candidateId, candidateName } = req.body;

    if (!voter_id || !candidateId || !candidateName) {
        return res.status(400).json({ success: false, message: "⚠️ Missing voterId, candidateId, or candidateName." });
    }

    try {
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ success: false, message: "❌ Candidate not found!" });
        }

        // ✅ Save vote to database
        const vote = new Vote({ voter_id, candidateId, candidateName });
        await vote.save();

        res.status(200).json({ success: true, message: "✅ Vote cast successfully!" });
    } catch (error) {
        console.error("❌ Error casting vote:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
