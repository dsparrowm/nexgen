import React from 'react'
import DashboardLayout from '../components/DashboardLayout'
import Settings from '../components/Settings'

const SettingsPage = () => {
    return (
        <DashboardLayout activeSection="settings">
            <Settings />
        </DashboardLayout>
    )
}

export default SettingsPage