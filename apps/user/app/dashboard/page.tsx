import React from 'react'
import DashboardLayout from './components/DashboardLayout'
import DashboardOverview from './components/DashboardOverview'

export default function DashboardPage() {
    return (
        <DashboardLayout activeSection="dashboard">
            <DashboardOverview />
        </DashboardLayout>
    )
}