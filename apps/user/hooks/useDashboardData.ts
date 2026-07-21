/**
 * Custom hook for fetching and managing dashboard data
 */

import { useState, useEffect, useCallback } from 'react';
import {
    getDashboardData,
    getDashboardStats,
    type DashboardData,
    type DashboardStats,
    type DashboardUser,
} from '@/utils/api/dashboardApi';

export const USER_PROFILE_UPDATED_EVENT = 'user-profile-updated';

// Module-level cache and inflight promise to prevent duplicate network calls
let cachedDashboardData: DashboardData | null = null;
let cachedDashboardStats: DashboardStats | null = null;
let inflightDashboardFetch: Promise<void> | null = null;

interface UseDashboardDataReturn {
    data: DashboardData | null;
    stats: DashboardStats | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Patch cached dashboard user fields (e.g. after profile image upload)
 * and notify dashboard layout listeners.
 */
export function patchDashboardUser(partial: Partial<DashboardUser>): void {
    if (cachedDashboardData?.user) {
        cachedDashboardData = {
            ...cachedDashboardData,
            user: {
                ...cachedDashboardData.user,
                ...partial,
            },
        };
    }

    if (typeof window !== 'undefined') {
        window.dispatchEvent(
            new CustomEvent(USER_PROFILE_UPDATED_EVENT, { detail: partial })
        );
    }
}

export function useDashboardData(): UseDashboardDataReturn {
    const [data, setData] = useState<DashboardData | null>(null);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        // Prevent multiple simultaneous fetches from different hook instances
        try {
            setLoading(true);
            setError(null);

            // If there's an inflight shared fetch, wait for it and reuse cached results
            if (inflightDashboardFetch) {
                await inflightDashboardFetch;
                // populate local state from cache
                setData(cachedDashboardData);
                setStats(cachedDashboardStats);
                return;
            }

            // Start shared fetch and store the promise so other instances can await it
            inflightDashboardFetch = (async () => {
                const [dashboardResponse, statsResponse] = await Promise.all([
                    getDashboardData(),
                    getDashboardStats(),
                ]);

                if (dashboardResponse.success && dashboardResponse.data) {
                    cachedDashboardData = dashboardResponse.data;
                } else {
                    // keep previous cache if any and surface error
                    cachedDashboardData = cachedDashboardData || null;
                    throw new Error(dashboardResponse.error?.message || 'Failed to fetch dashboard data');
                }

                if (statsResponse.success && statsResponse.data) {
                    cachedDashboardStats = statsResponse.data;
                }

                // clear inflight after success
                inflightDashboardFetch = null;
            })();

            // Wait for shared fetch to finish
            await inflightDashboardFetch;

            // Populate local state from cache
            setData(cachedDashboardData);
            setStats(cachedDashboardStats);
        } catch (err) {
            console.error('Dashboard data fetch error:', err);
            setError((err as Error).message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const handleProfileUpdated = (event: Event) => {
            const detail = (event as CustomEvent<Partial<DashboardUser>>).detail;
            if (!detail) return;

            setData((prev) => {
                if (!prev?.user) return prev;
                return {
                    ...prev,
                    user: {
                        ...prev.user,
                        ...detail,
                    },
                };
            });
        };

        window.addEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileUpdated);
        return () => {
            window.removeEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileUpdated);
        };
    }, []);

    return {
        data,
        stats,
        loading,
        error,
        refetch: fetchData,
    };
}
