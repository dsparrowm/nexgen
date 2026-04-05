'use client'

import React from 'react'
import { Gift, LineChart, ShieldAlert, Users } from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../../components/AdminLayout'
import SectionLanding from '../../components/SectionLanding'
import { adminRoutes } from '@/lib/adminRoutes'

const ReferralWorkspacePage: React.FC = () => {
    return (
        <ProtectedRoute>
            <AdminLayout>
                <SectionLanding
                    eyebrow="Referrals"
                    title="Referral reporting exists on the user side, but admin control is still missing"
                    description="Users can view referral stats, leaderboard data, and referral bonuses, yet the admin side still needs its own reporting and governance endpoints to make referrals operable as a business function."
                    cards={[
                        {
                            title: 'Customer-level referral context',
                            description: 'Admins can already inspect referred users and overall customer state through the customer workspace.',
                            href: adminRoutes.customers,
                            status: 'Live',
                            icon: Users,
                        },
                        {
                            title: 'Growth analytics',
                            description: 'Platform reporting can eventually absorb referral metrics once referral admin APIs are in place.',
                            href: adminRoutes.analytics,
                            status: 'Planned',
                            icon: LineChart,
                        },
                        {
                            title: 'Referral bonus governance',
                            description: 'Manual bonus correction, campaign rule editing, and program toggles still require backend support and audit-safe admin mutations.',
                            status: 'Needs Backend',
                            icon: Gift,
                        },
                        {
                            title: 'Abuse detection',
                            description: 'Multi-account abuse, referral fraud, and suspicious incentive patterns need risk tooling and exception workflows.',
                            href: adminRoutes.complianceKyc,
                            status: 'Planned',
                            icon: ShieldAlert,
                        },
                    ]}
                />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default ReferralWorkspacePage
