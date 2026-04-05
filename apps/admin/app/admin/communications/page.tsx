'use client'

import React from 'react'
import { Bell, MessageCircle, Send, ShieldAlert } from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../components/AdminLayout'
import SectionLanding from '../components/SectionLanding'
import { adminRoutes } from '@/lib/adminRoutes'

const CommunicationsPage: React.FC = () => {
    return (
        <ProtectedRoute>
            <AdminLayout>
                <SectionLanding
                    eyebrow="Communications"
                    title="Support and outbound customer messaging belong in one place"
                    description="Customer support is live today, but announcements, targeted notifications, and system broadcast tooling should live beside it so admins have a single communication command center."
                    cards={[
                        {
                            title: 'Support inbox',
                            description: 'Handle live customer conversations, assignment, and status management.',
                            href: adminRoutes.communicationsSupport,
                            status: 'Live',
                            icon: MessageCircle,
                        },
                        {
                            title: 'Notification center',
                            description: 'Campaigns, broadcast announcements, and targeted in-app notifications should be managed here once admin-facing notification APIs are added.',
                            href: adminRoutes.communicationsNotifications,
                            status: 'Planned',
                            icon: Bell,
                        },
                        {
                            title: 'Outbound messaging governance',
                            description: 'Template review, suppression controls, and approval rules should grow here so support and system messaging stay auditable.',
                            status: 'Needs Backend',
                            icon: Send,
                        },
                        {
                            title: 'Escalation coordination',
                            description: 'High-risk customer incidents can already be investigated via support plus platform security while deeper comms tooling is built.',
                            href: adminRoutes.platformSecurity,
                            status: 'Live',
                            icon: ShieldAlert,
                        },
                    ]}
                />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default CommunicationsPage
