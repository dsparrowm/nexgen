'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { apiClient } from '@/lib/api'
import { useToast } from '@/components/ToastContext'
import {
    Bell,
    RefreshCw,
    Send,
    Users,
} from 'lucide-react'
import {
    Badge,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    EmptyState,
    Input,
    Pagination,
    SearchInput,
    Select,
    Skeleton,
    StatCard,
    WorkspaceHeader,
} from '@/components/ui'
import { cn } from '@/lib/utils'

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
            { label: 'Broadcasts', value: String(payload.summary.total), helper: 'System announcement notifications', icon: Bell },
            { label: 'Unread', value: String(payload.summary.unreadCount), helper: 'Users who have not opened them yet', icon: Bell },
            { label: 'Recipients', value: String(payload.summary.recipientCount), helper: 'Matching users in the current view', icon: Users },
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

    if (loading && !payload) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-16 w-full" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <WorkspaceHeader
                title="Notification Center"
                description="Broadcast announcements and system notices to targeted user segments."
                action={
                    <Button variant="secondary" onClick={() => void loadWorkspace(page, true)} disabled={refreshing}>
                        <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
                        Refresh
                    </Button>
                }
            />

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <p className="text-sm text-red-700">{error}</p>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {summaryCards.map((card) => (
                    <StatCard
                        key={card.label}
                        title={card.label}
                        value={card.value}
                        description={card.helper}
                        icon={card.icon}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle className="text-base">Recent broadcasts</CardTitle>
                                <CardDescription>Notifications sent through the admin workspace.</CardDescription>
                            </div>
                            <SearchInput
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search title, message, or recipient"
                                containerClassName="w-full md:w-72"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {refreshing ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
                            </div>
                        ) : !payload?.notifications.length ? (
                            <EmptyState
                                icon={Bell}
                                title="No broadcasts yet"
                                description="No broadcast notifications have been sent yet."
                            />
                        ) : (
                            <div className="space-y-4">
                                {payload.notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
                                    >
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Bell className="h-4 w-4 text-gold-600" />
                                                    <h3 className="font-semibold text-zinc-900">{notification.title}</h3>
                                                </div>
                                                <p className="mt-2 text-sm text-zinc-600">{notification.message}</p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <Badge variant="neutral">{formatDate(notification.createdAt)}</Badge>
                                                    <Badge variant="neutral">
                                                        {notification.user?.email || 'Broadcast recipient'}
                                                    </Badge>
                                                    {notification.metadata?.broadcast && (
                                                        <Badge variant="success">Broadcast</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge variant={notification.isRead ? 'neutral' : 'warning'}>
                                                {notification.isRead ? 'Read' : 'Unread'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!loading && payload?.pagination && payload.pagination.pages > 1 && (
                            <Pagination
                                page={payload.pagination.page}
                                pages={payload.pagination.pages}
                                total={payload.pagination.total}
                                limit={payload.pagination.limit}
                                onPageChange={(nextPage) => void loadWorkspace(nextPage)}
                                className="mt-4 border-t-0 px-0"
                            />
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-gold-50 p-2">
                                <Send className="h-5 w-5 text-gold-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Compose broadcast</CardTitle>
                                <CardDescription>Send a system announcement to a target segment.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitBroadcast} className="space-y-4">
                            <Input
                                label="Title"
                                value={form.title}
                                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                                placeholder="Scheduled maintenance notice"
                            />

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Message</label>
                                <textarea
                                    value={form.message}
                                    onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                                    rows={5}
                                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                                    placeholder="Write the announcement you want users to receive."
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <Select
                                    label="Target role"
                                    value={form.targetRole}
                                    onChange={(event) =>
                                        setForm((current) => ({ ...current, targetRole: event.target.value as TargetRole }))
                                    }
                                >
                                    <option value="ALL">All users</option>
                                    <option value="USER">Users only</option>
                                    <option value="ADMIN">Admins only</option>
                                    <option value="SUPER_ADMIN">Super admins only</option>
                                </Select>

                                <Select
                                    label="KYC status"
                                    value={form.kycStatus}
                                    onChange={(event) =>
                                        setForm((current) => ({ ...current, kycStatus: event.target.value as KycFilter }))
                                    }
                                >
                                    <option value="ALL">Any status</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="APPROVED">Approved</option>
                                    <option value="REJECTED">Rejected</option>
                                    <option value="UNDER_REVIEW">Under review</option>
                                </Select>
                            </div>

                            <label className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                                <input
                                    type="checkbox"
                                    checked={form.activeOnly}
                                    onChange={(event) =>
                                        setForm((current) => ({ ...current, activeOnly: event.target.checked }))
                                    }
                                    className="rounded border-zinc-300 text-gold-500 focus:ring-gold-500"
                                />
                                Send only to active accounts
                            </label>

                            <Button type="submit" disabled={saving} className="w-full">
                                {saving ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                                Send broadcast
                            </Button>

                            <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs leading-6 text-zinc-500">
                                The backend stores broadcasts as `SYSTEM_ANNOUNCEMENT` notifications and writes an audit
                                log entry for each send action.
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default NotificationCenter
