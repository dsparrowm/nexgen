'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../../components/AdminLayout'
import AddUserForm from './components/AddUserForm'

const AddUserPage: React.FC = () => {
    return (
        <ProtectedRoute>
            <AdminLayout>
                <AddUserForm />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default AddUserPage
