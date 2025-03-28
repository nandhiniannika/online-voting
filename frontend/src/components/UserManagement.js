import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserManagement.css';


const API_URL = process.env.REACT_APP_API_URL || "https://online-voting-1-hn3o.onrender.com"; 

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [voterId, setVoterId] = useState('');
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState('');
  const [editUser_Id, setEditUser_Id] = useState(null);
  const [editVoterId, setEditVoterId] = useState('');
  const [editImage, setEditImage] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users`);
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
      await axios.post(`${API_URL}/api/users/addvoter`, formData);
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
      await axios.delete(`${API_URL}/api/users/delete/${id}`);
      setMessage('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage('Error deleting user.');
    }
  };

  const handleEditClick = (user) => {
    setEditUser_Id(user._id);
    setEditVoterId(user.voter_id);
    setEditImage(null);
  };

  const handleCancelEdit = () => {
    setEditUser_Id(null);
    setEditVoterId('');
    setEditImage(null);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser_Id) {
      setMessage('No user selected to update.');
      return;
    }

    const formData = new FormData();
    formData.append('voter_id', editVoterId);
    if (editImage) formData.append('image', editImage);

    try {
      await axios.put(`${API_URL}/api/users/update/${editUser_Id}`, formData);
      setMessage('User updated successfully!');
      fetchUsers();
      handleCancelEdit();
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage('Error updating user.');
    }
  };

  return (
    <div className="user-management">
      <h2>User Management</h2>
      {message && <div className="message">{message}</div>}

      <form onSubmit={handleAddUser}>
        <div className="form-group">
          <input type="text" placeholder="Enter Voter ID" value={voterId} onChange={(e) => setVoterId(e.target.value)} required />
        </div>
        <div className="form-group">
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
        </div>
        <button type="submit" className="add-user-button">Add User</button>
      </form>

      <h3>User List</h3>
      <div className="user-list">
        {users.map((user) => (
          <div key={user._id} className="user-card">
            <img src={`${API_URL}/uploads/${user.image_filename || 'default.jpg'}`} alt="User" className="user-image" />
            <h4>{user.voter_id}</h4>
            <button className="delete-button" onClick={() => handleDeleteUser(user._id)}>Delete</button>
            <button className="update-button" onClick={() => handleEditClick(user)}>Update</button>
          </div>
        ))}
      </div>

      {editUser_Id && (
        <div className="update-form">
          <h3>Update User</h3>
          <form onSubmit={handleUpdateUser}>
            <div className="form-group">
              <label>Voter ID:</label>
              <input type="text" value={editVoterId} onChange={(e) => setEditVoterId(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>New Image (optional):</label>
              <input type="file" accept="image/*" onChange={(e) => setEditImage(e.target.files[0])} />
            </div>
            <div className="button-container">
              <button type="submit" className="save-button">Save</button>
              <button type="button" className="cancel-button" onClick={handleCancelEdit}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserManagement;