

import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Candidate.css";


const API_BASE_URL = process.env.REACT_APP_API_URL || "https://online-voting-1-hn3o.onrender.com"; 

const CandidateManagement = () => {
    const [candidates, setCandidates] = useState([]);
    const [name, setName] = useState("");
    const [party, setParty] = useState("");
    const [logo, setLogo] = useState(null);
    const [editingCandidate, setEditingCandidate] = useState(null);
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/candidates`);
            setCandidates(response.data);
        } catch (error) {
            console.error("Error fetching candidates:", error);
            setMessage("Error fetching candidates.");
        }
    };

    const handleFileChange = (event) => {
        setLogo(event.target.files[0]);
    };

    const handleAddCandidate = async (event) => {
        event.preventDefault();
    
        if (!name || !party) {
            alert("Please fill all fields.");
            return;
        }
    
        const formData = new FormData();
        formData.append("name", name);
        formData.append("party", party);
        if (logo) formData.append("logo", logo);
    
        try {
            await axios.post(`${API_BASE_URL}/api/candidates/addCandidate`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
    
            setMessage("Candidate added successfully!");
            fetchCandidates();
            setName("");
            setParty("");
            setLogo(null);
        } catch (error) {
            console.error("Error adding candidate:", error);
            setMessage("Error adding candidate. Please try again.");
        }
    };
    const handleUpdateCandidate = async (event) => {
        event.preventDefault();
    
        // Create a formData object and only append fields that are provided
        const formData = new FormData();
        if (name) formData.append("name", name);
        if (party) formData.append("party", party);
        if (logo) formData.append("logo", logo);
    
        // Prevent sending empty request
        if (!name && !party && !logo) {
            alert("Please provide at least one field to update.");
            return;
        }
    
        try {
            await axios.put(`${API_BASE_URL}/${editingCandidate._id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
    
            setMessage("Candidate updated successfully!");
            fetchCandidates();
            setEditingCandidate(null);
            setName("");
            setParty("");
            setLogo(null);
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            console.error("Error updating candidate:", error.response?.data || error.message);
        }
    };

    const handleDeleteCandidate = async (id) => {
        try {
            await axios.delete(`${API_BASE_URL}/api/candidates/delete/${id}`);
            fetchCandidates();
            setMessage("Candidate deleted successfully!");
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            console.error("Error deleting candidate:", error);
        }
    };
    const handleEditCandidate = (candidate) => {
        setEditingCandidate(candidate);
        setName(candidate.name);
        setParty(candidate.party);
        setLogo(null); // ✅ Reset logo input
    };


    return (
        <div className="candidate-management_2">
            <h2 className="title_2">Candidate Management</h2>
            {message && <div className="message">{message}</div>}
           
            <form onSubmit={handleAddCandidate}>
                <div className="form-group">
                    <input type="text" placeholder="Candidate Name" value={name} className="input-field" onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                    <input type="text" placeholder="Party Name" value={party} className="input-field" onChange={(e) => setParty(e.target.value)} required />
                </div>
                <div className="form-group">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="file-input" />
                </div>
                <button type="submit" className="add-user-button">Add Candidate</button>
            </form>

            <h3>Candidate List</h3>
            <ul className="candidate-list-2">
            {candidates.map((candidate) => (
                    <li key={candidate._id} className="candidate-card">
                        <div className="candidate-info-container">
                        <img
                            src={`${API_BASE_URL}/uploads/${candidate.logo}`}
                            alt={candidate.name}
                            className="candidate-logo"
                            onError={(e) => { e.target.src = "/default-logo.png"; }}
                        />
                        <div className="candidate-details">
                                <h4 className="candidate-name">{candidate.name}</h4>
                                <p className="candidate-party">{candidate.party}</p>
                                <p className="vote-count">Votes: {candidate.voteCount}</p> {/* ✅ Fixed Vote Count Display */}
                            </div>
                        </div>
                        <div className="button-group">
                            <button onClick={() => handleEditCandidate(candidate)} className="update-button">Update</button>
                            <button onClick={() => handleDeleteCandidate(candidate._id)} className="delete-button">Delete</button> {/* ✅ Added Vote Button */}
                        </div>
                    </li>
                ))}
            </ul>
           {editingCandidate && (
                <form className="update-form" onSubmit={handleUpdateCandidate}>
                    <h3>Update Candidate</h3>
                    <input type="text" value={name} className="input-field" onChange={(e) => setName(e.target.value)} required />
                    <input type="text" value={party} className="input-field" onChange={(e) => setParty(e.target.value)} required />
                    <input type="file" accept="image/*" onChange={handleFileChange} className="file-input" />
                    <div className="button-group">
                        <button type="submit" className="save-button">Save</button>
                        <button type="button" onClick={() => setEditingCandidate(null)} className="cancel-button">Cancel</button>
                    </div>
                </form>
            )}  
        </div>
    );
};

export default CandidateManagement;
