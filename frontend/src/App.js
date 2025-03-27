import { Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import AdminManagement from "./components/AdminManagement";
import UserManagement from "./components/UserManagement";
import CandidateManagement from "./components/CandidateManagement";
import VoterDashboard from "./components/VoterDashboard";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/admin-dashboard" element={<AdminManagement />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/candidate-management" element={<CandidateManagement />} />
            <Route path="/voter-dashboard" element={<VoterDashboard />} />
        </Routes>
    );
}

export default App;
