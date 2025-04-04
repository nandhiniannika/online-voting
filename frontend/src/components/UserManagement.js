import React, { useEffect, useState } from "react";

const UserManagement = () => {
    const [voters, setVoters] = useState([]);
    const [voterID, setVoterID] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all voters
    const fetchVoters = async () => {
        try {
            setLoading(true);
            const response = await fetch("http://localhost:5000/api/voters/");
            const data = await response.json();
            setVoters(data);
            setLoading(false);
        } catch (error) {
            console.error("❌ Error fetching voters:", error);
            setError("Failed to load voters");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVoters();
    }, []);

    // Add Voter
    const addVoter = async () => {
        if (!voterID.trim()) {
            alert("Voter ID cannot be empty!");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch("http://localhost:5000/api/voters/addvoter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ voter_id: voterID }),
            });

            const data = await response.json();
            if (data.success) {
                alert("✅ Voter added successfully!");
                setVoterID("");
                fetchVoters(); // Refresh the voter list
            } else {
                alert(`❌ Error: ${data.error}`);
            }
            setLoading(false);
        } catch (error) {
            console.error("❌ Error adding voter:", error);
            alert("Failed to add voter!");
            setLoading(false);
        }
    };

    // Delete Voter
    const deleteVoter = async (id) => {
        if (!window.confirm("Are you sure you want to delete this voter?")) return;

        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5000/api/voters/delete/${id}`, {
                method: "DELETE",
            });

            const data = await response.json();
            if (data.success) {
                alert("✅ Voter deleted successfully!");
                fetchVoters();
            } else {
                alert(`❌ Error: ${data.message}`);
            }
            setLoading(false);
        } catch (error) {
            console.error("❌ Error deleting voter:", error);
            alert("Failed to delete voter!");
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Voter Management</h2>

            {/* Add Voter Section */}
            <div>
                <input
                    type="text"
                    placeholder="Enter Voter ID"
                    value={voterID}
                    onChange={(e) => setVoterID(e.target.value)}
                />
                <button onClick={addVoter} disabled={loading}>
                    {loading ? "Adding..." : "Add Voter"}
                </button>
            </div>

            {/* Voter List */}
            {loading && <p>Loading voters...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            <ul>
                {voters.map((voter) => (
                    <li key={voter._id}>
                        {voter.voter_id} 
                        <button onClick={() => deleteVoter(voter._id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default UserManagement;
