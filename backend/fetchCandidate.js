const fetchCandidates = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/candidates'); // Adjust endpoint as needed
        if (!response.ok) {
            throw new Error('Failed to fetch candidates');
        }
        const data = await response.json();
        setCandidates(data);
    } catch (error) {
        setMessage('Error fetching candidates.');
        console.error('Fetch error:', error);
    }
};

const handleAddCandidate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", candidateName);
    formData.append("party", candidateParty);
    if (logo) {
        formData.append("logo", logo);
    }

    try {
        const response = await fetch("http://localhost:5000/api/candidates", { // ✅ Remove `/add`
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error("Failed to add candidate");
        }

        setMessage("Candidate added successfully!");
        fetchCandidates(); // Refresh the list
        setCandidateName(""); // Clear input
        setCandidateParty("");
        setLogo(null);
    } catch (error) {
        setMessage("Error adding candidate.");
        console.error("Add candidate error:", error);
    }
};

