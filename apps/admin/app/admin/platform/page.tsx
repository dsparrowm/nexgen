'use client'

import React from 'react'
import { Activity, Settings, Shield, SlidersHorizontal } from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../components/AdminLayout'
import SectionLanding from '../components/SectionLanding'
import { adminRoutes } from '@/lib/adminRoutes'

const PlatformPage: React.FC = () => {
    return (
        <ProtectedRoute>
            <AdminLayout>
                <SectionLanding
                    eyebrow="Platform"
                    title="Own system configuration and security from one platform workspace"
                    description="Settings, security, admin permissions, feature toggles, and operational health all belong under platform controls. This hub keeps those cross-cutting concerns out of customer and treasury workflows."
                    cards={[
                        {
                            title: 'System settings',
                            description: 'Configure core platform settings and operational defaults.',
                            href: adminRoutes.platformSettings,
                            status: 'Live',
                            icon: Settings,
                        },
                        {
                            title: 'Security & audit',
                            description: 'Review audit logs, security metrics, and privileged platform activity.',
                            href: adminRoutes.platformSecurity,
                            status: 'Live',
                            icon: Shield,
                        },
                        {
                            title: 'Platform health',
                            description: 'Operational health and uptime should continue to surface here and in the operations center.',
                            href: adminRoutes.operations,
                            status: 'Live',
                            icon: Activity,
                        },
                        {
                            title: 'Permissions & feature flags',
                            description: 'Admin role scopes and release controls should eventually sit here instead of being hard-coded across pages.',
                            status: 'Needs Backend',
                            icon: SlidersHorizontal,
                        },
                    ]}
                />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default PlatformPage
