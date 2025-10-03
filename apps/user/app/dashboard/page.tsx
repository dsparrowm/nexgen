import React from 'react'
import DashboardLayout from './components/DashboardLayout'
import DashboardOverview from './components/DashboardOverview'
import AuthGuard from '@/components/auth/AuthGuard'

export default function DashboardPage() {
    return (
        <AuthGuard>
            <DashboardLayout activeSection="dashboard">
                <DashboardOverview />
            </DashboardLayout>
        </AuthGuard>
    )
}