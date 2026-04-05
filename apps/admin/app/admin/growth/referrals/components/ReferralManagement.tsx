'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api'
import { useToast } from '@/components/ToastContext'
import {
    BadgeDollarSign,
    Gift,
    Loader2,
    RefreshCw,
    Search,
    TrendingUp,
    Trophy,
    Users,
} from 'lucide-react'

interface ReferralLeader {
    id: string
    email: string
    username: string
    firstName?: string | null
    lastName?: string | null
    referralCode?: string | null
    createdAt: string
    referralCount: number
    referredInvestedCount: number
    referralBonusTotal: number
    bonusCount: number
    lastBonusAt?: string | null
    displayName: string
}

interface RecentReferralBonus {
    id: string
    amount: number
    createdAt: string
    description?: string | null
    reference?: string | null
    user?: {
        id: string
        email: string
        username: string
        firstName?: string | null
        lastName?: string | null
        displayName: string
    } | null
}

interface ReferralOverviewData {
    summary: {
        totalReferrers: number
        totalReferredUsers: number
        totalReferralBonuses: number
        totalBonusTransactions: number
    }
    leaderboard: ReferralLeader[]
    topReferrers: ReferralLeader[]
    recentBonuses: RecentReferralBonus[]
    pagination: {
        page: number
        limit: number
        total: number
        pages: number
    }
}

interface BonusFormState {
    userId: string
    amount: string
    reason: string
}

