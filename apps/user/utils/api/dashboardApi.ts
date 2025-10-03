/**
 * Dashboard API utilities
 * Centralized API calls for dashboard data
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code: string;
    };
    message?: string;
}

interface DashboardData {
    user: {
        id: string;
        username: string;
        email: string;
        firstName?: string;
        lastName?: string;
        balance: number;
        totalHashpower: number;
        totalInvested: number;
        totalEarnings: number;
    };
    stats?: {
        activeInvestments?: number;
        activeMiningOperations?: number;
        dailyEarnings?: number;
    };
    recentTransactions?: any[];
    recentNotifications?: any[];
    unreadNotifications?: number;
}

interface DashboardStats {
    investments: {
        total: number;
        active: number;
        completed: number;
    };
    transactions: {
        total: number;
        successful: number;
        successRate: number;
    };
    payouts: {
        total: number;
        thisMonth: number;
    };
    referrals: {
        totalReferrals: number;
    };
    earnings: {
        byMonth: Array<{
            month: Date | string;
            earnings: number;
        }>;
    };
}

/**
 * Get authentication token from localStorage
 */
const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
};

/**
 * Generic API fetch wrapper with auth
 */
async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const token = getAuthToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error || {
                    message: 'An error occurred',
                    code: 'UNKNOWN_ERROR',
                },
            };
        }

        return data;
    } catch (error) {
        console.error('API fetch error:', error);
        return {
            success: false,
            error: {
                message: 'Network error. Please check your connection.',
                code: 'NETWORK_ERROR',
            },
        };
    }
}

/**
 * Get dashboard data for the authenticated user
 */
export async function getDashboardData() {
    return apiFetch<DashboardData>('/user/profile/dashboard');
}

/**
 * Get dashboard statistics including historical data
 */
export async function getDashboardStats() {
    return apiFetch<DashboardStats>('/user/dashboard/stats');
}

/**
 * Get user's mining operations
 */
export async function getMiningOperations() {
    return apiFetch<any>('/user/mining', {
        method: 'GET',
    });
}

/**
 * Get user's investments
 */
export async function getInvestments() {
    return apiFetch<any>('/user/investments', {
        method: 'GET',
    });
}

/**
 * Get user's transactions
 */
export async function getTransactions(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
}) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const endpoint = `/user/transactions${queryString ? `?${queryString}` : ''}`;

    return apiFetch<any>(endpoint, {
        method: 'GET',
    });
}

/**
 * Get user's notifications
 */
export async function getNotifications(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/user/notifications${queryString ? `?${queryString}` : ''}`;

    return apiFetch<any>(endpoint, {
        method: 'GET',
    });
}

/**
 * Get notification stats
 */
export async function getNotificationStats() {
    return apiFetch<any>('/user/notifications/stats', {
        method: 'GET',
    });
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
    return apiFetch<any>(`/user/notifications/${notificationId}/read`, {
        method: 'PUT',
    });
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
    return apiFetch<any>('/user/notifications/read-all', {
        method: 'PUT',
    });
}
