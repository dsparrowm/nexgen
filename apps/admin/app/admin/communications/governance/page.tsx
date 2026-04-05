'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../../components/AdminLayout'
import CommunicationGovernance from './components/CommunicationGovernance'

const CommunicationGovernancePage: React.FC = () => {
    return (
        <ProtectedRoute>
            <AdminLayout>
                <CommunicationGovernance />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default CommunicationGovernancePage
