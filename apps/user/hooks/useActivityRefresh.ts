'use client';

import { useEffect, useRef } from 'react';
import { getTokenExpirationTime, refreshAuthToken, isAuthenticated } from '@/utils/auth';

/**
 * Custom hook to automatically refresh authentication token based on user activity
 * 
 * Features:
 * - Tracks user activity (mouse movement, clicks, keyboard input)
 * - Refreshes token when it's about to expire (< 5 minutes remaining)
 * - Only refreshes if user is actively using the app
 * - Debounces refresh requests to avoid unnecessary API calls
 * 
 * @param options Configuration options
 * @param options.enabled - Whether activity tracking is enabled (default: true)
 * @param options.refreshThreshold - Time in seconds before expiry to trigger refresh (default: 300 = 5 minutes)
 * @param options.checkInterval - How often to check token expiration in ms (default: 60000 = 1 minute)
 */
export const useActivityRefresh = (options?: {
    enabled?: boolean;
    refreshThreshold?: number;
    checkInterval?: number;
}) => {
    const {
        enabled = true,
        refreshThreshold = 300, // 5 minutes in seconds
        checkInterval = 60000, // 1 minute in milliseconds
    } = options || {};

    const activityTimestampRef = useRef<number>(Date.now());
    const isRefreshingRef = useRef<boolean>(false);
    const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!enabled) return;

        // Track user activity
        const updateActivity = () => {
            activityTimestampRef.current = Date.now();
        };

        // Check if token needs refresh
        const checkAndRefreshToken = async () => {
            // Skip if not authenticated
            if (!isAuthenticated()) return;

            // Skip if already refreshing
            if (isRefreshingRef.current) return;

            // Get time until token expires
            const timeUntilExpiry = getTokenExpirationTime();

            // If token expires soon and user was active in last 2 minutes
            const timeSinceActivity = Date.now() - activityTimestampRef.current;
            const wasRecentlyActive = timeSinceActivity < 120000; // 2 minutes

            if (timeUntilExpiry > 0 && timeUntilExpiry < refreshThreshold && wasRecentlyActive) {
                console.log(`Token expires in ${timeUntilExpiry}s, refreshing...`);

                isRefreshingRef.current = true;

                try {
                    const success = await refreshAuthToken();

                    if (success) {
                        console.log('Token refreshed successfully via activity tracking');
                    } else {
                        console.warn('Token refresh failed');
                    }
                } catch (error) {
                    console.error('Error during token refresh:', error);
                } finally {
                    isRefreshingRef.current = false;
                }
            }
        };

        // Add activity listeners
        const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart', 'click'];

        events.forEach(event => {
            window.addEventListener(event, updateActivity, { passive: true });
        });

        // Start periodic token check
        checkIntervalRef.current = setInterval(checkAndRefreshToken, checkInterval);

        // Initial check
        checkAndRefreshToken();

        // Cleanup
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, updateActivity);
            });

            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
        };
    }, [enabled, refreshThreshold, checkInterval]);
};
