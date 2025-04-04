const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const User = require("../models/User");
const { updateGoogleSheets } = require("../utils/updateGoogleSheets");

const router = express.Router();

// 🚀 Set Python Path for Railway (Linux-based)
const pythonPath = process.env.RAILWAY_ENV ? "python3" : "C:\\Users\\nandh\\OneDrive\\Desktop\\Online_Voting\\online-voting\\.venv\\Scripts\\python.exe";

// Ensure `uploads` directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer Setup for Image Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
        allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only .png, .jpg, and .jpeg formats are allowed!"));
    },
});

// ✅ GET: Fetch All Voters
router.get("/", async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        console.error("❌ Error fetching voters:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ✅ POST: Add Voter
router.post("/addvoter", async (req, res) => {
    try {
        console.log("📥 Received Body:", req.body);

        const { voter_id } = req.body;
        if (!voter_id) {
            return res.status(400).json({ error: "Voter ID is required" });
        }

        console.log(`✅ Running Python script for Voter ID: ${voter_id}`);
        
        const scriptPath = path.join(__dirname, "../FaceRecognition/add_faces.py");
        const command = `"${pythonPath}" "${scriptPath}" "${voter_id}"`;

        exec(command, async (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Python Execution Error: ${error.message}`);
                console.error(`📌 STDERR: ${stderr}`);
                return res.status(500).json({ error: "Python script failed", details: stderr });
            }

            console.log("🐍 Python Output:", stdout);

            // Save voter to MongoDB
            const newVoter = new User({ voter_id });
            await newVoter.save();

            // Update Google Sheets
            await updateGoogleSheets(voter_id);

            res.status(200).json({ success: true, message: "Voter added successfully!", output: stdout });
        });

    } catch (error) {
        console.error("❌ API Error:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
});

// ✅ POST: Voter Login (Face Recognition)
router.post("/login", async (req, res) => {
    let { voter_id } = req.body;
    if (!voter_id) {
        return res.status(400).json({ success: false, message: "Voter ID is required" });
    }

    voter_id = String(voter_id).trim();

    try {
        const user = await User.findOne({ voter_id });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid Voter ID" });
        }

        console.log(`🔍 Running Face Recognition for Voter ID: ${voter_id}`);

        const scriptPath = path.join(__dirname, "../FaceRecognition/recognize_faces.py");
        const command = `"${pythonPath}" "${scriptPath}" "${voter_id}"`;

        exec(command, (error, stdout, stderr) => {
            console.log(`Python Output: ${stdout.trim()}`);

            if (stdout.includes(`MATCH: ${voter_id}`)) {
                return res.json({ success: true, message: "Face matched, voter verified!" });
            }
            return res.status(401).json({ success: false, message: "Face does not match" });
        });

    } catch (error) {
        console.error("❌ Server error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// ✅ DELETE: Remove Voter
router.delete("/delete/:id", async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ success: false, message: "Voter not found" });

        // Remove Image from Server
        const imagePath = path.join(uploadDir, deletedUser.image_filename);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

        res.json({ success: true, message: "Voter deleted" });
    } catch (error) {
        console.error("❌ Error deleting voter:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ✅ PUT: Update Voter
router.put("/update/:id", upload.single("image"), async (req, res) => {
    try {
        const { voter_id } = req.body;

        if (voter_id && voter_id.length !== 12) {
            return res.status(400).json({ success: false, message: "Voter ID must be exactly 12 characters long" });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "Voter not found" });

        let updatedFields = { voter_id: voter_id || user.voter_id };

        // Handle Image Update
        if (req.file) {
            const newImageFilename = req.file.filename;
            const newImagePath = path.join(uploadDir, newImageFilename);

            // Remove Old Image
            if (user.image_filename) {
                const oldImagePath = path.join(uploadDir, user.image_filename);
                if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
            }

            updatedFields.image_filename = newImageFilename;
        }

        const updatedUser = await User.findByIdAndUpdate(req.params.id, updatedFields, { new: true });

        res.json({ success: true, message: "Voter updated successfully", user: updatedUser });

    } catch (error) {
        console.error("❌ Error updating voter:", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// ✅ GET: Fetch a Single Voter
router.get("/:id", async (req, res) => {
    try {
        const voter = await User.findById(req.params.id);
        if (!voter) return res.status(404).json({ success: false, message: "Voter not found" });

        res.json({ success: true, voter });
    } catch (error) {
        console.error("❌ Error fetching voter:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

module.exports = router;
