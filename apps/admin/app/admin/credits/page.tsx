import React from 'react'
import AdminLayout from '../components/AdminLayout'
import CreditManagement from './components/CreditManagement'

interface CreditManagementPageProps {
    onLogout: () => void
}

const CreditManagementPage: React.FC<CreditManagementPageProps> = ({ onLogout }) => {
    return (
        <AdminLayout onLogout={onLogout}>
            <CreditManagement />
        </AdminLayout>
    )
}

export default CreditManagementPage