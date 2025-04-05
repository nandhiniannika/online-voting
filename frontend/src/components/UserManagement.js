import React, { useEffect, useState } from "react";

const UserManagement = () => {
    const [voters, setVoters] = useState([]);
    const [voterID, setVoterID] = useState("");
    const [selectedVoter, setSelectedVoter] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const API_BASE = "http://online-voting-production-8600.up.railway.app/api/users";

    // Fetch all voters
    const fetchVoters = async () => {
        try {
            setLoading(true);
            const response = await fetch(API_BASE);
            const data = await response.json();
            setVoters(data);
        } catch (err) {
            console.error("❌ Error fetching voters:", err);
            setError("Failed to load voters");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVoters();
    }, []);

    // Add or Update Voter
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!voterID.trim()) {
            alert("Voter ID cannot be empty!");
            return;
        }

        const formData = new FormData();
        formData.append("voter_id", voterID);
        if (imageFile) formData.append("image", imageFile);

        try {
            setLoading(true);
            const url = selectedVoter ? `${API_BASE}/update/${selectedVoter._id}` : `${API_BASE}/addvoter`;
            const method = selectedVoter ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                body: selectedVoter ? formData : JSON.stringify({ voter_id: voterID }),
                headers: selectedVoter ? undefined : { "Content-Type": "application/json" },
            });

            const data = await response.json();

            if (data.success) {
                alert(`✅ Voter ${selectedVoter ? "updated" : "added"} successfully!`);
                setVoterID("");
                setSelectedVoter(null);
                setImageFile(null);
                fetchVoters();
            } else {
                alert(`❌ Error: ${data.message || data.error}`);
            }
        } catch (err) {
            console.error("❌ Submit error:", err);
            alert("Something went wrong!");
        } finally {
            setLoading(false);
        }
    };

    const deleteVoter = async (id) => {
        if (!window.confirm("Are you sure you want to delete this voter?")) return;

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/delete/${id}`, { method: "DELETE" });
            const data = await response.json();
            if (data.success) {
                alert("✅ Voter deleted successfully!");
                fetchVoters();
            } else {
                alert(`❌ Error: ${data.message}`);
            }
        } catch (error) {
            console.error("❌ Error deleting voter:", error);
        } finally {
            setLoading(false);
        }
    };

    const editVoter = (voter) => {
        setVoterID(voter.voter_id);
        setSelectedVoter(voter);
    };

    return (
        <div>
            <h2>🗳️ Voter Management</h2>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Enter Voter ID"
                    value={voterID}
                    onChange={(e) => setVoterID(e.target.value)}
                />
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                />
                <button type="submit" disabled={loading}>
                    {loading
                        ? selectedVoter
                            ? "Updating..."
                            : "Adding..."
                        : selectedVoter
                        ? "Update Voter"
                        : "Add Voter"}
                </button>
                {selectedVoter && (
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedVoter(null);
                            setVoterID("");
                            setImageFile(null);
                        }}
                    >
                        Cancel
                    </button>
                )}
            </form>

            {loading && <p>Loading voters...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            <ul>
                {voters.map((voter) => (
                    <li key={voter._id}>
                        {voter.voter_id}{" "}
                        <button onClick={() => editVoter(voter)}>Edit</button>{" "}
                        <button onClick={() => deleteVoter(voter._id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default UserManagement;
