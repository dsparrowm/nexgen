import React from 'react'
import DashboardLayout from '../components/DashboardLayout'
import MiningManagement from '../components/MiningManagement'

export default function MiningPage() {
    return (
        <DashboardLayout activeSection="mining">
            <MiningManagement />
        </DashboardLayout>
    )
}