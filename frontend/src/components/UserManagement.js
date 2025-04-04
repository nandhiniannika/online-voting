import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './UserManagement.css';

const API_BASE_URL = "https://online-voting-production-8600.up.railway.app/api";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [voterId, setVoterId] = useState('');
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // For updating a user
  const [editUserId, setEditUserId] = useState(null);
  const [editVoterId, setEditVoterId] = useState('');
  const [editImage, setEditImage] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('Error fetching users.');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('voter_id', voterId);
    if (image) formData.append('image', image);

    try {
      await axios.post(`${API_BASE_URL}/users/addvoter`, formData);
      setMessage('User added successfully!');
      fetchUsers();
      setVoterId('');
      setImage(null);
    } catch (error) {
      console.error('Error adding user:', error);
      setMessage('Error adding user.');
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/users/delete/${id}`);
      setMessage('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage('Error deleting user.');
    }
  };

  const handleEditClick = (user) => {
    setEditUserId(user._id);
    setEditVoterId(user.voter_id);
    setEditImage(null);
  };

  const handleCancelEdit = () => {
    setEditUserId(null);
    setEditVoterId('');
    setEditImage(null);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUserId) return;

    const formData = new FormData();
    formData.append('voter_id', editVoterId);
    if (editImage) formData.append('image', editImage);

    try {
      await axios.put(`${API_BASE_URL}/users/update/${editUserId}`, formData);
      setMessage('User updated successfully!');
      fetchUsers();
      handleCancelEdit();
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage('Error updating user.');
    }
  };

  const handleVote = async (voterId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/recognize`, { voter_id: voterId });
      if (response.data.success) {
        navigate('/voting');
      } else {
        setMessage('Face recognition failed.');
      }
    } catch (error) {
      console.error('Error recognizing face:', error);
      setMessage('Error recognizing face.');
    }
  };

  return (
    <div className="user-management">
      <h2>User Management</h2>
      {message && <div className="message">{message}</div>}

      <form onSubmit={handleAddUser}>
        <input type="text" placeholder="Enter Voter ID" value={voterId} onChange={(e) => setVoterId(e.target.value)} required />
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
        <button type="submit">Add User</button>
      </form>

      <h3>User List</h3>
      <div className="user-list">
        {users.map((user) => (
          <div key={user._id} className="user-card">
            <img src={`${API_BASE_URL}/uploads/${user.image_filename || 'default.jpg'}`} alt="User" className="user-image" />
            <h4>{user.voter_id}</h4>
            <button onClick={() => handleDeleteUser(user._id)}>Delete</button>
            <button onClick={() => handleEditClick(user)}>Update</button>
            <button onClick={() => handleVote(user.voter_id)}>Vote</button>
          </div>
        ))}
      </div>

      {editUserId && (
        <div className="update-form">
          <h3>Update User</h3>
          <form onSubmit={handleUpdateUser}>
            <input type="text" value={editVoterId} onChange={(e) => setEditVoterId(e.target.value)} required />
            <input type="file" accept="image/*" onChange={(e) => setEditImage(e.target.files[0])} />
            <button type="submit">Save</button>
            <button type="button" onClick={handleCancelEdit}>Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserManagement;