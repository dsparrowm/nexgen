'use client'

import React from 'react'
import { ArrowLeftRight, CreditCard, HandCoins, ShieldCheck } from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../components/AdminLayout'
import SectionLanding from '../components/SectionLanding'
import { adminRoutes } from '@/lib/adminRoutes'

const TreasuryPage: React.FC = () => {
    return (
        <ProtectedRoute>
            <AdminLayout>
                <SectionLanding
                    eyebrow="Treasury"
                    title="Run the platform ledger from one operational domain"
                    description="Treasury owns customer cash balance changes, deposit and withdrawal approvals, payout batches, and the canonical transaction history. This section unifies the controls that were previously spread across credits, transactions, and payouts."
                    cards={[
                        {
                            title: 'Ledger & approvals',
                            description: 'Review deposits, withdrawals, payouts, and transaction lifecycle events in one operational ledger.',
                            href: adminRoutes.treasuryLedger,
                            status: 'Live',
                            icon: ArrowLeftRight,
                        },
                        {
                            title: 'Balance controls',
                            description: 'Credit or deduct platform cash balance with audit trails and user notifications.',
                            href: adminRoutes.treasuryCredits,
                            status: 'Live',
                            icon: CreditCard,
                        },
                        {
                            title: 'Payout runs',
                            description: 'Review payout history and trigger daily payout processing for eligible active investments.',
                            href: adminRoutes.treasuryPayouts,
                            status: 'Live',
                            icon: HandCoins,
                        },
                        {
                            title: 'Future finance controls',
                            description: 'Refund tooling, exception queues, and liability reconciliation should expand from this treasury foundation instead of becoming separate orphan pages.',
                            status: 'Planned',
                            icon: ShieldCheck,
                        },
                    ]}
                />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default TreasuryPage
