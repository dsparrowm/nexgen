import React from 'react'
import AdminLayout from './components/AdminLayout'
import AdminOverview from './components/AdminOverview'

interface AdminDashboardProps {
    onLogout: () => void
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
    return (
        <AdminLayout onLogout={onLogout}>
            <AdminOverview />
        </AdminLayout>
    )
}

export default AdminDashboard