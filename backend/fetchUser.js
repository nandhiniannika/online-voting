const fetchUsers = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/users'); // Adjust the endpoint as needed
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
    } catch (error) {
        setMessage('Error fetching users.');
        console.error('Fetch error:', error);
    }
};

const handleAddUser  = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('voter_id', voterId);
    if (image) {
        formData.append('image', image);
    }

    try {
        const response = await fetch('http://localhost:5000/api/users/addvoter', {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            throw new Error('Failed to add user');
        }
        setMessage('User  added successfully!');
        fetchUsers(); // Refresh the user list
        setVoterId(''); // Clear the input field
        setImage(null); // Clear the image input
    } catch (error) {
        setMessage('Error adding user.');
        console.error('Add user error:', error);
    }
};