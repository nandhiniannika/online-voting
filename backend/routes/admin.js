const express = require("express");
const { exec } = require("child_process");
const path = require("path");
const User = require("../models/User");
const { spawn } = require('child_process');

const { updateGoogleSheets } = require("../utils/updateGoogleSheets");

const router = express.Router();

// Set Python Path (used locally only if needed)
const pythonPath = process.env.RAILWAY_ENV ? "python3" : "C:\\Users\\nandh\\OneDrive\\Desktop\\Online_Voting\\online-voting\\.venv\\Scripts\\python.exe";

// Docker container name from docker ps
const dockerContainer = "online-voting-backend-container";

// ✅ POST: Add Voter
router.post('/addvoter', async (req, res) => {
    const { voter_id } = req.body;
  
    if (!voter_id) {
      return res.status(400).json({ success: false, message: 'Voter ID missing' });
    }
  
    try {
      // Start the Flask server
      const serverPath = path.join(__dirname, '../FaceRecognition/server.py');
      const serverProcess = spawn('python', [serverPath]);
  
      console.log("🚀 Flask server started");
  
      // Wait a few seconds for Flask to initialize
      await new Promise(resolve => setTimeout(resolve, 3000));
  
      // Run add_faces.py with the Voter ID
      const addFacesPath = path.join(__dirname, '../FaceRecognition/add_faces.py');
      const addProcess = spawn('python', [addFacesPath, voter_id]);
  
      addProcess.stdout.on('data', data => {
        console.log(`[add_faces.py]: ${data}`);
      });
  
      addProcess.stderr.on('data', data => {
        console.error(`[add_faces.py error]: ${data}`);
      });
  
      addProcess.on('close', (code) => {
        console.log(`✅ add_faces.py exited with code ${code}`);
  
        // Kill Flask server
        serverProcess.kill();
        console.log("🛑 Flask server stopped");
  
        if (code === 0) {
          return res.json({ success: true, message: 'Voter added and face encoded' });
        } else {
          return res.status(500).json({ success: false, message: 'Face encoding failed' });
        }
      });
    } catch (err) {
      console.error("❌ Error:", err.message);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
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
