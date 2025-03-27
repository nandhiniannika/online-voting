import React from "react";
import { useNavigate } from "react-router-dom";
import "./AdminManagement.css"; // Ensure you have a CSS file for styling

const AdminDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="admin-dashboard">
            <h2>Admin Dashboard</h2>
            <div className="card-container">
                {/* Voter Management */}
                <div className="dashboard-card" onClick={() => navigate("/user-management")}>
                    <h3>Voter Management</h3>
                    <p>Manage voters, add, update, or delete voters.</p>
                </div>

                {/* Candidate Management */}
                <div className="dashboard-card" onClick={() => navigate("/candidate-management")}>
                    <h3>Candidate Management</h3>
                    <p>Manage election candidates, add, update, or remove candidates.</p>
                </div>

               
            </div>
        </div>
    );
};

export default AdminDashboard;
