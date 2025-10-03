/**
 * Protected Route Component
 * Ensures only authenticated admin users can access wrapped components
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'ADMIN' | 'SUPER_ADMIN';
    fallback?: React.ReactNode;
}

/**
 * ProtectedRoute component that wraps admin pages
 * Redirects to login if not authenticated
 * Optionally checks for specific role requirements
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requiredRole,
    fallback,
}) => {
    const { admin, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                // Not authenticated - redirect to login
                router.push('/');
            } else if (requiredRole && admin?.role !== requiredRole && admin?.role !== 'SUPER_ADMIN') {
                // Authenticated but insufficient permissions
                // SUPER_ADMIN can access everything, otherwise must match required role
                router.push('/admin?error=insufficient_permissions');
            }
        }
    }, [isLoading, isAuthenticated, admin, requiredRole, router]);

    // Show loading state
    if (isLoading) {
        return (
            fallback || (
                <div className="min-h-screen bg-gradient-to-br from-dark-900 via-navy-900 to-dark-800 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mb-4"></div>
                        <p className="text-gray-400">Verifying access...</p>
                    </div>
                </div>
            )
        );
    }

    // Not authenticated
    if (!isAuthenticated) {
        return null; // Will redirect in useEffect
    }

    // Insufficient permissions
    if (requiredRole && admin?.role !== requiredRole && admin?.role !== 'SUPER_ADMIN') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-dark-900 via-navy-900 to-dark-800 flex items-center justify-center">
                <div className="bg-dark-800/80 backdrop-blur-xl rounded-3xl p-8 border border-red-500/20 shadow-2xl max-w-md">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg
                                className="w-8 h-8 text-red-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                        <p className="text-gray-400 mb-6">
                            You don't have permission to access this page. This area requires {requiredRole} role.
                        </p>
                        <button
                            onClick={() => router.push('/admin')}
                            className="btn-primary"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Authenticated and authorized
    return <>{children}</>;
};

/**
 * Hook to require authentication in a component
 * Automatically redirects to login if not authenticated
 */
export const useRequireAuth = (requiredRole?: 'ADMIN' | 'SUPER_ADMIN') => {
    const { admin, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/');
        }
    }, [isLoading, isAuthenticated, router]);

    const hasPermission = requiredRole
        ? admin?.role === requiredRole || admin?.role === 'SUPER_ADMIN'
        : isAuthenticated;

    return {
        admin,
        isAuthenticated,
        isLoading,
        hasPermission,
    };
};

/**
 * Hook to check if admin has specific permission
 */
export const usePermission = () => {
    const { admin } = useAuth();

    const hasRole = (role: 'ADMIN' | 'SUPER_ADMIN'): boolean => {
        if (!admin) return false;
        if (admin.role === 'SUPER_ADMIN') return true; // Super admin has all permissions
        return admin.role === role;
    };

    const isSuperAdmin = (): boolean => {
        return admin?.role === 'SUPER_ADMIN';
    };

    const canManageUsers = (): boolean => {
        return hasRole('ADMIN') || hasRole('SUPER_ADMIN');
    };

    const canManageCredits = (): boolean => {
        return hasRole('ADMIN') || hasRole('SUPER_ADMIN');
    };

    const canManageSettings = (): boolean => {
        return isSuperAdmin(); // Only super admin can manage system settings
    };

    const canViewReports = (): boolean => {
        return hasRole('ADMIN') || hasRole('SUPER_ADMIN');
    };

    const canManageAdmins = (): boolean => {
        return isSuperAdmin(); // Only super admin can manage other admins
    };

    return {
        admin,
        hasRole,
        isSuperAdmin,
        canManageUsers,
        canManageCredits,
        canManageSettings,
        canViewReports,
        canManageAdmins,
    };
};
