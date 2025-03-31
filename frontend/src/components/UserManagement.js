import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./UserManagement.css";

const API_URL = process.env.REACT_APP_API_URL || "https://online-voting-production-8600.up.railway.app";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [voterId, setVoterId] = useState("");
  const [message, setMessage] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users`);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage("Error fetching users.");
    }
  };

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setMessage("Error accessing camera.");
    }
  };

  const stopCamera = () => {
    setIsCapturing(false);
    if (videoRef.current && videoRef.current.srcObject) {
      let stream = videoRef.current.srcObject;
      let tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureAndAddUser = async (e) => {
    e.preventDefault();
    if (!voterId) {
      setMessage("Please enter a Voter ID before adding.");
      return;
    }

    await startCamera();

    setTimeout(() => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setMessage("Failed to capture image.");
          return;
        }

        const formData = new FormData();
        formData.append("voter_id", voterId);
        formData.append("image", blob, `${voterId}.jpg`);

        try {
          await axios.post(`${API_URL}/api/users/addvoter`, formData);
          setMessage("User added successfully!");

          // 🔥 Trigger Face Recognition after adding voter
          await axios.post(`${API_URL}/api/users/add_faces`, { voter_id: voterId });

          fetchUsers();
          setVoterId("");
          stopCamera();
        } catch (error) {
          console.error("Error adding user:", error);
          setMessage("Error adding user.");
        }
      }, "image/jpeg");
    }, 10000); // Captures after 10 seconds
  };

  const handleDeleteUser = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/users/delete/${id}`);
      setMessage("User deleted successfully!");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      setMessage("Error deleting user.");
    }
  };

  return (
    <div className="user-management">
      <h2>User Management</h2>
      {message && <div className="message">{message}</div>}

      <form onSubmit={captureAndAddUser}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Enter Voter ID"
            value={voterId}
            onChange={(e) => setVoterId(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="add-user-button">
          Add User
        </button>
      </form>

      {isCapturing && (
        <>
          <video ref={videoRef} autoPlay className="video-preview" />
          <canvas ref={canvasRef} style={{ display: "none" }} width="640" height="480"></canvas>
        </>
      )}

      <h3>User List</h3>
      <div className="user-list">
        {users.map((user) => (
          <div key={user._id} className="user-card">
            <img src={`${API_URL}/uploads/${user.image_filename || "default.jpg"}`} alt="User" className="user-image" />
            <h4>{user.voter_id}</h4>
            <button className="delete-button" onClick={() => handleDeleteUser(user._id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;
