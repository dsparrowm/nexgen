import React from 'react'
import DashboardLayout from '../components/DashboardLayout'
import DepositManagement from '../components/DepositManagement'
import AuthGuard from '@/components/auth/AuthGuard'

export default function DepositPage() {
    return (
        <AuthGuard>
            <DashboardLayout activeSection="deposit">
                <DepositManagement />
            </DashboardLayout>
        </AuthGuard>
    )
}