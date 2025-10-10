'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../components/AdminLayout'
import TransactionManagement from './components/TransactionManagement'

const TransactionManagementPage: React.FC = () => {
    return (
        <ProtectedRoute>
            <AdminLayout>
                <TransactionManagement />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default TransactionManagementPage