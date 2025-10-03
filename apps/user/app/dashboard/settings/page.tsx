import React from 'react'
import DashboardLayout from '../components/DashboardLayout'
import Settings from '../components/Settings'
import AuthGuard from '@/components/auth/AuthGuard'

export default function SettingsPage() {
    return (
        <AuthGuard>
            <DashboardLayout activeSection="settings">
                <Settings />
            </DashboardLayout>
        </AuthGuard>
    )
}