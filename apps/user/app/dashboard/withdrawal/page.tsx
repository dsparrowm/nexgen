import React from 'react'
import DashboardLayout from '../components/DashboardLayout'
import WithdrawalManagement from '../components/WithdrawalManagement'
import AuthGuard from '@/components/auth/AuthGuard'

export default function WithdrawalPage() {
    return (
        <AuthGuard>
            <DashboardLayout activeSection="withdrawal">
                <WithdrawalManagement />
            </DashboardLayout>
        </AuthGuard>
    )
}