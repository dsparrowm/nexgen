'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../../components/AdminLayout'
import GrowthPromotionsWorkspace from './components/GrowthPromotionsWorkspace'

const GrowthPromotionsPage: React.FC = () => {
    return (
        <ProtectedRoute>
            <AdminLayout>
                <GrowthPromotionsWorkspace />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default GrowthPromotionsPage
