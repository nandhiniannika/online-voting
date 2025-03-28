const express = require("express");
const multer = require("multer");
const User = require("../models/User");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const { updateGoogleSheets } = require("../utils/updateGoogleSheets"); // ✅ Import the Voter model

const router = express.Router();

// Ensure Python Path is Correct
const pythonPath = "C:\\Users\\nandh\\OneDrive\\Desktop\\Online_Voting\\online-voting\\.venv\\Scripts\\python.exe";

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
// Add Voter (Admin Functionality)
router.post("/addvoter", upload.single("image"), async (req, res) => {
    const voter_id = req.body.voter_id;
    const imagePath = req.file?.path; // Ensure file path is correct

    if (!imagePath) {
        return res.status(400).json({ success: false, message: "No image received!" });
    }

    console.log(`📸 Processing face for voter ID: ${voter_id}, Image Path: ${imagePath}`);

    // ✅ Call Python script with image path
    exec(`python add_faces.py ${voter_id} "${imagePath}"`, (error, stdout, stderr) => {
        console.log("Python Output:", stdout);
        console.log("Python Error:", stderr);

        if (error) {
            return res.status(500).json({ success: false, message: "Face processing failed!" });
        }
        return res.json({ success: true, message: "Face registered successfully!" });
    });
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
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid Voter ID" });
        }

        if (!user.image_filename) {
            return res.status(400).json({ success: false, message: "No image found for this voter ID." });
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

        exec(`"${pythonPath}" "${recognizeFacesScript}" "${voter_id}" "${imagePath}"`, (error, stdout, stderr) => {
            console.log(`Python Output: ${stdout.trim()}`);

            if (stdout.includes(`MATCH: ${voter_id}`)) {
                return res.json({ success: true, message: "Face matched, voter verified!" });
            }
            return res.status(401).json({ success: false, message: "Face does not match" });
        });

    } catch (error) {
        console.error("Server error:", error);
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

// Update Voter
router.put("/update/:id", upload.single("image"), async (req, res) => {
    try {
        const { voter_id } = req.body;

        if (voter_id && voter_id.length !== 12) {
            return res.status(400).json({ success: false, message: "Voter ID must be exactly 12 characters long" });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "Voter not found" });

        let updatedFields = { voter_id: voter_id || user.voter_id };

        if (req.file) {
            const newImageFilename = req.file.filename;
            const newImagePath = path.join(uploadDir, newImageFilename);

            if (user.image_filename) {
                const oldImagePath = path.join(uploadDir, user.image_filename);
                if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
            }

            updatedFields.image_filename = newImageFilename;
        }

        const updatedUser = await User.findByIdAndUpdate(req.params.id, updatedFields, { new: true });

        res.json({ success: true, message: "Voter updated successfully", user: updatedUser });

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


module.exports = router;
