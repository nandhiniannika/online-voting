const express = require("express");
const { castVote } = require("../controller/voteController");

const router = express.Router();

router.post("/vote", castVote);

module.exports = router;
