'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../../components/AdminLayout'
import NotificationCenter from './components/NotificationCenter'

const NotificationCenterPage: React.FC = () => {
    return (
        <ProtectedRoute>
            <AdminLayout>
                <NotificationCenter />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default NotificationCenterPage
