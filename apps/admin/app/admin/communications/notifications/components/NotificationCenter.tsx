'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api'
import { useToast } from '@/components/ToastContext'
import {
    Bell,
    Loader2,
    RefreshCw,
    Search,
    Send,
    ShieldCheck,
    Users,
} from 'lucide-react'

type TargetRole = 'ADMIN' | 'SUPER_ADMIN' | 'USER' | 'ALL'
type KycFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW'

interface NotificationUser {
    id: string
    email: string
    username: string
    firstName?: string | null
    lastName?: string | null
    role?: string
    isActive?: boolean
    kycStatus?: string
}

interface NotificationRecord {
    id: string
    title: string
    message: string
    isRead: boolean
    createdAt: string
    user: NotificationUser | null
    metadata?: {
        broadcast?: boolean
        target?: Record<string, unknown> | null
    } | null
}

interface NotificationWorkspacePayload {
    notifications: NotificationRecord[]
    summary: {
        total: number
        unreadCount: number
        recipientCount: number
    }
    pagination: {
        page: number
        limit: number
        total: number
        pages: number
    }
}

interface BroadcastFormState {
    title: string
    message: string
    targetRole: TargetRole
    kycStatus: KycFilter
    activeOnly: boolean
}

const initialForm: BroadcastFormState = {
    title: '',
    message: '',
    targetRole: 'ALL',
    kycStatus: 'ALL',
    activeOnly: true,
}

const formatDate = (value: string) =>
    new Date(value).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })

