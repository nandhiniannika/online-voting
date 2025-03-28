import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://online-voting-production.up.railway.app';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// 🔐 Attach token to every request
api.interceptors.request.use(config => {
    const token = Cookies.get('token') || localStorage.getItem('token'); // Fallback if Cookies fail
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// ❌ Handle unauthorized errors globally
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            Cookies.remove('token');
            localStorage.removeItem('token');

            // Optional: Redirect to login page
            window.location.href = "/login"; // Change this as needed
        }
        return Promise.reject(error);
    }
);

export default api;
