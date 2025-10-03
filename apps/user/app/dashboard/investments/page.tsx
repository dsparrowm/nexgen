import React from 'react'
import DashboardLayout from '../components/DashboardLayout'
import InvestmentManagement from '../components/InvestmentManagement'
import AuthGuard from '@/components/auth/AuthGuard'

export default function InvestmentsPage() {
    return (
        <AuthGuard>
            <DashboardLayout activeSection="investments">
                <InvestmentManagement />
            </DashboardLayout>
        </AuthGuard>
    )
}