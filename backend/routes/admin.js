const express = require("express");
const multer = require("multer");
const User = require("../models/User");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const { updateGoogleSheets } = require("../utils/updateGoogleSheets");

const router = express.Router();

// Determine Python path dynamically
const pythonPath = process.env.PYTHON_PATH || "python3"; // Auto-detect in Railway
console.log("Using Python Path:", pythonPath);


console.log("Using Python Path:", pythonPath);

// Ensure `uploads` directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer setup for file uploads
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

// Add Voter
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
            return res.status(500).json({ success: false, message: "Face processing script missing." });
        }


        // Execute Python script
        exec(`pip install face-recognition dlib numpy`, (error, stdout, stderr) => {
            console.log("Installing dependencies:", stdout || stderr);
            exec(`python /app/FaceRecognition/add_faces.py ${voterId}`, (error, stdout, stderr) => {
                if (error) {
                    console.error("Python Execution Error:", error.message);
                    return res.status(500).json({ success: false, message: "Face processing failed" });
                }
                console.log("Python STDOUT:", stdout);
                return res.status(201).json({ success: true, message: "Voter added successfully" });
            });
        });
        

            // updateGoogleSheets("add", newUser);
            // return res.status(201).json({ success: true, message: "Voter added successfully", user: newUser });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Voter Login with Face Recognition
router.post("/login", async (req, res) => {
    let { voter_id } = req.body;
    if (!voter_id) return res.status(400).json({ success: false, message: "Voter ID is required" });

    try {
        const user = await User.findOne({ voter_id });
        if (!user) return res.status(401).json({ success: false, message: "Invalid Voter ID" });

        const imagePath = path.join(uploadDir, user.image_filename);
        if (!fs.existsSync(imagePath)) {
            return res.status(400).json({ success: false, message: "Voter image file is missing from the server." });
        }

        const recognizeFacesScript = path.resolve(__dirname, "../FaceRecognition/recognize_faces.py");
        if (!fs.existsSync(recognizeFacesScript)) {
            return res.status(500).json({ success: false, message: "Face recognition script is missing." });
        }

        exec(`${pythonPath} "${recognizeFacesScript}" "${voter_id}" "${imagePath}"`, (error, stdout, stderr) => {
            if (stdout.includes(`MATCH: ${voter_id}`)) {
                return res.json({ success: true, message: "Face matched, voter verified!" });
            }
            return res.status(401).json({ success: false, message: "Face does not match" });
        });
    } catch (error) {
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

        updateGoogleSheets("delete", deletedUser);
        res.json({ success: true, message: "Voter deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
