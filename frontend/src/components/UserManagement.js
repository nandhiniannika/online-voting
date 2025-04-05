import React, { useEffect, useState } from "react";

const UserManagement = () => {
  const [voters, setVoters] = useState([]);
  const [voterID, setVoterID] = useState("");
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = "http://online-voting-production-8600.up.railway.app/api/users";

  const fetchVoters = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/getvoters`);
      const data = await response.json();

      if (data.success) {
        setVoters(data.voters);
      } else {
        throw new Error(data.message || "Failed to fetch voters");
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!voterID.trim()) {
      alert("Voter ID cannot be empty!");
      return;
    }

    try {
      setLoading(true);

      if (selectedVoter) {
        // Update voter logic (image optional)
        const formData = new FormData();
        formData.append("voter_id", voterID);
        if (imageFile) formData.append("image", imageFile);

        const response = await fetch(`${API_BASE}/update/${selectedVoter._id}`, {
          method: "PUT",
          body: formData,
        });

        const data = await response.json();
        if (data.success) {
          alert("✅ Voter updated successfully!");
          resetForm();
          fetchVoters();
        } else {
          throw new Error(data.message || "Update failed");
        }
      } else {
        // Add voter logic
        const response = await fetch(`${API_BASE}/addvoter`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voter_id: voterID }),
        });

        const data = await response.json();
        if (data.success) {
          alert("✅ Voter added successfully!");
          resetForm();
          fetchVoters();
        } else {
          throw new Error(data.message || "Add failed");
        }
      }
    } catch (err) {
      console.error("❌ Submit error:", err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteVoter = async (id) => {
    if (!window.confirm("Are you sure you want to delete this voter?")) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/deletevoter/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        alert("✅ Voter deleted successfully!");
        fetchVoters();
      } else {
        throw new Error(data.message || "Delete failed");
      }
    } catch (error) {
      console.error("❌ Error deleting voter:", error.message);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const editVoter = (voter) => {
    setVoterID(voter.voter_id);
    setSelectedVoter(voter);
  };

  const resetForm = () => {
    setVoterID("");
    setSelectedVoter(null);
    setImageFile(null);
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
          <button type="button" onClick={resetForm}>
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
            <button onClick={() => deleteVoter(voter.voter_id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserManagement;
