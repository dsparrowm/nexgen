'use client'

import React from 'react'
import { BadgeCheck, FileWarning, ShieldCheck, Users } from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../components/AdminLayout'
import SectionLanding from '../components/SectionLanding'
import { adminRoutes } from '@/lib/adminRoutes'

const CompliancePage: React.FC = () => {
    return (
        <ProtectedRoute>
            <AdminLayout>
                <SectionLanding
                    eyebrow="Compliance"
                    title="Keep verification, restrictions, and review queues together"
                    description="Compliance should own customer verification status, KYC document review, and any future risk/AML actions. The live KYC queue is already wired in, and this hub gives it the right operational home."
                    cards={[
                        {
                            title: 'KYC review queue',
                            description: 'Approve or reject uploaded identity documents and keep customer verification status current.',
                            href: adminRoutes.complianceKyc,
                            status: 'Live',
                            icon: BadgeCheck,
                        },
                        {
                            title: 'Customer restriction workflows',
                            description: 'Account freezes, risk holds, and manual escalation flows should sit beside KYC rather than inside generic user editing.',
                            href: adminRoutes.customers,
                            status: 'Planned',
                            icon: Users,
                        },
                        {
                            title: 'Risk and suspicious activity review',
                            description: 'Suspicious withdrawal patterns, unsupported documents, and escalated cases still need dedicated backend rules and review tooling.',
                            status: 'Needs Backend',
                            icon: FileWarning,
                        },
                        {
                            title: 'Compliance audit posture',
                            description: 'Security and audit logs can support compliance investigations once workflow-level filters are added.',
                            href: adminRoutes.platformSecurity,
                            status: 'Live',
                            icon: ShieldCheck,
                        },
                    ]}
                />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default CompliancePage
