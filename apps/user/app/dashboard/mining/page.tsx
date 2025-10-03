import React from 'react'
import DashboardLayout from '../components/DashboardLayout'
import MiningManagement from '../components/MiningManagement'
import AuthGuard from '@/components/auth/AuthGuard'

export default function MiningPage() {
    return (
        <AuthGuard>
            <DashboardLayout activeSection="mining">
                <MiningManagement />
            </DashboardLayout>
        </AuthGuard>
    )
}