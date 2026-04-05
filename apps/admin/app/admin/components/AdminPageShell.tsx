'use client'

import React from 'react'
import AdminLayout from './AdminLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'

interface AdminPageShellProps {
    children: React.ReactNode
    requiredRole?: 'ADMIN' | 'SUPER_ADMIN'
}

const AdminPageShell: React.FC<AdminPageShellProps> = ({ children, requiredRole }) => {
    return (
        <ProtectedRoute requiredRole={requiredRole}>
            <AdminLayout>
                {children}
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default AdminPageShell
