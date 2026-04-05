'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../components/AdminLayout'
import AssetManagement from './components/AssetManagement'

const AssetsDeskPage: React.FC = () => {
    return (
        <ProtectedRoute>
            <AdminLayout>
                <AssetManagement />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default AssetsDeskPage
