'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../components/AdminLayout'
import KycManagement from './components/KycManagement'

const KycManagementPage: React.FC = () => {
    return (
        <ProtectedRoute>
            <AdminLayout>
                <KycManagement />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default KycManagementPage
