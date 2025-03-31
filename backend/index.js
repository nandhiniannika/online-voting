const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const path = require("path");
const { exec } = require("child_process");

dotenv.config(); // Load environment variables from .env

// Import Routes
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const candidateRoutes = require("./routes/candidate");
const voteRoutes = require("./routes/vote");
const updateSheetsRoute = require("./routes/updateGoogleSheets");
const voterRoutes = require("./routes/voter");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/voter_management_2";

// ✅ Allowed Frontend URLs
const allowedOrigins = [
  "http://localhost:3000",
  "https://online-voting-2.vercel.app"
];

// ✅ CORS Middleware (Fixes Issue)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// ✅ Middleware
app.use(express.json());
app.use(morgan("dev")); // Logging

// ✅ Serve Static Files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Allow Cross-Origin for Images
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

// ✅ Check if Python is Installed
app.get("/check-python", (req, res) => {
    exec("python --version", (error, stdout, stderr) => {
        if (error) {
            return res.json({ success: false, message: stderr || error.message });
        }
        res.json({ success: true, pythonVersion: stdout.trim() });
    });
});

// ✅ Run Python Script (`add_faces.py`)
app.post("/run-python", (req, res) => {
    exec("python3 /app/backend/FaceRecognition/add_faces.py", (error, stdout, stderr) => {
        if (error) {
            return res.json({ success: false, message: stderr || error.message });
        }
        res.json({ success: true, output: stdout.trim() });
    });
});

// ✅ MongoDB Connection
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", adminRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/voter", voterRoutes);
app.use("/api/google-sheets", updateSheetsRoute);

// ✅ Test API Route
app.get("/", (req, res) => {
  res.send("✅ Backend is running!");
});

// ✅ Handle Undefined Routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "API endpoint not found" });
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message,
  });
});

// ✅ Start the Server
const server = app.listen(PORT, () => {
  console.log(
    `🚀 Server running at http://localhost:${PORT} (${process.env.NODE_ENV || "development"})`
  );
});

// ✅ Graceful Shutdown
const shutdownServer = async (signal) => {
  console.log(`\n🔴 Received ${signal}. Server shutting down...`);
  await mongoose.connection.close();
  console.log("✅ MongoDB connection closed.");
  server.close(() => {
    console.log("✅ HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdownServer("SIGINT"));
process.on("SIGTERM", () => shutdownServer("SIGTERM"));
