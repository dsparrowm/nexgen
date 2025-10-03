import React from 'react'
import AdminLayout from '../components/AdminLayout'
import SystemSettings from './components/SystemSettings'

interface SystemSettingsPageProps {
    onLogout: () => void
}

const SystemSettingsPage: React.FC<SystemSettingsPageProps> = ({ onLogout }) => {
    return (
        <AdminLayout onLogout={onLogout}>
            <SystemSettings />
        </AdminLayout>
    )
}

export default SystemSettingsPage