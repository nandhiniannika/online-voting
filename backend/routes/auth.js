const express = require("express");
const { exec } = require("child_process");
const path = require("path");

const router = express.Router();

// Define the path to the Python executable
const pythonPath = "C:\\Python312\\python.exe";

// Define the path to the Python script
const scriptPath = path.join(__dirname, "../FaceRecognition/recognize_faces.py");

// Login Route
router.post("/login", (req, res) => {
    console.log("🔄 Login API called");

    // Execute the Python script
    exec(`"${pythonPath}" "${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Error executing script: ${error.message}`);
            return res.status(500).json({ success: false, message: "Face recognition failed", error: error.message });
        }
        if (stderr) {
            console.warn(`⚠️ Script stderr: ${stderr}`);
        }

        console.log(`✅ Script output: ${stdout.trim()}`);

        // Check the output of recognize_faces.py
        if (stdout.trim().includes("Face matched")) {
            return res.json({ success: true, message: "Login successful", user: stdout.trim() });
        } else {
            return res.status(401).json({ success: false, message: "Face doesn't match" });
        }
    });
});

module.exports = router;
