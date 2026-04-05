'use client'

import React from 'react'
import { Gift, TrendingUp, Trophy, Users } from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../components/AdminLayout'
import SectionLanding from '../components/SectionLanding'
import { adminRoutes } from '@/lib/adminRoutes'

const GrowthPage: React.FC = () => {
    return (
        <ProtectedRoute>
            <AdminLayout>
                <SectionLanding
                    eyebrow="Growth"
                    title="Referral and incentive controls should be owned from one growth workspace"
                    description="Referral logic already affects user earnings, but the back office still lacks direct growth tooling. This workspace is where referral reporting, campaign controls, and incentive governance should live."
                    cards={[
                        {
                            title: 'Referral operations',
                            description: 'Referral visibility, leaderboard integrity checks, and campaign-level governance should consolidate here.',
                            href: adminRoutes.growthReferrals,
                            status: 'Planned',
                            icon: Users,
                        },
                        {
                            title: 'Promotion controls',
                            description: 'Bonus rules, welcome campaigns, and incentive toggles should live with referral governance instead of being hard-coded into unrelated flows.',
                            status: 'Needs Backend',
                            icon: Gift,
                        },
                        {
                            title: 'Growth analytics',
                            description: 'Conversion, retained referrals, and incentive cost metrics should feed into analytics once campaign tooling exists.',
                            href: adminRoutes.analytics,
                            status: 'Live',
                            icon: TrendingUp,
                        },
                        {
                            title: 'Leaderboard oversight',
                            description: 'Abuse review and ranking integrity should be a deliberate operational surface, not just a passive user leaderboard endpoint.',
                            status: 'Needs Backend',
                            icon: Trophy,
                        },
                    ]}
                />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default GrowthPage