const initialBonusForm: BonusFormState = {
    userId: '',
    amount: '',
    reason: '',
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(Number(value || 0))

const formatDateTime = (value?: string | null) => {
    if (!value) return 'No activity yet'

    return new Date(value).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}

const getDisplayName = (user?: {
    displayName?: string
    firstName?: string | null
    lastName?: string | null
    username?: string
    email?: string
} | null) => {
    if (!user) return 'Unknown user'
    if (user.displayName) return user.displayName

    return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username || user.email || 'Unknown user'
}

const ReferralManagement = () => {
    const { addToast } = useToast()
    const [dashboard, setDashboard] = useState<ReferralOverviewData | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchInput, setSearchInput] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [bonusForm, setBonusForm] = useState<BonusFormState>(initialBonusForm)

    const loadDashboard = async (page = currentPage, showRefreshing = false) => {
        if (showRefreshing) {
            setRefreshing(true)
        } else {
            setLoading(true)
        }

        setError(null)

        const queryParams = new URLSearchParams({
            page: String(page),
            limit: '10',
        })

        if (searchTerm.trim()) {
            queryParams.append('search', searchTerm.trim())
        }

        const response = await apiClient.get<ReferralOverviewData>(`/admin/referrals/overview?${queryParams.toString()}`)

        if (!response.success || !response.data) {
            const message = response.error?.message || 'Failed to load referral workspace'
            setError(message)
            setDashboard(null)
            setLoading(false)
            setRefreshing(false)
            return
        }

        setDashboard(response.data)
        setCurrentPage(response.data.pagination.page)
        setLoading(false)
        setRefreshing(false)
    }

    useEffect(() => {
        loadDashboard(1)
    }, [searchTerm])

    const handleRefresh = async () => {
        await loadDashboard(currentPage, true)
    }

    const handleSearchSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setCurrentPage(1)
        setSearchTerm(searchInput.trim())
    }

    const handleSelectLeader = (leader: ReferralLeader) => {
        setBonusForm((current) => ({
            ...current,
            userId: leader.id,
        }))
    }

    const handleBonusCorrection = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const amount = Number(bonusForm.amount)
        const reason = bonusForm.reason.trim()

        if (!bonusForm.userId.trim()) {
            addToast('error', 'User required', 'Choose a leaderboard row or paste a valid user ID.')
            return
        }

        if (!Number.isFinite(amount) || amount === 0) {
            addToast('error', 'Invalid amount', 'Enter a positive or negative dollar amount, but not zero.')
            return
        }

        if (reason.length < 5) {
            addToast('error', 'Reason required', 'Add a short explanation for the correction so the audit trail is clear.')
            return
        }

        setSaving(true)

        try {
            const response = await apiClient.post('/admin/referrals/bonuses/adjust', {
                userId: bonusForm.userId.trim(),
                amount,
                reason,
            })

            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to apply referral bonus correction')
            }

            addToast(
                'success',
                'Referral bonus corrected',
                response.message || 'The referral bonus governance action has been recorded.'
            )
            setBonusForm((current) => ({
                ...initialBonusForm,
                userId: current.userId,
            }))
            await loadDashboard(currentPage, true)
        } catch (saveError) {
            addToast(
                'error',
                'Correction failed',
                saveError instanceof Error ? saveError.message : 'Unable to save the referral bonus correction'
            )
        } finally {
            setSaving(false)
        }
    }

    const summary = dashboard?.summary
    const leaderboard = dashboard?.leaderboard || []
    const topReferrers = dashboard?.topReferrers || []
    const recentBonuses = dashboard?.recentBonuses || []
    const pagination = dashboard?.pagination

    const summaryCards = [
        {
            label: 'Active Referrers',
            value: summary?.totalReferrers ?? 0,
            helper: 'Users with at least one referral',
            icon: Users,
        },
        {
            label: 'Referred Users',
            value: summary?.totalReferredUsers ?? 0,
            helper: 'All accounts tied to a referrer',
            icon: TrendingUp,
        },
        {
            label: 'Referral Bonuses',
            value: formatCurrency(summary?.totalReferralBonuses ?? 0),
            helper: 'Completed bonus value on the ledger',
            icon: BadgeDollarSign,
        },
        {
            label: 'Bonus Transactions',
            value: summary?.totalBonusTransactions ?? 0,
            helper: 'Adjustment and payout entries combined',
            icon: Gift,
        },
    ]

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm"
            >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">
                            Growth
                        </div>
                        <h1 className="mt-4 text-3xl font-bold text-white">Referral oversight is now live for admin</h1>
                        <p className="mt-3 text-sm leading-6 text-gray-300">
                            Growth operations can monitor referral performance, review leaderboard standings, and apply audited
                            bonus corrections without leaving the admin workspace.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={loading || refreshing}
                            className="inline-flex items-center gap-2 rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Refresh
                        </button>
                    </div>
                </div>
            </motion.div>

            {loading ? (
                <div className="rounded-3xl border border-gold-500/20 bg-dark-800/50 px-6 py-16 text-center text-gray-300">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold-300" />
                    <p className="mt-4 text-sm">Loading referral oversight...</p>
                </div>
            ) : error ? (
                <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-100">
                    <h2 className="text-lg font-semibold">Referral workspace unavailable</h2>
                    <p className="mt-2 text-sm leading-6 text-red-100/80">{error}</p>
                    <p className="mt-3 text-xs text-red-100/60">
                        If this is a fresh rollout, make sure the admin referral routes are mounted on the backend.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {summaryCards.map((card, index) => (
                            <motion.div
                                key={card.label}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="rounded-3xl border border-gold-500/20 bg-dark-800/50 p-5 backdrop-blur-sm"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm text-gray-400">{card.label}</p>
                                        <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
                                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-500">{card.helper}</p>
                                    </div>
                                    <div className="rounded-2xl bg-gold-500/10 p-3 text-gold-300">
                                        <card.icon className="h-5 w-5" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.6fr),minmax(320px,0.9fr)]">
                        <div className="space-y-6">
                            <div className="rounded-3xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm">
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">Leaderboard oversight</h2>
                                        <p className="mt-2 text-sm text-gray-300">
                                            Review who is driving referrals, how many referred users converted, and how much
                                            referral bonus value has reached the ledger.
                                        </p>
                                    </div>

                                    <form onSubmit={handleSearchSubmit} className="flex w-full max-w-xl gap-3">
                                        <div className="relative flex-1">
                                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                                            <input
                                                value={searchInput}
                                                onChange={(event) => setSearchInput(event.target.value)}
                                                placeholder="Search name, email, username, or referral code"
                                                className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 py-3 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-gold-500/40"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="rounded-xl bg-gold-500 px-4 py-3 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400"
                                        >
                                            Search
                                        </button>
                                    </form>
                                </div>

                                <div className="mt-6 overflow-hidden rounded-2xl border border-gold-500/20 bg-navy-950/30">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-white/10">
                                            <thead className="bg-white/5">
                                                <tr className="text-left text-xs uppercase tracking-[0.2em] text-gray-400">
                                                    <th className="px-4 py-4 font-medium">Referrer</th>
                                                    <th className="px-4 py-4 font-medium">Code</th>
                                                    <th className="px-4 py-4 font-medium">Referrals</th>
                                                    <th className="px-4 py-4 font-medium">Converted</th>
                                                    <th className="px-4 py-4 font-medium">Bonuses</th>
                                                    <th className="px-4 py-4 font-medium">Last Bonus</th>
                                                    <th className="px-4 py-4 font-medium">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/10">
                                                {leaderboard.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                                                            No referral performance matched this search yet.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    leaderboard.map((leader) => (
                                                        <tr key={leader.id} className="text-sm text-gray-200">
                                                            <td className="px-4 py-4 align-top">
                                                                <div className="font-medium text-white">{leader.displayName}</div>
                                                                <div className="mt-1 text-xs text-gray-400">{leader.email}</div>
                                                                <div className="mt-1 text-xs text-gray-500">ID: {leader.id}</div>
                                                            </td>
                                                            <td className="px-4 py-4 align-top">
                                                                <span className="rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-300">
                                                                    {leader.referralCode || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4 align-top">
                                                                <div className="font-semibold text-white">{leader.referralCount}</div>
                                                                <div className="mt-1 text-xs text-gray-500">All referred users</div>
                                                            </td>
                                                            <td className="px-4 py-4 align-top">
                                                                <div className="font-semibold text-white">{leader.referredInvestedCount}</div>
                                                                <div className="mt-1 text-xs text-gray-500">With funded activity</div>
                                                            </td>
                                                            <td className="px-4 py-4 align-top">
                                                                <div className="font-semibold text-white">
                                                                    {formatCurrency(leader.referralBonusTotal)}
                                                                </div>
                                                                <div className="mt-1 text-xs text-gray-500">
                                                                    {leader.bonusCount} ledger entries
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 align-top text-xs text-gray-400">
                                                                {formatDateTime(leader.lastBonusAt)}
                                                            </td>
                                                            <td className="px-4 py-4 align-top">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSelectLeader(leader)}
                                                                    className="inline-flex items-center gap-2 rounded-lg border border-gold-500/20 bg-navy-900/60 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-navy-800"
                                                                >
                                                                    <Gift className="h-4 w-4 text-gold-300" />
                                                                    Correct bonus
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-col gap-3 text-sm text-gray-400 md:flex-row md:items-center md:justify-between">
                                    <p>
                                        Showing page {pagination?.page || 1} of {Math.max(pagination?.pages || 1, 1)} with{' '}
                                        {pagination?.total || 0} tracked referrers.
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => loadDashboard(Math.max(1, currentPage - 1), true)}
                                            disabled={currentPage <= 1 || refreshing}
                                            className="rounded-lg border border-gold-500/20 px-3 py-2 text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                loadDashboard(
                                                    Math.min(pagination?.pages || currentPage, currentPage + 1),
                                                    true
                                                )
                                            }
                                            disabled={!pagination || currentPage >= pagination.pages || refreshing}
                                            className="rounded-lg border border-gold-500/20 px-3 py-2 text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-6 xl:grid-cols-2">
                                <div className="rounded-3xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-2xl bg-gold-500/10 p-3 text-gold-300">
                                            <Trophy className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-semibold text-white">Top referrers</h2>
                                            <p className="text-sm text-gray-400">Highest bonus totals in the current view</p>
                                        </div>
                                    </div>

                                    <div className="mt-6 space-y-3">
                                        {topReferrers.length === 0 ? (
                                            <div className="rounded-2xl border border-white/10 bg-navy-900/40 p-4 text-sm text-gray-400">
                                                No top performers available yet.
                                            </div>
                                        ) : (
                                            topReferrers.map((leader, index) => (
                                                <div
                                                    key={leader.id}
                                                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-navy-900/40 p-4"
                                                >
                                                    <div>
                                                        <div className="text-sm text-gray-500">#{index + 1}</div>
                                                        <div className="mt-1 font-medium text-white">{leader.displayName}</div>
                                                        <div className="mt-1 text-xs text-gray-400">
                                                            {leader.referralCount} referrals, {leader.referredInvestedCount} converted
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-semibold text-gold-300">
                                                            {formatCurrency(leader.referralBonusTotal)}
                                                        </div>
                                                        <div className="mt-1 text-xs text-gray-500">{leader.bonusCount} bonus entries</div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-2xl bg-gold-500/10 p-3 text-gold-300">
                                            <BadgeDollarSign className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-semibold text-white">Recent referral bonuses</h2>
                                            <p className="text-sm text-gray-400">Latest completed referral bonus entries</p>
                                        </div>
                                    </div>

                                    <div className="mt-6 space-y-3">
                                        {recentBonuses.length === 0 ? (
                                            <div className="rounded-2xl border border-white/10 bg-navy-900/40 p-4 text-sm text-gray-400">
                                                No referral bonus activity is available yet.
                                            </div>
                                        ) : (
                                            recentBonuses.map((bonus) => (
                                                <div
                                                    key={bonus.id}
                                                    className="rounded-2xl border border-white/10 bg-navy-900/40 p-4"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <div className="font-medium text-white">{getDisplayName(bonus.user)}</div>
                                                            <div className="mt-1 text-xs text-gray-400">
                                                                {bonus.user?.email || bonus.reference || 'Referral bonus entry'}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-semibold text-gold-300">
                                                                {formatCurrency(bonus.amount)}
                                                            </div>
                                                            <div className="mt-1 text-xs text-gray-500">{formatDateTime(bonus.createdAt)}</div>
                                                        </div>
                                                    </div>
                                                    {bonus.description ? (
                                                        <p className="mt-3 text-sm leading-6 text-gray-300">{bonus.description}</p>
                                                    ) : null}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="rounded-3xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl bg-gold-500/10 p-3 text-gold-300">
                                        <Gift className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">Manual bonus correction</h2>
                                        <p className="text-sm text-gray-400">
                                            Apply an audited positive or negative referral bonus adjustment.
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={handleBonusCorrection} className="mt-6 space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-white">Target user ID</label>
                                        <input
                                            value={bonusForm.userId}
                                            onChange={(event) =>
                                                setBonusForm((current) => ({ ...current, userId: event.target.value }))
                                            }
                                            placeholder="Select a referrer above or paste a user ID"
                                            className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-gold-500/40"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-white">Adjustment amount</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={bonusForm.amount}
                                            onChange={(event) =>
                                                setBonusForm((current) => ({ ...current, amount: event.target.value }))
                                            }
                                            placeholder="Use a negative value to reverse an over-credit"
                                            className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-gold-500/40"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-white">Reason</label>
                                        <textarea
                                            value={bonusForm.reason}
                                            onChange={(event) =>
                                                setBonusForm((current) => ({ ...current, reason: event.target.value }))
                                            }
                                            rows={5}
                                            placeholder="Explain why the referral bonus needs correction"
                                            className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-gold-500/40"
                                        />
                                    </div>

                                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm leading-6 text-blue-100">
                                        This action writes a completed `REFERRAL_BONUS` transaction and an audit log entry, then
                                        notifies the user about the correction.
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold-500 px-4 py-3 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
                                        Save referral correction
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default ReferralManagement
