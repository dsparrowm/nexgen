/**
 * Authentication utility functions for handling user authentication
 */

/**
 * Check if user is authenticated by verifying token exists
 */
export const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false;

    const token = localStorage.getItem('authToken');
    return !!token;
};

/**
 * Get the authentication token from localStorage
 */
export const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;

    return localStorage.getItem('authToken');
};

/**
 * Get the refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
    if (typeof window === 'undefined') return null;

    return localStorage.getItem('refreshToken');
};

/**
 * Get user data from localStorage
 */
export const getUser = (): any | null => {
    if (typeof window === 'undefined') return null;

    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
        return JSON.parse(userStr);
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
};

/**
 * Check if JWT token is expired
 */
export const isTokenExpired = (): boolean => {
    if (typeof window === 'undefined') return true;

    const token = getToken();
    if (!token) return true;

    try {
        // Decode JWT token (without verification - just to check expiration)
        const parts = token.split('.');
        if (parts.length !== 3) return true; // Invalid token format

        const base64Url = parts[1];
        if (!base64Url) return true; // No payload

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        const payload = JSON.parse(jsonPayload);

        // Check if token has expiration
        if (!payload.exp) return false;

        // Check if token is expired (with 5 second buffer)
        const currentTime = Math.floor(Date.now() / 1000);
        return payload.exp < currentTime + 5;
    } catch (error) {
        console.error('Error checking token expiration:', error);
        return true; // Assume expired if error
    }
};

/**
 * Get time until token expiration in seconds
 * Returns 0 if token is expired or invalid
 */
export const getTokenExpirationTime = (): number => {
    if (typeof window === 'undefined') return 0;

    const token = getToken();
    if (!token) return 0;

    try {
        const parts = token.split('.');
        if (parts.length !== 3) return 0;

        const base64Url = parts[1];
        if (!base64Url) return 0;

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        const payload = JSON.parse(jsonPayload);

        if (!payload.exp) return 0;

        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = payload.exp - currentTime;

        return timeUntilExpiry > 0 ? timeUntilExpiry : 0;
    } catch (error) {
        console.error('Error getting token expiration time:', error);
        return 0;
    }
};

/**
 * Refresh the authentication token using the refresh token
 * @returns Promise<boolean> - true if refresh was successful, false otherwise
 */
export const refreshAuthToken = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        console.error('No refresh token available');
        return false;
    }

    try {
        // Import axiosInstance dynamically to avoid circular dependencies
        const { default: axiosInstance } = await import('@/lib/axiosInstance');

        const response = await axiosInstance.post('/api/auth/user/refresh', {
            refreshToken
        });

        if (response.data.success && response.data.data?.tokens) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
            const user = getUser(); // Keep existing user data

            // Update tokens in localStorage
            saveAuthData(accessToken, newRefreshToken, user);

            console.log('Token refreshed successfully');
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error refreshing token:', error);
        return false;
    }
};

/**
 * Save authentication tokens and user data to localStorage
 */
export const saveAuthData = (authToken: string, refreshToken: string, user: any): void => {
    if (typeof window === 'undefined') return;

    localStorage.setItem('authToken', authToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Logout utility functions for handling user authentication
 */

export const logout = async () => {
    try {
        // Clear any stored authentication tokens
        localStorage.removeItem('authToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')

        // Clear session storage
        sessionStorage.clear()

        // Clear any cookies related to authentication
        document.cookie.split(";").forEach((c) => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
        })

        // If you're using an API endpoint for logout, uncomment and modify this:
        // await fetch('/api/auth/logout', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        // })

        // Redirect to login page or home page
        window.location.href = '/'

    } catch (error) {
        console.error('Logout error:', error)
        // Even if there's an error, redirect to ensure user is logged out from UI perspective
        window.location.href = '/'
    }
}

export const confirmLogout = () => {
    const confirmed = window.confirm('Are you sure you want to log out?')
    if (confirmed) {
        logout()
    }
    return confirmed
}