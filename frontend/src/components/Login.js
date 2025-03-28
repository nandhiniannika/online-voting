import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import axios from "axios";


const API_URL = process.env.REACT_APP_API_URL || "https://online-voting-production.up.railway.app"; 

const Login = () => {
    const [id, setId] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(""); // Clear previous errors
        setIsLoading(true); // Start loading

        const trimmedId = id.trim(); // Ensure no accidental spaces

        if (!trimmedId) {
            setError("⚠️ Please enter a valid ID.");
            setIsLoading(false);
            return;
        }

        if (trimmedId === "8143796138") {
            navigate("/admin-dashboard"); // ✅ Redirect to Admin Dashboard
            return;
        }

        try {
            const response = await axios.post(`${API_URL}/api/users/login`, { voter_id: trimmedId });

            if (response.data.success) {
                localStorage.setItem("voter_id", trimmedId); // ✅ Store voter_id in localStorage
                navigate("/voter-dashboard"); // ✅ Redirect to Voter Dashboard
            } else {
                setError(response.data.message || "⚠️ Invalid ID. Please try again.");
            }
        } catch (error) {
            setError("❌ Authentication failed. Please check your ID and try again.");
            console.error("Login error:", error);
        }

        setIsLoading(false); // Stop loading
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
                            disabled={isLoading} // Disable input while loading
                        />
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <button type="submit" className="login-button" disabled={isLoading}>
                        {isLoading ? "Logging in..." : "Login"} {/* ✅ Show loading state */}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
