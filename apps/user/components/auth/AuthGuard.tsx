'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, isTokenExpired } from '@/utils/auth';
import { useActivityRefresh } from '@/hooks/useActivityRefresh';

interface AuthGuardProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * AuthGuard Component
 * 
 * Protects routes by checking if user is authenticated.
 * Redirects to login if not authenticated or token is expired.
 * Shows loading state while checking authentication.
 * Automatically refreshes token based on user activity.
 */
export default function AuthGuard({ children, fallback }: AuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthed, setIsAuthed] = useState(false);

    // Enable activity-based token refresh
    useActivityRefresh({
        enabled: true,
        refreshThreshold: 300, // Refresh when less than 5 minutes remaining
        checkInterval: 60000, // Check every minute
    });

    useEffect(() => {
        const checkAuth = () => {
            // Check if user is authenticated
            const authenticated = isAuthenticated();

            if (!authenticated) {
                // Not authenticated - redirect to login with return URL
                const returnUrl = encodeURIComponent(pathname || '/dashboard');
                router.push(`/login?redirect=${returnUrl}`);
                return;
            }

            // Check if token is expired
            const tokenExpired = isTokenExpired();

            if (tokenExpired) {
                // Token expired - clear storage and redirect to login
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');

                const returnUrl = encodeURIComponent(pathname || '/dashboard');
                router.push(`/login?redirect=${returnUrl}&expired=true`);
                return;
            }

            // User is authenticated and token is valid
            setIsAuthed(true);
            setIsChecking(false);
        };

        checkAuth();
    }, [router, pathname]);

    // Show loading state while checking authentication
    if (isChecking) {
        return (
            fallback || (
                <div className="min-h-screen bg-gradient-to-br from-dark-900 via-navy-900 to-dark-800 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-gray-300 text-lg">Verifying authentication...</p>
                    </div>
                </div>
            )
        );
    }

    // User is authenticated - render children
    if (isAuthed) {
        return <>{children}</>;
    }

    // Fallback - shouldn't reach here but just in case
    return null;
}
