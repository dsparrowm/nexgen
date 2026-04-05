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
                    title="Referral operations now have a live admin home"
                    description="Referral visibility and bonus governance now run from this workspace. Broader campaign tooling and lifecycle growth controls can layer in here next without mixing them into unrelated admin domains."
                    cards={[
                        {
                            title: 'Referral operations',
                            description: 'Admin can now review referral performance, leaderboard standings, and recent bonus activity from one live workspace.',
                            href: adminRoutes.growthReferrals,
                            status: 'Live',
                            icon: Users,
                        },
                        {
                            title: 'Promotion controls',
                            description: 'Bonus rules, welcome campaigns, and incentive toggles now persist in a dedicated growth workspace.',
                            href: adminRoutes.growthPromotions,
                            status: 'Live',
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
                            description: 'Top referrers, conversion counts, and bonus totals are now visible to admin even though deeper abuse tooling still belongs in a later phase.',
                            href: adminRoutes.growthReferrals,
                            status: 'Live',
                            icon: Trophy,
                        },
                    ]}
                />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default GrowthPage
