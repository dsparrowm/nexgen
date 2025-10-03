import React from 'react'
import AdminLayout from '../components/AdminLayout'
import UserManagement from './components/UserManagement'

interface UserManagementPageProps {
    onLogout: () => void
}

const UserManagementPage: React.FC<UserManagementPageProps> = ({ onLogout }) => {
    return (
        <AdminLayout onLogout={onLogout}>
            <UserManagement />
        </AdminLayout>
    )
}

export default UserManagementPage