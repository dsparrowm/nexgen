import React from 'react'
import DashboardLayout from '../components/DashboardLayout'
import InvestmentManagement from '../components/InvestmentManagement'

export default function InvestmentsPage() {
    return (
        <DashboardLayout activeSection="investments">
            <InvestmentManagement />
        </DashboardLayout>
    )
}