import axios from 'axios';

// Normalize NEXT_PUBLIC_API_URL: strip trailing slash if present
const rawBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const NORMALIZED_BASE = rawBase.replace(/\/+$/, ''); // remove trailing slashes

// Export helper so other modules can build consistent API_BASE_URLs
export function getApiBase(includeApiSegment = false) {
    if (!includeApiSegment) return NORMALIZED_BASE + '/';
    // If the normalized base already ends with /api, don't append again
    if (NORMALIZED_BASE.endsWith('/api')) return NORMALIZED_BASE + '/';
    return `${NORMALIZED_BASE}/api/`;
}

// Create axios instance with base configuration (no trailing slash)
const axiosInstance = axios.create({
    baseURL: NORMALIZED_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh and errors
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            // Redirect to login if not already there
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;