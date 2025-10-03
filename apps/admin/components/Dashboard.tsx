import React from 'react'
import AdminLayout from '../app/admin/components/AdminLayout'
import AdminOverview from '../app/admin/components/AdminOverview'

interface DashboardProps {
    onLogout: () => void
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
    return (
        <AdminLayout onLogout={onLogout}>
            <AdminOverview />
        </AdminLayout>
    )
}

export default Dashboard