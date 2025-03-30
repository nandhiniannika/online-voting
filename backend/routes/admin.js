const express = require("express");
const multer = require("multer");
const User = require("../models/User");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const { updateGoogleSheets } = require("../utils/updateGoogleSheets");

const router = express.Router();
const pythonPath = process.env.PYTHON_PATH || "python3"; 
console.log("Using Python Path:", pythonPath);

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
        return allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only .png, .jpg, and .jpeg formats are allowed!"));
    },
});

// 🟢 Get all registered voters
router.get("/", async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 🟢 Add a new voter
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

        const addFacesScript = path.resolve(__dirname, "../FaceRecognition/add_faces.py");
        if (!fs.existsSync(addFacesScript)) {
            return res.status(500).json({ success: false, message: "Face processing script is missing." });
        }

        console.log(`Executing: ${pythonPath} ${addFacesScript} ${voter_id}`);
        exec(`${pythonPath} "${addFacesScript}" "${voter_id}"`, (error, stdout, stderr) => {
            if (error) {
                console.error("❌ Face processing error:", error.message);
                console.error("stderr:", stderr);
                return res.status(500).json({ success: false, message: "Face processing failed." });
            }
            console.log("✅ Face processing success:", stdout);
            return res.status(201).json({ success: true, message: "Voter added successfully!" });
        });
    } catch (error) {
        console.error("Error adding voter:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

// 🟢 Login (Face Recognition)
router.post("/login", async (req, res) => {
    const { voter_id, image } = req.body;
    if (!voter_id || !image) {
        return res.status(400).json({ success: false, message: "Voter ID and image are required." });
    }

    try {
        const user = await User.findOne({ voter_id });
        if (!user) return res.status(401).json({ success: false, message: "❌ Invalid Voter ID." });

        const tempImagePath = path.join(uploadDir, `temp_${Date.now()}.png`);
        const base64Data = image.replace(/^data:image\/png;base64,/, "");
        fs.writeFileSync(tempImagePath, base64Data, "base64");

        const recognizeFacesScript = path.resolve(__dirname, "../FaceRecognition/recognize_faces.py");
        if (!fs.existsSync(recognizeFacesScript)) {
            return res.status(500).json({ success: false, message: "Face recognition script is missing." });
        }

        console.log(`Executing: ${pythonPath} "${recognizeFacesScript}" "${voter_id}" "${tempImagePath}"`);
        exec(`${pythonPath} "${recognizeFacesScript}" "${voter_id}" "${tempImagePath}"`, (error, stdout, stderr) => {
            fs.unlinkSync(tempImagePath); // Cleanup temporary image file

            if (stdout.includes(`MATCH: ${voter_id}`)) {
                console.log("✅ Face matched:", voter_id);
                return res.json({ success: true, message: "Face matched, voter verified!" });
            }

            console.warn("❌ Face mismatch:", voter_id);
            return res.status(401).json({ success: false, message: "Face does not match." });
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

// 🟢 Delete voter
router.delete("/delete/:id", async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ success: false, message: "❌ Voter not found." });

        const imagePath = path.join(uploadDir, deletedUser.image_filename);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

        updateGoogleSheets("delete", deletedUser);
        console.log("✅ Voter deleted:", deletedUser.voter_id);
        res.json({ success: true, message: "Voter deleted successfully!" });
    } catch (error) {
        console.error("Error deleting voter:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

module.exports = router;
