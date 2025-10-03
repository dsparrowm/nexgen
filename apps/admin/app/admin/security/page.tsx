'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../components/AdminLayout'
import SecurityAudit from './components/SecurityAudit'

const SecurityPage: React.FC = () => {
    return (
        <ProtectedRoute requiredRole="SUPER_ADMIN">
            <AdminLayout>
                <SecurityAudit />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default SecurityPage
