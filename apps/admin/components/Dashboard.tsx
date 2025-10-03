'use client'

import React from 'react'
import { ProtectedRoute } from './ProtectedRoute'
import AdminLayout from '../app/admin/components/AdminLayout'
import AdminOverview from '../app/admin/components/AdminOverview'

const Dashboard: React.FC = () => {
    return (
        <ProtectedRoute>
            <AdminLayout>
                <AdminOverview />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default Dashboard