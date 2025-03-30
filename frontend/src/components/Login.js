import React, { useState, useRef} from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://online-voting-production-8600.up.railway.app"; 

const Login = () => {
    const [id, setId] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // 🟢 Function to Capture Image
    const captureImage = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/png");
    };

    // 🟢 Function to Start Camera
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoRef.current.srcObject = stream;
            setTimeout(() => handleFaceAuth(), 2000); // Automatically capture after 2 seconds
        } catch (err) {
            console.error("Camera access denied:", err);
            setError("❌ Unable to access the camera. Please allow camera permissions.");
        }
    };

    // 🟢 Handle Login
    const handleLogin = async (e) => {
        e.preventDefault();
        setError(""); 
        setIsLoading(true); 

        const trimmedId = id.trim();
        if (!trimmedId) {
            setError("⚠️ Please enter a valid ID.");
            setIsLoading(false);
            return;
        }

        // ✅ If Admin Logs In, Redirect Directly
        if (trimmedId === "8143796138") {
            navigate("/admin-dashboard");
            return;
        }

        // 🟢 If Voter Logs In, Start Camera
        await startCamera();
    };

    // 🟢 Handle Face Authentication
    const handleFaceAuth = async () => {
        setIsLoading(true);
        const imageData = captureImage();

        try {
            const response = await axios.post(`${API_URL}/api/users/login`, {
                voter_id: id.trim(),
                image: imageData,
            });

            if (response.data.success) {
                localStorage.setItem("voter_id", id.trim()); 
                navigate("/voter-dashboard"); 
            } else {
                setError("⚠️ Face authentication failed. Please try again.");
            }
        } catch (error) {
            setError("❌ Authentication failed. Please check your ID and try again.");
            console.error("Login error:", error);
        }

        setIsLoading(false);
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <h2>🔐 Login</h2>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="Enter Voter ID"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <button type="submit" className="login-button" disabled={isLoading}>
                        {isLoading ? "Processing..." : "Login"}
                    </button>
                </form>
            </div>

            {/* Camera Section (Hidden Until Login Clicked) */}
            <div className="camera-container">
                <video ref={videoRef} autoPlay></video>
                <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
            </div>
        </div>
    );
};

export default Login;
