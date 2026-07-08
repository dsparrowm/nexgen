/**
 * Protected Route Component
 * Ensures only authenticated admin users can access wrapped components
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

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
                <div className="flex min-h-screen items-center justify-center bg-zinc-50">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-gold-500" />
                        <p className="text-sm text-zinc-500">Verifying access...</p>
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
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
                <Card className="w-full max-w-md border-red-200 shadow-card">
                    <CardContent className="p-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-red-200 bg-red-50">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                        <h2 className="mb-2 text-2xl font-semibold text-zinc-900">Access Denied</h2>
                        <p className="mb-6 text-sm leading-relaxed text-zinc-500">
                            You don't have permission to access this page. This area requires {requiredRole} role.
                        </p>
                        <Button onClick={() => router.push('/admin')}>
                            Go to Dashboard
                        </Button>
                    </CardContent>
                </Card>
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
