import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
    baseURL: 'http://localhost:8000',
    withCredentials: true,
});

api.interceptors.request.use(config => {
    const token = Cookies.get('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response.status === 401) {
            // Handle unauthorized access
            Cookies.remove('token');
            // Redirect to login or show a message
        }
        return Promise.reject(error);
    }
);

export default api;