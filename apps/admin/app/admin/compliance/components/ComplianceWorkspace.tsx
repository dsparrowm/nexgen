'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Ban, Eye, Loader2, RefreshCw, Unlock, UserCheck } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { adminRoutes } from '@/lib/adminRoutes'
import { useToast } from '@/components/ToastContext'
import {
    Badge,
    Button,
    Card,
    CardContent,
    DataTable,
    EmptyState,
    IconButton,
    SearchInput,
    Select,
    Skeleton,
    StatCard,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    WorkspaceHeader,
    WorkspaceToolbar,
    WorkspaceToolbarFilters,
} from '@/components/ui'

type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW'
type AccountState = 'ACTIVE' | 'FROZEN'
type ComplianceAction = 'freeze' | 'unfreeze' | 'mark_under_review'

interface ComplianceQueueEntry {
    id: string
    email: string
    username: string
    firstName: string | null
    lastName: string | null
    isActive: boolean
    kycStatus: KycStatus
    pendingDocuments: number
    rejectedDocuments: number
    createdAt: string
    updatedAt: string
}

interface CompliancePayload {
    summary: {
        queuedAccounts: number
        frozenAccounts: number
        underReviewAccounts: number
    }
    queue: ComplianceQueueEntry[]
    pagination: {
        page: number
        limit: number
        total: number
        pages: number
    }
}

const kycLabels: Record<KycStatus, string> = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    UNDER_REVIEW: 'Under review',
}

const kycBadgeVariant = (status: KycStatus): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) {
        case 'APPROVED':
            return 'success'
        case 'REJECTED':
            return 'error'
        case 'PENDING':
            return 'warning'
        default:
            return 'neutral'
    }
}

