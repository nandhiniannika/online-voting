const express = require("express");
const { exec } = require("child_process");
const path = require("path");
const User = require("../models/User");
const { updateGoogleSheets } = require("../utils/updateGoogleSheets");

const router = express.Router();

// Set Python Path (used locally only if needed)
const pythonPath = process.env.RAILWAY_ENV ? "python3" : "C:\\Users\\nandh\\OneDrive\\Desktop\\Online_Voting\\online-voting\\.venv\\Scripts\\python.exe";

// Docker container name from docker ps
const dockerContainer = "online-voting-backend-container";

// ✅ POST: Add Voter
router.post("/addvoter", async (req, res) => {
    try {
        const { voter_id } = req.body;
        if (!voter_id) {
            return res.status(400).json({ error: "Voter ID is required" });
        }

        console.log(`📥 Received request to add voter: ${voter_id}`);

        // 1. Check if Flask is up
        const healthURL = "http://localhost:5001/health";

        const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
        const healthResponse = await fetch(healthURL);

        if (!healthResponse.ok) {
            return res.status(500).json({ error: "Flask service is not running or unhealthy" });
        }

        console.log("✅ Flask backend is healthy");

        // 2. Execute add_faces.py inside Docker container
        const dockerCommand = `docker exec ${dockerContainer} python FaceRecognition/add_faces.py ${voter_id}`;
        console.log(`🐳 Running inside Docker: ${dockerCommand}`);

        exec(dockerCommand, async (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Docker error: ${error.message}`);
                return res.status(500).json({ error: "Docker add_faces failed", details: stderr });
            }

            console.log(`✅ Docker Output:\n${stdout}`);

            // Save to MongoDB
            const newVoter = new User({ voter_id });
            await newVoter.save();

            // Update Google Sheets
            await updateGoogleSheets(voter_id);

            res.status(200).json({ success: true, message: "Voter added successfully!", output: stdout });
        });

    } catch (err) {
        console.error("❌ Server error:", err.message);
        res.status(500).json({ error: "Internal server error", details: err.message });
    }
});

// ✅ DELETE: Delete Voter
router.delete("/deletevoter/:voter_id", async (req, res) => {
    try {
        const { voter_id } = req.params;

        const existingUser = await User.findOne({ voter_id });
        if (!existingUser) {
            return res.status(404).json({ error: "Voter not found" });
        }

        // Delete from MongoDB
        await User.deleteOne({ voter_id });
        console.log(`🗑️ Deleted voter from DB: ${voter_id}`);

        // Delete face data using Docker command
        const dockerDeleteCmd = `docker exec ${dockerContainer} python FaceRecognition/delete_faces.py ${voter_id}`;
        exec(dockerDeleteCmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Error deleting face data: ${stderr}`);
                return res.status(500).json({ error: "Failed to delete face data", details: stderr });
            }
            console.log(`🧹 Deleted face data for voter ${voter_id}:\n${stdout}`);
            res.status(200).json({ success: true, message: `Voter ${voter_id} deleted successfully.` });
        });

    } catch (err) {
        console.error("❌ Delete error:", err.message);
        res.status(500).json({ error: "Internal server error", details: err.message });
    }
});

// ✅ GET: Get All Voters
router.get("/getvoters", async (req, res) => {
    try {
        const voters = await User.find({});
        res.status(200).json({ success: true, voters });
    } catch (err) {
        console.error("❌ Fetch error:", err.message);
        res.status(500).json({ error: "Failed to fetch voters", details: err.message });
    }
});

module.exports = router;
