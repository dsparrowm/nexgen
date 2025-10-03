/**
 * Authentication Context for Admin Application
 * Manages admin authentication state globally
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, AdminData, ApiResponse } from '@/lib/api';

interface AuthContextType {
    admin: AdminData | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [admin, setAdmin] = useState<AdminData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const checkAuth = async () => {
            setIsLoading(true);

            // First check if we have stored admin data
            const storedAdmin = apiClient.getStoredAdmin();
            const accessToken = apiClient.getAccessToken();

            if (storedAdmin && accessToken) {
                // Verify token is still valid by fetching profile
                const response = await apiClient.getProfile();

                if (response.success && response.data?.admin) {
                    setAdmin(response.data.admin);
                } else {
                    // Token is invalid, clear stored data
                    apiClient.clearAuth();
                    setAdmin(null);
                }
            } else {
                // No stored auth data
                apiClient.clearAuth();
                setAdmin(null);
            }

            setIsLoading(false);
        };

        checkAuth();
    }, []);

    /**
     * Login admin user
     */
    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await apiClient.login(email, password);

            if (response.success && response.data) {
                setAdmin(response.data.admin);
                return { success: true };
            } else {
                return {
                    success: false,
                    error: response.error?.message || 'Login failed. Please try again.',
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'An unexpected error occurred',
            };
        }
    };

    /**
     * Logout admin user
     */
    const logout = async (): Promise<void> => {
        try {
            // Call logout endpoint
            await apiClient.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always clear local state and storage
            apiClient.clearAuth();
            setAdmin(null);
        }
    };

    /**
     * Refresh admin profile data
     */
    const refreshProfile = async (): Promise<void> => {
        try {
            const response = await apiClient.getProfile();

            if (response.success && response.data?.admin) {
                setAdmin(response.data.admin);
                apiClient.setStoredAdmin(response.data.admin);
            }
        } catch (error) {
            console.error('Profile refresh error:', error);
        }
    };

    const value: AuthContextType = {
        admin,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
        refreshProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use authentication context
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};

/**
 * Hook to require authentication
 * Redirects to login if not authenticated
 */
export const useRequireAuth = () => {
    const { admin, isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            // Redirect to login page
            if (typeof window !== 'undefined') {
                window.location.href = '/';
            }
        }
    }, [isAuthenticated, isLoading]);

    return { admin, isLoading };
};
