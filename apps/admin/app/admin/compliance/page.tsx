'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../components/AdminLayout'
import ComplianceWorkspace from './components/ComplianceWorkspace'

const CompliancePage: React.FC = () => {
    return (
        <ProtectedRoute>
            <AdminLayout>
                <ComplianceWorkspace />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default CompliancePage
