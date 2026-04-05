'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Ban, Eye, Loader2, RefreshCw, Search, Unlock, UserCheck } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { adminRoutes } from '@/lib/adminRoutes'
import { useToast } from '@/components/ToastContext'

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

const kycClasses: Record<KycStatus, string> = {
    PENDING: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-200',
    APPROVED: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
    REJECTED: 'border-red-500/20 bg-red-500/10 text-red-200',
    UNDER_REVIEW: 'border-blue-500/20 bg-blue-500/10 text-blue-200',
}

const accountClasses: Record<AccountState, string> = {
    ACTIVE: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
    FROZEN: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
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
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm"
            >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="max-w-3xl">
                        <div className="inline-flex rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">
                            Compliance
                        </div>
                        <h1 className="mt-4 text-3xl font-bold text-white">Freeze, unfreeze, and move KYC into review from one queue</h1>
                        <p className="mt-3 text-sm leading-6 text-gray-300">
                            This queue is intentionally compact. It surfaces restricted accounts and customers whose KYC state still needs an operator decision, then writes each action to the audit log with a reason.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            href={adminRoutes.complianceKyc}
                            className="inline-flex items-center gap-2 rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-2 text-sm text-white transition-colors hover:bg-navy-800"
                        >
                            <UserCheck className="h-4 w-4" />
                            Open full KYC queue
                        </Link>
                        <button
                            onClick={() => void fetchWorkspace(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400"
                        >
                            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Refresh
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
                {summaryCards.map((card) => (
                    <div key={card.label} className="rounded-2xl border border-gold-500/20 bg-dark-800/50 p-5 backdrop-blur-sm">
                        <p className="text-sm text-gray-400">{card.label}</p>
                        <p className="mt-2 text-3xl font-bold text-white">{card.value}</p>
                        <p className="mt-1 text-xs text-gray-500">{card.helper}</p>
                    </div>
                ))}
            </div>

            <div className="rounded-3xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search username, email, or customer name"
                            className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 py-3 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-gold-500/40"
                        />
                    </div>

                    <select
                        value={accountState}
                        onChange={(event) => setAccountState(event.target.value as 'ALL' | AccountState)}
                        className="rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-sm text-white outline-none"
                    >
                        <option value="ALL">All accounts</option>
                        <option value="ACTIVE">Active only</option>
                        <option value="FROZEN">Frozen only</option>
                    </select>

                    <select
                        value={kycFilter}
                        onChange={(event) => setKycFilter(event.target.value as 'ALL' | KycStatus)}
                        className="rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-sm text-white outline-none"
                    >
                        <option value="ALL">All KYC states</option>
                        <option value="PENDING">Pending</option>
                        <option value="UNDER_REVIEW">Under review</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-gold-500/10">
                    <div className="grid grid-cols-[minmax(0,1.5fr)_120px_120px_140px] gap-4 border-b border-gold-500/10 bg-navy-900/40 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                        <div>Customer</div>
                        <div>Account</div>
                        <div>KYC</div>
                        <div>Actions</div>
                    </div>

                    {loading ? (
                        <div className="px-5 py-10 text-center text-sm text-gray-400">Loading compliance queue...</div>
                    ) : payload?.queue.length ? (
                        <div className="divide-y divide-gold-500/10">
                            {payload.queue.map((entry) => {
                                const displayName = `${entry.firstName || ''} ${entry.lastName || ''}`.trim() || entry.username
                                const currentAccountState: AccountState = entry.isActive ? 'ACTIVE' : 'FROZEN'

                                return (
                                    <div key={entry.id} className="grid grid-cols-[minmax(0,1.5fr)_120px_120px_140px] gap-4 px-5 py-4">
                                        <div>
                                            <p className="font-semibold text-white">{displayName}</p>
                                            <p className="text-sm text-gray-400">{entry.email}</p>
                                            <p className="mt-2 text-xs text-gray-500">
                                                {entry.pendingDocuments} pending docs, {entry.rejectedDocuments} rejected docs
                                            </p>
                                        </div>

                                        <div>
                                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${accountClasses[currentAccountState]}`}>
                                                {currentAccountState}
                                            </span>
                                        </div>

                                        <div>
                                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${kycClasses[entry.kycStatus]}`}>
                                                {kycLabels[entry.kycStatus]}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {entry.isActive ? (
                                                <button
                                                    onClick={() => startAction(entry, 'freeze')}
                                                    className="inline-flex h-9 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 text-amber-100 transition-colors hover:bg-amber-500/20"
                                                    title="Freeze account"
                                                >
                                                    <Ban className="h-4 w-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => startAction(entry, 'unfreeze')}
                                                    className="inline-flex h-9 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 text-emerald-100 transition-colors hover:bg-emerald-500/20"
                                                    title="Unfreeze account"
                                                >
                                                    <Unlock className="h-4 w-4" />
                                                </button>
                                            )}

                                            {entry.kycStatus !== 'UNDER_REVIEW' && (
                                                <button
                                                    onClick={() => startAction(entry, 'mark_under_review')}
                                                    className="inline-flex h-9 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 text-blue-100 transition-colors hover:bg-blue-500/20"
                                                    title="Mark KYC under review"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            )}

                                            <Link
                                                href={`${adminRoutes.customers}/${entry.id}`}
                                                className="inline-flex h-9 items-center justify-center rounded-lg border border-gold-500/20 bg-navy-900/60 px-3 text-white transition-colors hover:bg-navy-800"
                                                title="Open customer"
                                            >
                                                <UserCheck className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="px-5 py-10 text-center text-sm text-gray-400">No compliance cases matched the current filters.</div>
                    )}
                </div>
            </div>

            {actingOn && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-xl rounded-3xl border border-gold-500/20 bg-dark-900 p-6">
                        <h2 className="text-2xl font-bold text-white">
                            {action === 'freeze'
                                ? 'Freeze account'
                                : action === 'unfreeze'
                                  ? 'Unfreeze account'
                                  : 'Mark KYC under review'}
                        </h2>
                        <p className="mt-2 text-sm text-gray-400">
                            Add a short note for {actingOn.username}. This reason is stored in the admin audit log.
                        </p>

                        <textarea
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            rows={5}
                            className="mt-5 w-full rounded-2xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none placeholder:text-gray-500"
                            placeholder="Reason for this compliance action"
                        />

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={closeAction}
                                className="rounded-xl border border-gold-500/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => void submitAction()}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                Save action
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ComplianceWorkspace
