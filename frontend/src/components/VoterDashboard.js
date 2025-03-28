import React, { useEffect, useState } from "react";
import axios from "axios";
import "./VoterDashboard.css";

const API_URL = process.env.REACT_APP_API_URL || "https://online-voting-production.up.railway.app"; // Ensure it uses deployed backend


const VoterDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [isVerified, setIsVerified] = useState(false);
  const [hasVoted, setHasVoted] = useState(localStorage.getItem("hasVoted") === "true");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const voterId = localStorage.getItem("voter_id");

  useEffect(() => {
    const verifyVoter = async () => {
      if (!voterId) {
        console.error("❌ No voter ID found.");
        setIsLoading(false);
        return;
      }

      try {
        console.log(`🔍 Checking voter ID: ${voterId}`);
        const response = await axios.get(`${API_URL}/api/voter/check-vote/${voterId}`);

        console.log("✅ API Response:", response.data);

        if (response.data.success) {
          if (response.data.hasVoted) {
            console.log("🎉 Voter has already voted.");
            setHasVoted(true);
            localStorage.setItem("hasVoted", "true");
            setIsVerified(false);
          } else {
            setHasVoted(false);
            localStorage.removeItem("hasVoted");
            setIsVerified(true);
            fetchCandidates();
          }
        } else {
          console.error("❌ Voter verification failed:", response.data.message);
          setIsVerified(false);
        }
      } catch (error) {
        console.error("❌ Error verifying voter:", error.response?.data || error.message);
        setIsVerified(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyVoter();
  }, [voterId]);

  const fetchCandidates = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/candidates`);
      setCandidates(response.data);
    } catch (error) {
      console.error("❌ Error fetching candidates:", error);
    }
  };

  const handleVote = async (candidate) => {
    if (!candidate || hasVoted) return;

    setSelectedCandidate(candidate); // Show immediate feedback (button disable)

    try {
      console.log(`🗳 Voting for Candidate: ${candidate.name}`);

      const response = await axios.post(`${API_URL}/api/voter/vote`, {
        voterId,
        candidateId: candidate._id,
      });

      console.log("📨 Vote Response:", response.data);

      if (response.data.success) {
        localStorage.setItem("hasVoted", "true");
        setHasVoted(true);
        setIsVerified(false); // Prevent further voting
      } else {
        console.error("⚠️ Voting failed:", response.data.message);
      }
    } catch (error) {
      console.error("❌ Error voting:", error.response?.data || error.message);
    }
  };

  return (
    <div className="voter-dashboard">
      <h2>🗳 Online Voting System</h2>

      {isLoading ? (
        <p>⏳ Verifying Voter ID...</p>
      ) : hasVoted ? (
        <h3>✅ Thanks for Voting!</h3>
      ) : isVerified ? (
        <div>
          <h3>Select a Candidate:</h3>
          {candidates.length === 0 ? (
            <p>⏳ Loading candidates...</p>
          ) : (
            <div className="candidates-container">
              {candidates.map((candidate) => (
                <div className="candidate-row" key={candidate._id}>
                  <img
                    src={`${API_URL}/uploads/${candidate.logo}`}
                    alt={candidate.name}
                    className="candidate-logo"
                  />
                  <div className="candidate-info">
                    <h3>{candidate.name}</h3>
                    <p>Party: {candidate.party}</p>
                  </div>
                  <button
                    onClick={() => handleVote(candidate)}
                    className="vote-button"
                    disabled={selectedCandidate !== null}
                  >
                    {selectedCandidate && selectedCandidate._id === candidate._id
                      ? "Voted ✅"
                      : "Vote"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <h3>✅ Thanks for Voting!</h3>
      )}
    </div>
  );
};

export default VoterDashboard;
