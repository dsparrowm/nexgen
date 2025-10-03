'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../components/AdminLayout'
import UserManagement from './components/UserManagement'

const UserManagementPage: React.FC = () => {
    return (
        <ProtectedRoute>
            <AdminLayout>
                <UserManagement />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default UserManagementPage