const ComplianceWorkspace: React.FC = () => {
    const { addToast } = useToast()
    const [payload, setPayload] = useState<CompliancePayload | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [accountState, setAccountState] = useState<'ALL' | AccountState>('ALL')
    const [kycFilter, setKycFilter] = useState<'ALL' | KycStatus>('ALL')
    const [actingOn, setActingOn] = useState<ComplianceQueueEntry | null>(null)
    const [action, setAction] = useState<ComplianceAction>('freeze')
    const [reason, setReason] = useState('')
    const [saving, setSaving] = useState(false)

    const fetchWorkspace = async (showRefreshing = false) => {
        if (showRefreshing) {
            setRefreshing(true)
        } else {
            setLoading(true)
        }

        try {
            setError(null)
            const params = new URLSearchParams()
            if (search.trim()) params.set('search', search.trim())
            if (accountState !== 'ALL') params.set('accountState', accountState)
            if (kycFilter !== 'ALL') params.set('kycStatus', kycFilter)

            const response = await apiClient.get<CompliancePayload>(`/admin/compliance${params.toString() ? `?${params.toString()}` : ''}`)

            if (!response.success || !response.data) {
                throw new Error(response.error?.message || 'Failed to load compliance queue')
            }

            setPayload(response.data)
        } catch (workspaceError) {
            setError(workspaceError instanceof Error ? workspaceError.message : 'Failed to load compliance queue')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void fetchWorkspace()
        }, 200)

        return () => window.clearTimeout(timeout)
    }, [search, accountState, kycFilter])

    const summaryCards = useMemo(() => {
        if (!payload) return []

        return [
            {
                label: 'Queue',
                value: payload.summary.queuedAccounts,
                helper: 'Accounts needing compliance attention',
            },
            {
                label: 'Frozen',
                value: payload.summary.frozenAccounts,
                helper: 'Accounts with access disabled',
            },
            {
                label: 'Under Review',
                value: payload.summary.underReviewAccounts,
                helper: 'Users currently in KYC review',
            },
        ]
    }, [payload])

    const startAction = (entry: ComplianceQueueEntry, nextAction: ComplianceAction) => {
        setActingOn(entry)
        setAction(nextAction)
        setReason('')
    }

    const closeAction = () => {
        if (saving) return
        setActingOn(null)
        setReason('')
    }

    const submitAction = async () => {
        if (!actingOn) return

        if (reason.trim().length < 3) {
            addToast('error', 'Reason required', 'Add a short audit note before saving this compliance action.')
            return
        }

        setSaving(true)

        try {
            const response = await apiClient.put(`/admin/compliance/users/${actingOn.id}/restriction`, {
                action,
                reason: reason.trim(),
            })

            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to update compliance state')
            }

            addToast('success', 'Compliance updated', response.message || 'The account state was updated.')
            closeAction()
            await fetchWorkspace(true)
        } catch (updateError) {
            addToast(
                'error',
                'Compliance update failed',
                updateError instanceof Error ? updateError.message : 'Unable to update the account state'
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <WorkspaceHeader
                title="Compliance queue"
                description="Freeze, unfreeze, and move KYC into review from one queue. Each action is written to the audit log with a reason."
                action={
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={adminRoutes.complianceKyc}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                        >
                            <UserCheck className="h-4 w-4" />
                            Open KYC queue
                        </Link>
                        <Button onClick={() => void fetchWorkspace(true)} disabled={refreshing}>
                            {refreshing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                            Refresh
                        </Button>
                    </div>
                }
            />

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {loading && !payload
                    ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)
                    : summaryCards.map((card) => (
                          <StatCard
                              key={card.label}
                              title={card.label}
                              value={String(card.value)}
                              description={card.helper}
                          />
                      ))}
            </div>

            <WorkspaceToolbar>
                <WorkspaceToolbarFilters>
                    <SearchInput
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search username, email, or customer name"
                        containerClassName="w-full xl:w-80"
                    />
                    <Select
                        value={accountState}
                        onChange={(event) => setAccountState(event.target.value as 'ALL' | AccountState)}
                        className="w-full sm:w-40"
                    >
                        <option value="ALL">All accounts</option>
                        <option value="ACTIVE">Active only</option>
                        <option value="FROZEN">Frozen only</option>
                    </Select>
                    <Select
                        value={kycFilter}
                        onChange={(event) => setKycFilter(event.target.value as 'ALL' | KycStatus)}
                        className="w-full sm:w-44"
                    >
                        <option value="ALL">All KYC states</option>
                        <option value="PENDING">Pending</option>
                        <option value="UNDER_REVIEW">Under review</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </Select>
                </WorkspaceToolbarFilters>
            </WorkspaceToolbar>

            <DataTable>
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                    </div>
                ) : payload?.queue.length ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Account</TableHead>
                                <TableHead>KYC</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payload.queue.map((entry) => {
                                const displayName =
                                    `${entry.firstName || ''} ${entry.lastName || ''}`.trim() || entry.username
                                const currentAccountState: AccountState = entry.isActive ? 'ACTIVE' : 'FROZEN'

                                return (
                                    <TableRow key={entry.id}>
                                        <TableCell>
                                            <p className="font-medium text-zinc-900">{displayName}</p>
                                            <p className="text-sm text-zinc-500">{entry.email}</p>
                                            <p className="mt-1 text-xs text-zinc-400">
                                                {entry.pendingDocuments} pending docs, {entry.rejectedDocuments}{' '}
                                                rejected
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={currentAccountState === 'ACTIVE' ? 'success' : 'warning'}>
                                                {currentAccountState}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={kycBadgeVariant(entry.kycStatus)}>
                                                {kycLabels[entry.kycStatus]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-1">
                                                {entry.isActive ? (
                                                    <IconButton
                                                        onClick={() => startAction(entry, 'freeze')}
                                                        title="Freeze account"
                                                        className="hover:bg-amber-50 hover:text-amber-700"
                                                    >
                                                        <Ban className="h-4 w-4" />
                                                    </IconButton>
                                                ) : (
                                                    <IconButton
                                                        onClick={() => startAction(entry, 'unfreeze')}
                                                        title="Unfreeze account"
                                                        className="hover:bg-green-50 hover:text-green-700"
                                                    >
                                                        <Unlock className="h-4 w-4" />
                                                    </IconButton>
                                                )}
                                                {entry.kycStatus !== 'UNDER_REVIEW' && (
                                                    <IconButton
                                                        onClick={() => startAction(entry, 'mark_under_review')}
                                                        title="Mark KYC under review"
                                                        className="hover:bg-blue-50 hover:text-blue-700"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </IconButton>
                                                )}
                                                <Link
                                                    href={`${adminRoutes.customers}/${entry.id}`}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                                                    title="Open customer"
                                                >
                                                    <UserCheck className="h-4 w-4" />
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                ) : (
                    <EmptyState
                        title="No compliance cases"
                        description="No accounts matched the current filters."
                    />
                )}
            </DataTable>

            {actingOn && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-xl shadow-card-hover">
                        <CardContent className="p-6">
                            <h2 className="text-xl font-semibold text-zinc-900">
                                {action === 'freeze'
                                    ? 'Freeze account'
                                    : action === 'unfreeze'
                                      ? 'Unfreeze account'
                                      : 'Mark KYC under review'}
                            </h2>
                            <p className="mt-2 text-sm text-zinc-500">
                                Add a short note for {actingOn.username}. This reason is stored in the admin audit
                                log.
                            </p>

                            <textarea
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                rows={5}
                                className="mt-5 w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-gold-500"
                                placeholder="Reason for this compliance action"
                            />

                            <div className="mt-6 flex justify-end gap-3">
                                <Button variant="secondary" onClick={closeAction}>
                                    Cancel
                                </Button>
                                <Button onClick={() => void submitAction()} disabled={saving}>
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                    Save action
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}

export default ComplianceWorkspace
