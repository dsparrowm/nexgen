/**
 * API Client for NexGen Admin Application
 * Handles all API requests with authentication, error handling, and token management
 */

// Normalize NEXT_PUBLIC_API_URL for admin app (ensure no trailing slash, include /api)
const rawAdminBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_BASE_URL = `${rawAdminBase.replace(/\/+$/, '')}/api`;

// Token storage keys
const ACCESS_TOKEN_KEY = 'nexgen_admin_access_token';
const REFRESH_TOKEN_KEY = 'nexgen_admin_refresh_token';
const ADMIN_USER_KEY = 'nexgen_admin_user';

interface ApiError {
    message: string;
    code?: string;
    details?: any;
}

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ApiError;
    message?: string;
}

interface AdminData {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'SUPER_ADMIN';
    isVerified: boolean;
    createdAt: string;
    lastLogin: string;
}

interface Tokens {
    accessToken: string;
    refreshToken: string;
}

interface LoginResponse {
    admin: AdminData;
    tokens: Tokens;
}

class ApiClient {
    private baseUrl: string;
    private isRefreshing = false;
    private refreshSubscribers: Array<(token: string) => void> = [];

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    /**
     * Get stored access token
     */
    getAccessToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    }

    /**
     * Get stored refresh token
     */
    getRefreshToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    }

    /**
     * Store tokens in localStorage
     */
    setTokens(tokens: Tokens): void {
        if (typeof window === 'undefined') return;
        localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }

    /**
     * Clear all stored authentication data
     */
    clearAuth(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(ADMIN_USER_KEY);
    }

    /**
     * Get stored admin user data
     */
    getStoredAdmin(): AdminData | null {
        if (typeof window === 'undefined') return null;
        const stored = localStorage.getItem(ADMIN_USER_KEY);
        if (!stored) return null;
        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    }

    /**
     * Store admin user data
     */
    setStoredAdmin(admin: AdminData): void {
        if (typeof window === 'undefined') return;
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(admin));
    }

    /**
     * Subscribe to token refresh
     */
    private subscribeTokenRefresh(callback: (token: string) => void): void {
        this.refreshSubscribers.push(callback);
    }

    /**
     * Notify all subscribers of new token
     */
    private onTokenRefreshed(token: string): void {
        this.refreshSubscribers.forEach((callback) => callback(token));
        this.refreshSubscribers = [];
    }

    /**
     * Refresh access token using refresh token
     */
    private async refreshAccessToken(): Promise<string | null> {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            return null;
        }

        try {
            const response = await fetch(`${this.baseUrl}/auth/admin/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });

            const data: ApiResponse<{ tokens: Tokens }> = await response.json();

            if (data.success && data.data?.tokens) {
                this.setTokens(data.data.tokens);
                return data.data.tokens.accessToken;
            }

            return null;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return null;
        }
    }

    /**
     * Make authenticated API request
     */
    private async request<T = any>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;
        const accessToken = this.getAccessToken();

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        try {
            let response = await fetch(url, {
                ...options,
                headers,
            });

            // Handle 401 Unauthorized - try to refresh token
            if (response.status === 401 && accessToken && endpoint !== '/auth/admin/refresh') {
                if (!this.isRefreshing) {
                    this.isRefreshing = true;
                    const newToken = await this.refreshAccessToken();
                    this.isRefreshing = false;

                    if (newToken) {
                        this.onTokenRefreshed(newToken);
                        // Retry original request with new token
                        headers['Authorization'] = `Bearer ${newToken}`;
                        response = await fetch(url, {
                            ...options,
                            headers,
                        });
                    } else {
                        // Refresh failed, clear auth and redirect to login
                        this.clearAuth();
                        if (typeof window !== 'undefined') {
                            window.location.href = '/';
                        }
                        return {
                            success: false,
                            error: {
                                message: 'Session expired. Please login again.',
                                code: 'SESSION_EXPIRED',
                            },
                        };
                    }
                } else {
                    // Wait for token refresh to complete
                    const newToken = await new Promise<string>((resolve) => {
                        this.subscribeTokenRefresh(resolve);
                    });
                    headers['Authorization'] = `Bearer ${newToken}`;
                    response = await fetch(url, {
                        ...options,
                        headers,
                    });
                }
            }

            const data: ApiResponse<T> = await response.json();

            // Handle other HTTP errors
            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || {
                        message: `Request failed with status ${response.status}`,
                        code: 'REQUEST_FAILED',
                    },
                };
            }

            return data;
        } catch (error) {
            console.error('API request error:', error);
            return {
                success: false,
                error: {
                    message: error instanceof Error ? error.message : 'Network error occurred',
                    code: 'NETWORK_ERROR',
                },
            };
        }
    }

    /**
     * Login admin user
     */
    async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
        const response = await this.request<LoginResponse>('/auth/admin/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (response.success && response.data) {
            this.setTokens(response.data.tokens);
            this.setStoredAdmin(response.data.admin);
        }

        return response;
    }

    /**
     * Logout admin user
     */
    async logout(): Promise<ApiResponse<void>> {
        const response = await this.request<void>('/auth/admin/logout', {
            method: 'POST',
        });

        // Clear local storage regardless of response
        this.clearAuth();

        return response;
    }

    /**
     * Get admin profile
     */
    async getProfile(): Promise<ApiResponse<{ admin: AdminData }>> {
        return this.request<{ admin: AdminData }>('/auth/admin/profile');
    }

    /**
     * Get dashboard statistics
     */
    async getDashboardStats(): Promise<ApiResponse<any>> {
        return this.request('/admin/dashboard/stats');
    }

    /**
     * Get all transactions with filtering and pagination
     */
    async getTransactions(params?: {
        page?: number;
        limit?: number;
        status?: string;
        type?: string;
        userId?: string;
        search?: string;
    }): Promise<ApiResponse<any>> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.status) queryParams.append('status', params.status);
        if (params?.type) queryParams.append('type', params.type);
        if (params?.userId) queryParams.append('userId', params.userId);
        if (params?.search) queryParams.append('search', params.search);

        const query = queryParams.toString();
        return this.request(`/admin/transactions${query ? `?${query}` : ''}`);
    }

    /**
     * Approve a transaction
     */
    async approveTransaction(transactionId: string, notes?: string): Promise<ApiResponse<any>> {
        return this.post(`/admin/transactions/${transactionId}/approve`, { notes });
    }

    /**
     * Reject a transaction
     */
    async rejectTransaction(transactionId: string, reason?: string, notes?: string): Promise<ApiResponse<any>> {
        return this.post(`/admin/transactions/${transactionId}/reject`, { reason, notes });
    }

    /**
     * Get all users (with pagination)
     */
    async getUsers(params?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        role?: string;
    }): Promise<ApiResponse<any>> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.role) queryParams.append('role', params.role);

        const query = queryParams.toString();
        return this.request(`/admin/users${query ? `?${query}` : ''}`);
    }

    /**
     * Get user by ID
     */
    async getUserById(userId: string): Promise<ApiResponse<any>> {
        return this.request(`/admin/users/${userId}`);
    }

    /**
     * Update user
     */
    async updateUser(userId: string, data: any): Promise<ApiResponse<any>> {
        return this.request(`/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    /**
     * Delete user (soft delete)
     */
    async deleteUser(userId: string): Promise<ApiResponse<any>> {
        return this.request(`/admin/users/${userId}`, {
            method: 'DELETE',
        });
    }

    /**
     * Create new user
     */
    async createUser(data: any): Promise<ApiResponse<any>> {
        return this.request('/admin/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * Add credits to user
     */
    async addCredits(userId: string, data: {
        amount: number;
        reason: string;
        reference?: string;
    }): Promise<ApiResponse<any>> {
        return this.request('/admin/credits/add', {
            method: 'POST',
            body: JSON.stringify({ userId, ...data }),
        });
    }

    /**
     * Deduct credits from user
     */
    async deductCredits(userId: string, amount: number, reason: string): Promise<ApiResponse<any>> {
        return this.request('/admin/credits/deduct', {
            method: 'POST',
            body: JSON.stringify({ userId, amount, reason }),
        });
    }

    /**
     * Get credit transaction history
     */
    async getCreditHistory(params?: {
        page?: number;
        limit?: number;
        userId?: string;
        type?: string;
    }): Promise<ApiResponse<any>> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.userId) queryParams.append('userId', params.userId);
        if (params?.type) queryParams.append('type', params.type);

        const query = queryParams.toString();
        return this.request(`/admin/credits/history${query ? `?${query}` : ''}`);
    }

    /**
     * Get reports data
     */
    async getReports(type: 'overview' | 'revenue' | 'users' | 'activity', params?: {
        period?: string;
    }): Promise<ApiResponse<any>> {
        const queryParams = params ? new URLSearchParams(params).toString() : '';
        const endpoint = `/admin/reports/${type}${queryParams ? `?${queryParams}` : ''}`;
        return this.request(endpoint);
    }

    /**
     * Get system settings
     */
    async getSystemSettings(): Promise<ApiResponse<any>> {
        return this.request('/admin/settings');
    }

    /**
     * Update system settings
     */
    async updateSystemSettings(settings: any): Promise<ApiResponse<any>> {
        return this.request('/admin/settings', { method: 'PUT', body: JSON.stringify(settings) });
    }

    /**
     * Get system health
     */
    async getSystemHealth(): Promise<ApiResponse<any>> {
        return this.request('/admin/settings/health');
    }

    /**
     * Get security metrics
     */
    async getSecurityMetrics(): Promise<ApiResponse<any>> {
        return this.request('/admin/security/metrics');
    }

    /**
     * Get audit logs
     */
    async getAuditLogs(params?: {
        page?: number;
        limit?: number;
        search?: string;
        action?: string;
        resource?: string;
        status?: string;
        sortBy?: string;
        sortOrder?: string;
    }): Promise<ApiResponse<any>> {
        const queryParams = params ? new URLSearchParams(params as any).toString() : '';
        const endpoint = `/admin/security/audit-logs${queryParams ? `?${queryParams}` : ''}`;
        return this.request(endpoint);
    }

    /**
     * Generic GET request
     */
    async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    /**
     * Generic POST request
     */
    async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    /**
     * Generic PUT request
     */
    async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    /**
     * Generic DELETE request
     */
    async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export types
export type { ApiResponse, ApiError, AdminData, Tokens, LoginResponse };
