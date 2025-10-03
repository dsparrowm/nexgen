import React from 'react'
import DashboardLayout from '../components/DashboardLayout'
import TransactionHistory from '../components/TransactionHistory'
import AuthGuard from '@/components/auth/AuthGuard'

export default function TransactionsPage() {
    return (
        <AuthGuard>
            <DashboardLayout activeSection="transactions">
                <TransactionHistory />
            </DashboardLayout>
        </AuthGuard>
    )
}