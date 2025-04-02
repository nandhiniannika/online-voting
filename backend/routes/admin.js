const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey"; // Change this in production

// ✅ Allowed Admin ID (Replace with DB validation in production)
const ADMIN_ID = "8143796138";

// ✅ Admin Login Without Password
router.post("/login", (req, res) => {
  const { adminId } = req.body;

  if (adminId === ADMIN_ID) {
    const token = jwt.sign({ adminId }, SECRET_KEY, { expiresIn: "2h" });
    return res.json({ message: "Login successful", token });
  }

  return res.status(401).json({ error: "Invalid Admin ID" });
});

// ✅ Set up storage for uploaded images
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, `${req.body.voter_id}.jpg`); // Store image as Voter ID.jpg
  },
});
const upload = multer({ storage });

// ✅ Route to add a voter (Uploads Image + Face Recognition)
router.post("/addvoter", upload.single("image"), async (req, res) => {
  const { voter_id } = req.body;
  const imagePath = req.file.path; // Path to uploaded image

  if (!voter_id || !imagePath) {
    return res.status(400).json({ error: "Missing voter_id or image." });
  }

  console.log(`📩 Received request to add voter: ${voter_id}`);

  // Execute `add_faces.py` to process image and add face encoding
  exec(`python backend/FaceRecognition/add_faces.py ${voter_id} ${imagePath}`, (error, stdout, stderr) => {
    if (error) {
      console.error("Error executing face recognition:", stderr);
      return res.status(500).json({ error: "Face recognition failed." });
    }
    console.log(stdout);
    res.json({ message: "User added successfully!" });
  });
});

// ✅ Route to fetch all voters
router.get("/", async (req, res) => {
  try {
    const files = fs.readdirSync("uploads/");
    const users = files.map((file) => ({
      voter_id: file.split(".")[0],
      image_filename: file,
    }));
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

// ✅ Route to update a voter's image
router.put("/updatevoter", upload.single("image"), async (req, res) => {
  const { voter_id } = req.body;
  const imagePath = req.file.path; // New image path

  if (!voter_id || !imagePath) {
    return res.status(400).json({ error: "Missing voter_id or image." });
  }

  console.log(`🔄 Updating voter ${voter_id}'s image...`);

  // Execute `add_faces.py` to update face encoding
  exec(`python backend/FaceRecognition/add_faces.py ${voter_id} ${imagePath}`, (error, stdout, stderr) => {
    if (error) {
      console.error("Error updating face recognition:", stderr);
      return res.status(500).json({ error: "Failed to update face encoding." });
    }
    console.log(stdout);
    res.json({ message: "User image updated successfully!" });
  });
});

// ✅ Route to delete a voter
router.delete("/users/delete/:id", async (req, res) => {
  try {
    const voterId = req.params.id;
    const imagePath = path.join("uploads", `${voterId}.jpg`);

    // Delete the image if it exists
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    console.log(`❌ Deleted voter: ${voterId}`);
    res.json({ message: "User deleted successfully!" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user." });
  }
});

module.exports = router;
