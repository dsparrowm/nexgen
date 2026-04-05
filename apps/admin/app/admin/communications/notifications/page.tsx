'use client'

import React from 'react'
import { Bell, MessageCircle, Send, Users } from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../../components/AdminLayout'
import SectionLanding from '../../components/SectionLanding'
import { adminRoutes } from '@/lib/adminRoutes'

const NotificationCenterPage: React.FC = () => {
    return (
        <ProtectedRoute>
            <AdminLayout>
                <SectionLanding
                    eyebrow="Notifications"
                    title="Notification operations need dedicated admin APIs"
                    description="User notifications already exist on the product side, but admin cannot yet compose, target, schedule, or resend them from the back office. This page marks the correct ownership boundary for that work."
                    cards={[
                        {
                            title: 'Support inbox',
                            description: 'Customer conversations are already live and remain the closest existing messaging tool.',
                            href: adminRoutes.communicationsSupport,
                            status: 'Live',
                            icon: MessageCircle,
                        },
                        {
                            title: 'Customer targeting',
                            description: 'Audience selection by KYC state, account status, treasury activity, or product exposure should be built before campaign tools.',
                            href: adminRoutes.customers,
                            status: 'Planned',
                            icon: Users,
                        },
                        {
                            title: 'Campaign composer',
                            description: 'Admins should be able to draft in-app announcements, scheduled broadcasts, and transactional overrides with templates and audit logs.',
                            status: 'Needs Backend',
                            icon: Send,
                        },
                        {
                            title: 'Notification governance',
                            description: 'Read state, delivery state, and resend workflows should be first-class here, not hidden in user-only endpoints.',
                            status: 'Needs Backend',
                            icon: Bell,
                        },
                    ]}
                />
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default NotificationCenterPage
