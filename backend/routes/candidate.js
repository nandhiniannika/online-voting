const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Candidate = require("../models/Candidate");
const { updateGoogleSheets } = require("../utils/updateGoogleSheets"); // Import Google Sheets update function

const router = express.Router();

// ✅ Ensure "uploads" directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ✅ Multer Setup (Restrict to Images)
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

// ✅ Get All Candidates
router.get("/", async (req, res) => {
    try {
        const candidates = await Candidate.find();
        res.json(candidates);
    } catch (error) {
        console.error("❌ Error fetching candidates:", error);
        res.status(500).json({ message: error.message });
    }
});

// ✅ Add Candidate and Update Google Sheets
router.post("/addCandidate", upload.single("logo"), async (req, res) => {
    try {
        const { name, party } = req.body;

        if (!name || !party) {
            return res.status(400).json({ message: "Candidate name and party are required" });
        }

        console.log("🟢 Received Data:", req.body);

        const logoFilename = req.file ? req.file.filename : "default-placeholder.png";

        const newCandidate = new Candidate({ 
            name, 
            party, 
            logo: logoFilename, 
            voteCount: 0 
        });

        await newCandidate.save();
        await updateGoogleSheets(newCandidate); // Update Google Sheets

        console.log("✅ Candidate Added:", newCandidate);
        res.status(201).json({ message: "Candidate added successfully", candidate: newCandidate });
        
    } catch (error) {
        console.error("❌ Error adding candidate:", error);
        res.status(500).json({ message: "Error adding candidate", error: error.message });
    }
});

// ✅ Update Candidate and Google Sheets
router.put("/updateCandidate/:id", upload.single("logo"), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, party } = req.body;

        let updateData = {};
        if (name) updateData.name = name;
        if (party) updateData.party = party;
        if (req.file) updateData.logo = req.file.filename;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "No fields provided for update." });
        }

        const updatedCandidate = await Candidate.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedCandidate) return res.status(404).json({ message: "Candidate not found" });

        await updateGoogleSheets(updatedCandidate); // Update Google Sheets

        res.json({ message: "Candidate updated successfully", candidate: updatedCandidate });
    } catch (error) {
        console.error("❌ Error updating candidate:", error);
        res.status(500).json({ message: "Error updating candidate", error: error.message });
    }
});

// ✅ Delete Candidate and Update Google Sheets
router.delete("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const candidate = await Candidate.findById(id);
        if (!candidate) return res.status(404).json({ message: "Candidate not found" });

        if (candidate.logo) {
            const oldImagePath = path.join(uploadDir, candidate.logo);
            if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
        }

        await Candidate.findByIdAndDelete(id);
        await updateGoogleSheets({ name: candidate.name, party: candidate.party, voteCount: 0 }); // Update Google Sheets

        res.json({ message: "Candidate deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting candidate:", error);
        res.status(500).json({ message: error.message });
    }
});

// ✅ Vote for Candidate and Update Google Sheets
router.post("/vote", async (req, res) => {
    try {
        const { candidateName } = req.body;

        if (!candidateName) return res.status(400).json({ message: "Candidate name is required" });

        const candidate = await Candidate.findOne({ name: candidateName });

        if (!candidate) return res.status(404).json({ message: "Candidate not found" });

        candidate.voteCount += 1;
        await candidate.save();

        await updateGoogleSheets(candidate); // Update Google Sheets

        res.json({ message: "Vote recorded!", candidate });
    } catch (error) {
        console.error("❌ Error processing vote:", error);
        res.status(500).json({ message: "Error processing vote", error: error.message });
    }
});

module.exports = router;
