'use client'

import React, { useEffect, useState } from 'react'
import { Bell, MessageCircle, Send, ShieldAlert } from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../components/AdminLayout'
import SectionLanding from '../components/SectionLanding'
import { apiClient } from '@/lib/api'
import { adminRoutes } from '@/lib/adminRoutes'

const CommunicationsPage: React.FC = () => {
    const [supportUnreadCount, setSupportUnreadCount] = useState(0)

    useEffect(() => {
        let mounted = true

        const loadSupportUnreadCount = async () => {
            try {
                const response = await apiClient.getSupportConversations({ status: 'ALL', limit: 200 })
                if (!mounted || !response.success || !response.data) {
                    return
                }

                const unreadCount = (response.data.conversations || []).filter(
                    (conversation) => Number(conversation.unreadCount || 0) > 0
                ).length

                setSupportUnreadCount(unreadCount)
            } catch (error) {
                console.error('Failed to load communications support unread count:', error)
            }
        }

        void loadSupportUnreadCount()
        const interval = window.setInterval(() => {
            void loadSupportUnreadCount()
        }, 30000)

        return () => {
            mounted = false
            window.clearInterval(interval)
        }
    }, [])

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
                            badge: supportUnreadCount > 0 ? {
                                label: 'New messages',
                                count: supportUnreadCount,
                            } : undefined,
                        },
                        {
                            title: 'Notification center',
                            description: 'Broadcast system announcements and security alerts to all active customer accounts, with campaign history and audit logging.',
                            href: adminRoutes.communicationsNotifications,
                            status: 'Live',
                            icon: Bell,
                        },
                        {
                            title: 'Outbound messaging governance',
                            description: 'Template review, suppression controls, approvals, and scheduled sends now persist through a live governance workspace.',
                            href: adminRoutes.communicationsGovernance,
                            status: 'Live',
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