const NotificationCenter: React.FC = () => {
    const { addToast } = useToast()
    const [payload, setPayload] = useState<NotificationWorkspacePayload | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [page, setPage] = useState(1)
    const [error, setError] = useState<string | null>(null)
    const [form, setForm] = useState<BroadcastFormState>(initialForm)

    useEffect(() => {
        const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 250)
        return () => window.clearTimeout(timeout)
    }, [search])

    const loadWorkspace = async (nextPage = page, showRefreshing = false) => {
        if (showRefreshing) setRefreshing(true)
        else setLoading(true)

        try {
            setError(null)
            const params = new URLSearchParams({
                page: String(nextPage),
                limit: '10',
            })
            if (debouncedSearch) params.set('search', debouncedSearch)

            const response = await apiClient.get<NotificationWorkspacePayload>(`/admin/notifications?${params.toString()}`)

            if (!response.success || !response.data) {
                throw new Error(response.error?.message || 'Failed to load notification center')
            }

            setPayload(response.data)
            setPage(response.data.pagination.page)
        } catch (workspaceError) {
            setError(workspaceError instanceof Error ? workspaceError.message : 'Failed to load notification center')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        void loadWorkspace(1)
    }, [debouncedSearch])

    const summaryCards = useMemo(() => {
        if (!payload) return []

        return [
            { label: 'Broadcasts', value: payload.summary.total, helper: 'System announcement notifications' },
            { label: 'Unread', value: payload.summary.unreadCount, helper: 'Users who have not opened them yet' },
            { label: 'Recipients', value: payload.summary.recipientCount, helper: 'Matching users in the current view' },
        ]
    }, [payload])

    const submitBroadcast = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (form.title.trim().length < 3 || form.message.trim().length < 5) {
            addToast('error', 'Missing content', 'Add a short title and a real message before sending.')
            return
        }

        setSaving(true)

        try {
            const response = await apiClient.post('/admin/notifications/broadcast', {
                title: form.title.trim(),
                message: form.message.trim(),
                target: {
                    role: form.targetRole === 'ALL' ? undefined : form.targetRole,
                    isActive: form.activeOnly ? true : undefined,
                    kycStatus: form.kycStatus === 'ALL' ? undefined : form.kycStatus,
                },
            })

            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to send notification')
            }

            addToast('success', 'Broadcast sent', response.message || 'The notification broadcast was created.')
            setForm(initialForm)
            await loadWorkspace(page, true)
        } catch (sendError) {
            addToast(
                'error',
                'Broadcast failed',
                sendError instanceof Error ? sendError.message : 'Unable to send the notification broadcast'
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm"
            >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="max-w-3xl">
                        <div className="inline-flex rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">
                            Notifications
                        </div>
                        <h1 className="mt-4 text-3xl font-bold text-white">Broadcast announcements and system notices</h1>
                        <p className="mt-3 text-sm leading-6 text-gray-300">
                            Admin can now send system announcements to users and review the broadcast history from one workspace.
                        </p>
                    </div>
                    <button
                        onClick={() => void loadWorkspace(page, true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400"
                    >
                        {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Refresh
                    </button>
                </div>
            </motion.div>

            {error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {summaryCards.map((card) => (
                    <div key={card.label} className="rounded-2xl border border-gold-500/20 bg-dark-800/50 p-5 backdrop-blur-sm">
                        <p className="text-sm text-gray-400">{card.label}</p>
                        <p className="mt-2 text-3xl font-bold text-white">{card.value}</p>
                        <p className="mt-1 text-xs text-gray-500">{card.helper}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-3xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-white">Recent broadcasts</h2>
                            <p className="text-sm text-gray-400">Notifications sent through the admin workspace.</p>
                        </div>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search title, message, or recipient"
                                className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-gray-500 focus:border-gold-500/40"
                            />
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        {loading ? (
                            <div className="rounded-2xl border border-gold-500/10 bg-navy-900/40 p-8 text-center text-gray-400">
                                Loading notification history...
                            </div>
                        ) : !payload?.notifications.length ? (
                            <div className="rounded-2xl border border-gold-500/10 bg-navy-900/40 p-8 text-center text-gray-400">
                                No broadcast notifications have been sent yet.
                            </div>
                        ) : (
                            payload.notifications.map((notification) => (
                                <div key={notification.id} className="rounded-2xl border border-gold-500/10 bg-navy-900/40 p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Bell className="h-4 w-4 text-gold-300" />
                                                <h3 className="font-semibold text-white">{notification.title}</h3>
                                            </div>
                                            <p className="mt-2 text-sm leading-6 text-gray-300">{notification.message}</p>
                                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-400">
                                                <span className="rounded-full border border-white/10 px-3 py-1">
                                                    {formatDate(notification.createdAt)}
                                                </span>
                                                <span className="rounded-full border border-white/10 px-3 py-1">
                                                    {notification.user?.email || 'Broadcast recipient'}
                                                </span>
                                                {notification.metadata?.broadcast && (
                                                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                                                        Broadcast
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-dark-900/50 px-3 py-2 text-xs text-gray-300">
                                            {notification.isRead ? 'Read' : 'Unread'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {!loading && payload?.pagination && payload.pagination.pages > 1 && (
                        <div className="mt-6 flex items-center justify-between border-t border-gold-500/10 pt-4 text-sm text-gray-400">
                            <p>
                                Page {payload.pagination.page} of {payload.pagination.pages}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => void loadWorkspace(Math.max(1, page - 1))}
                                    disabled={page <= 1}
                                    className="rounded-lg border border-gold-500/20 px-3 py-2 text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => void loadWorkspace(Math.min(payload.pagination.pages, page + 1))}
                                    disabled={page >= payload.pagination.pages}
                                    className="rounded-lg border border-gold-500/20 px-3 py-2 text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={submitBroadcast} className="rounded-3xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-gold-500/10 p-3 text-gold-300">
                            <Send className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">Compose broadcast</h2>
                            <p className="text-sm text-gray-400">Send a system announcement to a target segment.</p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-gray-300">Title</span>
                            <input
                                value={form.title}
                                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                                className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                                placeholder="Scheduled maintenance notice"
                            />
                        </label>

                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-gray-300">Message</span>
                            <textarea
                                value={form.message}
                                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                                rows={5}
                                className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                                placeholder="Write the announcement you want users to receive."
                            />
                        </label>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <label className="block space-y-2">
                                <span className="text-sm font-medium text-gray-300">Target role</span>
                                <select
                                    value={form.targetRole}
                                    onChange={(event) => setForm((current) => ({ ...current, targetRole: event.target.value as TargetRole }))}
                                    className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                                >
                                    <option value="ALL">All users</option>
                                    <option value="USER">Users only</option>
                                    <option value="ADMIN">Admins only</option>
                                    <option value="SUPER_ADMIN">Super admins only</option>
                                </select>
                            </label>

                            <label className="block space-y-2">
                                <span className="text-sm font-medium text-gray-300">KYC status</span>
                                <select
                                    value={form.kycStatus}
                                    onChange={(event) => setForm((current) => ({ ...current, kycStatus: event.target.value as KycFilter }))}
                                    className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                                >
                                    <option value="ALL">Any status</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="APPROVED">Approved</option>
                                    <option value="REJECTED">Rejected</option>
                                    <option value="UNDER_REVIEW">Under review</option>
                                </select>
                            </label>
                        </div>

                        <label className="flex items-center gap-3 rounded-2xl border border-gold-500/10 bg-navy-900/40 px-4 py-3 text-sm text-gray-200">
                            <input
                                type="checkbox"
                                checked={form.activeOnly}
                                onChange={(event) => setForm((current) => ({ ...current, activeOnly: event.target.checked }))}
                                className="h-4 w-4 rounded border-gold-500/30 bg-navy-900 text-gold-500"
                            />
                            Send only to active accounts
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold-500 px-4 py-3 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Send broadcast
                    </button>

                    <div className="mt-4 rounded-2xl border border-gold-500/10 bg-navy-900/40 p-4 text-xs leading-6 text-gray-400">
                        The backend stores broadcasts as `SYSTEM_ANNOUNCEMENT` notifications and writes an audit log entry for each send action.
                    </div>
                </form>
            </div>
        </div>
    )
}

export default NotificationCenter
