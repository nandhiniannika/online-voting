const express = require("express");
const router = express.Router();
const Candidate = require("../models/Candidate");
const User = require("../models/User"); // ✅ Ensure correct model
const { updateGoogleSheets } = require("../utils/updateGoogleSheets"); // ✅ Correct import

// Route to check if voter has already voted
router.get('/check-vote/:voterId', async (req, res) => {
  const { voterId } = req.params;
  console.log("Checking voter ID:", voterId); // 🔍 Debugging log

  try {
      const voter = await User.findOne({ voter_id: voterId });

      console.log("Voter found:", voter); // 🔍 Log voter data

      if (!voter) {
          return res.status(404).json({ success: false, message: 'Voter not found' });
      }

      return res.json({ 
          success: !voter.hasVoted, 
          message: voter.hasVoted ? 'Voter has already voted.' : 'Voter has not voted yet.' 
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// POST route for voting
router.post('/vote', async (req, res) => {
  const { voterId, candidateId } = req.body;

  try {
    // Find voter in database
    let voter = await User.findOne({ voter_id: voterId });
    if (!voter) return res.status(404).json({ error: 'Voter not found' });

    // Check if voter has already voted
    if (voter.hasVoted) {
      return res.status(400).json({ error: 'Voter has already voted' });
    }

    // Find candidate in MongoDB
    let candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    // Increment vote count in MongoDB
    candidate.voteCount += 1;
    await candidate.save();

    // Mark voter as having voted
    voter.hasVoted = true;
    await voter.save();

    // Update Google Sheets
    await updateGoogleSheets();

    res.json({ message: 'Thanks for voting!', candidate });
  } catch (error) {
    console.error("❌ Voting error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
