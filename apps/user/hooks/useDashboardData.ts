/**
 * Custom hook for fetching and managing dashboard data
 */

import { useState, useEffect, useCallback } from 'react';
import { getDashboardData, getDashboardStats } from '@/utils/api/dashboardApi';

interface DashboardData {
    user: any;
    stats?: {
        totalBalance?: number;
        totalInvested?: number;
        totalEarnings?: number;
        activeMiningOperations?: number;
        activeInvestments?: number;
        pendingPayouts?: number;
        totalHashrate?: number;
        dailyEarnings?: number;
    };
    recentTransactions?: any[];
    recentNotifications?: any[];
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

interface UseDashboardDataReturn {
    data: DashboardData | null;
    stats: DashboardStats | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useDashboardData(): UseDashboardDataReturn {
    const [data, setData] = useState<DashboardData | null>(null);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch both dashboard data and stats in parallel
            const [dashboardResponse, statsResponse] = await Promise.all([
                getDashboardData(),
                getDashboardStats()
            ]);

            if (dashboardResponse.success && dashboardResponse.data) {
                setData(dashboardResponse.data);
            } else {
                setError(dashboardResponse.error?.message || 'Failed to fetch dashboard data');
            }

            if (statsResponse.success && statsResponse.data) {
                setStats(statsResponse.data);
            }
        } catch (err) {
            console.error('Dashboard data fetch error:', err);
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        data,
        stats,
        loading,
        error,
        refetch: fetchData,
    };
}
