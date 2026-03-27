/**
 * Dashboard API utilities
 * Centralized API calls for dashboard data
 */

import { getApiBase } from '@/lib/axiosInstance';
import type {
    AssetPortfolioSummary,
    AssetPosition,
    SupportedAsset,
    SupportedAssetSymbol,
} from './assetsApi';

const API_BASE_URL = getApiBase(true);

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code: string;
    };
    message?: string;
}

export interface DashboardUser {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    balance: number;
    totalHashpower?: number;
    totalInvested: number;
    totalEarnings: number;
    assetBalance?: number;
    assetInvested?: number;
    assetEarnings?: number;
}

export interface DashboardAssetPortfolio extends AssetPortfolioSummary {
    supportedAssets?: SupportedAsset[];
    positions?: AssetPosition[];
    topHolding: SupportedAssetSymbol | null;
}

export interface DashboardData {
    user: DashboardUser;
    portfolio?: {
        miningInvested?: number;
        cryptoInvested?: number;
        cryptoCurrentValue?: number;
        totalCurrentValue?: number;
    };
    stats?: {
        activeInvestments?: number;
        activeMiningOperations?: number;
        dailyEarnings?: number;
        activeAssetPositions?: number;
        assetDailyPnL?: number;
    };
    assetPortfolio?: DashboardAssetPortfolio;
    recentTransactions?: any[];
    recentNotifications?: any[];
    unreadNotifications?: number;
}

export interface DashboardStats {
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

const normalizeAssetPortfolio = (assetPortfolio: any): DashboardAssetPortfolio | undefined => {
    if (!assetPortfolio) {
        return undefined;
    }

    const summary = assetPortfolio.summary || assetPortfolio;
    const allocations = (summary.allocations || summary.allocation || []).map((item: any) => ({
        symbol: item.symbol as SupportedAssetSymbol,
        name: item.name || item.symbol,
        value: Number(item.value ?? item.currentValue ?? 0),
        percentage: Number(item.percentage ?? 0),
        color: item.color || item.allocationColor || '#F59E0B',
    }));

    return {
        totalInvested: Number(summary.totalInvested ?? 0),
        currentValue: Number(summary.currentValue ?? summary.totalCurrentValue ?? 0),
        unrealizedPnL: Number(summary.unrealizedPnL ?? summary.totalPnL ?? summary.totalProfitLoss ?? 0),
        unrealizedPnLPercent: Number(
            summary.unrealizedPnLPercent ??
                summary.totalProfitLossPercentage ??
                (Number(summary.totalInvested ?? 0) > 0
                    ? (Number(summary.unrealizedPnL ?? summary.totalPnL ?? summary.totalProfitLoss ?? 0) /
                          Number(summary.totalInvested ?? 0)) *
                      100
                    : 0)
        ),
        activePositions: Number(summary.activePositions ?? 0),
        completedPositions: Number(summary.completedPositions ?? Math.max(0, Number(summary.totalPositions ?? 0) - Number(summary.activePositions ?? 0))),
        topHolding: (summary.topHolding || allocations[0]?.symbol || null) as SupportedAssetSymbol | null,
        allocations,
        supportedAssets: assetPortfolio.supportedAssets as SupportedAsset[] | undefined,
        positions: (assetPortfolio.positions || []) as AssetPosition[],
    };
};

/**
 * Get dashboard data for the authenticated user
 */
export async function getDashboardData() {
    const response = await apiFetch<DashboardData>('user/profile/dashboard');

    if (response.success && response.data) {
        return {
            ...response,
            data: {
                ...response.data,
                assetPortfolio: normalizeAssetPortfolio((response.data as any).assetPortfolio),
            },
        };
    }

    return response;
}

/**
 * Get dashboard statistics including historical data
 */
export async function getDashboardStats() {
    return apiFetch<DashboardStats>('user/dashboard/stats');
}

/**
 * Get user's mining operations
 */
export async function getMiningOperations() {
    return apiFetch<any>('user/mining', {
        method: 'GET',
    });
}

/**
 * Get user's investments
 */
export async function getInvestments() {
    return apiFetch<any>('user/investments', {
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
    return apiFetch<any>('user/notifications/stats', {
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
    return apiFetch<any>('user/notifications/read-all', {
        method: 'PUT',
    });
}
