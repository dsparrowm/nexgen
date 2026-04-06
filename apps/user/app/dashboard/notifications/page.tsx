'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import AuthGuard from '@/components/auth/AuthGuard'
import DashboardLayout from '../components/DashboardLayout'
import {
    getNotifications,
    getNotificationStats,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    type NotificationRecord,
    type NotificationStatsResponse,
} from '@/utils/api/dashboardApi'
import { Bell, CheckCheck, ChevronLeft, ChevronRight, Loader2, RefreshCw, Inbox } from 'lucide-react'
import { toast } from 'sonner'

const PAGE_SIZE = 12

const formatDate = (value: string) =>
    new Date(value).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationRecord[]>([])
    const [stats, setStats] = useState<NotificationStatsResponse | null>(null)
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [markingId, setMarkingId] = useState<string | null>(null)
    const [markAllBusy, setMarkAllBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadNotifications = useCallback(async (nextPage = 1, showRefreshing = false) => {
        if (showRefreshing) {
            setRefreshing(true)
        } else {
            setLoading(true)
        }

        try {
            setError(null)
            const [notificationsResponse, statsResponse] = await Promise.all([
                getNotifications({ page: nextPage, limit: PAGE_SIZE }),
                getNotificationStats(),
            ])

            if (!notificationsResponse.success || !notificationsResponse.data) {
                throw new Error(notificationsResponse.error?.message || 'Failed to load notifications')
            }

            if (!statsResponse.success || !statsResponse.data) {
                throw new Error(statsResponse.error?.message || 'Failed to load notification stats')
            }

            setNotifications(notificationsResponse.data.notifications || [])
            setPagination({
                page: notificationsResponse.data.pagination.page,
                pages: notificationsResponse.data.pagination.pages,
                total: notificationsResponse.data.pagination.total,
            })
            setStats(statsResponse.data)
        } catch (fetchError) {
            const message = fetchError instanceof Error ? fetchError.message : 'Failed to load notifications'
            setError(message)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        void loadNotifications(1)
    }, [loadNotifications])

    useEffect(() => {
        const handleNotificationUpdate = () => {
            void loadNotifications(1, true)
        }

        window.addEventListener('user-notifications-updated', handleNotificationUpdate)

        return () => {
            window.removeEventListener('user-notifications-updated', handleNotificationUpdate)
        }
    }, [loadNotifications])

    const unreadCount = useMemo(
        () => stats?.unread ?? notifications.filter((notification) => !notification.isRead).length ?? 0,
        [notifications, stats?.unread]
    )

    const dispatchNotificationUpdate = () => {
        window.dispatchEvent(new Event('user-notifications-updated'))
    }

    const handleMarkRead = async (notificationId: string) => {
        setMarkingId(notificationId)
        try {
            const response = await markNotificationAsRead(notificationId)
            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to mark notification as read')
            }

            setNotifications((current) =>
                current.map((notification) =>
                    notification.id === notificationId ? { ...notification, isRead: true } : notification
                )
            )
            setStats((current) => current ? { ...current, unread: Math.max(0, current.unread - 1), read: current.read + 1 } : current)
            dispatchNotificationUpdate()
        } catch (markError) {
            toast.error(markError instanceof Error ? markError.message : 'Unable to mark notification as read')
        } finally {
            setMarkingId(null)
        }
    }

    const handleMarkAllRead = async () => {
        setMarkAllBusy(true)
        try {
            const response = await markAllNotificationsAsRead()
            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to mark notifications as read')
            }

            setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })))
            setStats((current) => current ? { ...current, unread: 0, read: current.total } : current)
            dispatchNotificationUpdate()
            toast.success('All notifications marked as read')
        } catch (markError) {
            toast.error(markError instanceof Error ? markError.message : 'Unable to mark all notifications as read')
        } finally {
            setMarkAllBusy(false)
        }
    }

    const goToPage = (nextPage: number) => {
        if (nextPage < 1 || nextPage > pagination.pages || nextPage === pagination.page) {
            return
        }

        void loadNotifications(nextPage, true)
    }

    return (
        <AuthGuard>
            <DashboardLayout activeSection="notifications">
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl border border-gold-500/20 bg-gradient-to-r from-gold-500/10 via-navy-800/60 to-blue-500/10 p-6 backdrop-blur-sm"
                    >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">
                                    <Bell className="h-3.5 w-3.5" />
                                    Notifications
                                </div>
                                <h2 className="mt-4 text-3xl font-bold text-white">Your notification center</h2>
                                <p className="mt-3 text-sm leading-6 text-gray-300">
                                    Review system announcements, mark items as read, and keep your dashboard badge in sync.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() => void loadNotifications(pagination.page, true)}
                                    className="inline-flex items-center gap-2 rounded-xl border border-gold-500/20 bg-dark-800/60 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-dark-700"
                                >
                                    {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                    Refresh
                                </button>
                                <button
                                    type="button"
                                    onClick={handleMarkAllRead}
                                    disabled={markAllBusy || unreadCount === 0}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {markAllBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                                    Mark all read
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {error && (
                        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {[
                            { label: 'Total', value: stats?.total ?? 0 },
                            { label: 'Unread', value: stats?.unread ?? 0 },
                            { label: 'Read', value: stats?.read ?? 0 },
                        ].map((card) => (
                            <div key={card.label} className="rounded-2xl border border-gold-500/20 bg-dark-800/50 p-5 backdrop-blur-sm">
                                <p className="text-sm text-gray-400">{card.label}</p>
                                <p className="mt-2 text-3xl font-bold text-white">{card.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-3xl border border-gold-500/20 bg-dark-800/50 backdrop-blur-sm">
                        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Messages</h3>
                                <p className="text-sm text-gray-400">
                                    {pagination.total} notification{pagination.total === 1 ? '' : 's'} total
                                </p>
                            </div>
                            {loading ? null : unreadCount > 0 ? (
                                <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-red-100">
                                    <Inbox className="h-3.5 w-3.5" />
                                    {unreadCount} unread
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-green-200">
                                    <CheckCheck className="h-3.5 w-3.5" />
                                    All caught up
                                </div>
                            )}
                        </div>

                        {loading ? (
                            <div className="px-6 py-12 text-center text-gray-400">
                                Loading notifications...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="px-6 py-12 text-center text-gray-400">
                                No notifications yet.
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {notifications.map((notification) => {
                                    const unread = !notification.isRead

                                    return (
                                        <div
                                            key={notification.id}
                                            className={`flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-start lg:justify-between ${unread ? 'bg-red-500/5' : ''}`}
                                        >
                                            <div className="flex min-w-0 items-start gap-4">
                                                <div className={`mt-1 rounded-2xl p-3 ${unread ? 'bg-red-500/15 text-red-300' : 'bg-gold-500/10 text-gold-300'}`}>
                                                    <Inbox className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h4 className="text-base font-semibold text-white">{notification.title}</h4>
                                                        {unread ? (
                                                            <span className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-red-100">
                                                                Unread
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-green-200">
                                                                Read
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-300">
                                                        {notification.message}
                                                    </p>
                                                    <p className="mt-2 text-xs text-gray-500">
                                                        {formatDate(notification.createdAt)}
                                                    </p>
                                                </div>
                                            </div>

                                            {unread ? (
                                                <button
                                                    type="button"
                                                    onClick={() => void handleMarkRead(notification.id)}
                                                    disabled={markingId === notification.id}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-gold-500/20 bg-dark-800/60 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-dark-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {markingId === notification.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <CheckCheck className="h-4 w-4" />
                                                    )}
                                                    Mark read
                                                </button>
                                            ) : null}
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {pagination.pages > 1 && (
                            <div className="flex items-center justify-between border-t border-white/5 px-6 py-4">
                                <p className="text-sm text-gray-400">
                                    Page {pagination.page} of {pagination.pages}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => goToPage(pagination.page - 1)}
                                        disabled={pagination.page <= 1 || loading}
                                        className="inline-flex items-center gap-1 rounded-xl border border-gold-500/20 bg-dark-800/60 px-3 py-2 text-sm text-white transition-colors hover:bg-dark-700 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => goToPage(pagination.page + 1)}
                                        disabled={pagination.page >= pagination.pages || loading}
                                        className="inline-flex items-center gap-1 rounded-xl border border-gold-500/20 bg-dark-800/60 px-3 py-2 text-sm text-white transition-colors hover:bg-dark-700 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DashboardLayout>
        </AuthGuard>
    )
}
