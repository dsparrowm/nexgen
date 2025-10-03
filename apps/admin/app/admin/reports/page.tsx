'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../components/AdminLayout'
import ReportsAnalytics from './components/ReportsAnalytics'

const ReportsPage: React.FC = () => {
    return (
        <ProtectedRoute>
            <AdminLayout>
                <ReportsAnalytics />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default ReportsPage
