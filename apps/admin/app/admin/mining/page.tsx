'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../components/AdminLayout'
import MiningManagement from './components/MiningManagement'

const MiningManagementPage: React.FC = () => {
    return (
        <ProtectedRoute>
            <AdminLayout>
                <MiningManagement />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default MiningManagementPage
