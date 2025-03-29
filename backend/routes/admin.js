const express = require("express");
const multer = require("multer");
const User = require("../models/User");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const { updateGoogleSheets } = require("../utils/updateGoogleSheets");
const os = require("os");

const router = express.Router();

let pythonPath;

// Check OS type
if (os.platform() === "win32") {
    pythonPath = path.join(__dirname, "../.venv/Scripts/python.exe");
} else {
    pythonPath = fs.existsSync("/usr/bin/python3") ? "/usr/bin/python3" : path.join(__dirname, "../.venv/bin/python3");
}

console.log("Using Python Path:", pythonPath);

// Ensure `uploads` directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer Setup (Restrict to Images)
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

// Get All Voters
router.get("/", async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Add Voter (Admin Functionality)
router.post("/addvoter", upload.single("image"), async (req, res) => {
    try {
        const { voter_id } = req.body;

        if (!voter_id || voter_id.length !== 12) {
            return res.status(400).json({ success: false, message: "Voter ID must be exactly 12 characters long" });
        }

        const image_filename = req.file?.filename;
        if (!image_filename) {
            return res.status(400).json({ success: false, message: "Image file is required" });
        }

        const newUser = new User({ voter_id, image_filename });
        await newUser.save();

        const addFacesScript = path.join(__dirname, "../FaceRecognition/add_faces.py");
        if (!fs.existsSync(addFacesScript)) {
            return res.status(500).json({ success: false, message: "Face processing script missing." });
        }

        console.log(`Executing Python script: ${addFacesScript} with Voter ID: ${voter_id}`);

        exec(`${pythonPath} "${addFacesScript}" "${voter_id}"`, (error, stdout, stderr) => {
            console.log("📝 Python STDOUT:", stdout.trim());
            console.error("⚠️ Python STDERR:", stderr.trim());
            if (error || stderr.includes("ERROR")) {
                return res.status(500).json({ success: false, message: "Face processing failed", error: stderr.trim() });
            }
            res.status(201).json({ success: true, message: "Voter added successfully" });
        });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(400).json({ success: false, message: error.message });
    }
});

// Voter Login with Face Recognition
router.post("/login", async (req, res) => {
    let { voter_id } = req.body;
    if (!voter_id) {
        return res.status(400).json({ success: false, message: "Voter ID is required" });
    }
    voter_id = String(voter_id).trim();
    try {
        const user = await User.findOne({ voter_id });
        if (!user || !user.image_filename) {
            return res.status(401).json({ success: false, message: "Invalid Voter ID or no image found" });
        }

        const imagePath = path.join(uploadDir, user.image_filename);
        if (!fs.existsSync(imagePath)) {
            return res.status(400).json({ success: false, message: "Voter image file is missing from the server." });
        }

        const recognizeFacesScript = path.join(__dirname, "../FaceRecognition/recognize_faces.py");
        if (!fs.existsSync(recognizeFacesScript)) {
            return res.status(500).json({ success: false, message: "Face recognition script is missing." });
        }

        console.log(`🔍 Running Face Recognition for Voter ID: ${voter_id}`);
        exec(`${pythonPath} "${recognizeFacesScript}" "${voter_id}" "${imagePath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Error Running Python Script: ${stderr}`);
                return res.status(500).json({ success: false, message: "Face processing failed", error: stderr.trim() });
            }
            console.log(`✅ Python Output: ${stdout.trim()}`);
            stdout.includes(`MATCH: ${voter_id}`) ? res.json({ success: true, message: "Face matched, voter verified!" }) : res.status(401).json({ success: false, message: "Face does not match" });
        });
    } catch (error) {
        console.error("❌ Server error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Delete Voter
router.delete("/delete/:id", async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ success: false, message: "Voter not found" });
        const imagePath = path.join(uploadDir, deletedUser.image_filename);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        res.json({ success: true, message: "Voter deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
