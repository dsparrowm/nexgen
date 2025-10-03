'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../components/AdminLayout'
import SystemSettings from './components/SystemSettings'

const SystemSettingsPage: React.FC = () => {
    return (
        <ProtectedRoute requiredRole="SUPER_ADMIN">
            <AdminLayout>
                <SystemSettings />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default SystemSettingsPage