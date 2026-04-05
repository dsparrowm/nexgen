'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../components/AdminLayout'
import PayoutManagement from './components/PayoutManagement'

const PayoutManagementPage: React.FC = () => {
    return (
        <ProtectedRoute>
            <AdminLayout>
                <PayoutManagement />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default PayoutManagementPage
