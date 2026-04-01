'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../components/AdminLayout'
import SupportInbox from './components/SupportInbox'

const SupportPage: React.FC = () => {
    return (
        <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout>
                <SupportInbox />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default SupportPage
