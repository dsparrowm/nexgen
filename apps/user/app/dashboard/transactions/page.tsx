import React from 'react'
import DashboardLayout from '../components/DashboardLayout'
import TransactionHistory from '../components/TransactionHistory'

export default function TransactionsPage() {
    return (
        <DashboardLayout activeSection="transactions">
            <TransactionHistory />
        </DashboardLayout>
    )
}