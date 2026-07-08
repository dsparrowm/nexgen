'use client'

import React, { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { useToast } from '@/components/ToastContext'
import {
    BadgeDollarSign,
    Gift,
    RefreshCw,
    Search,
    TrendingUp,
    Trophy,
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
    DataTable,
    EmptyState,
    Input,
    Pagination,
    Skeleton,
    StatCard,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    WorkspaceHeader,
} from '@/components/ui'
import { cn } from '@/lib/utils'

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

    if (loading && !dashboard) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-16 w-full" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
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
                title="Referral Management"
                description="Monitor referral performance, review leaderboard standings, and apply audited bonus corrections."
                action={
                    <Button variant="secondary" onClick={handleRefresh} disabled={loading || refreshing}>
                        <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
                        Refresh
                    </Button>
                }
            />

            {error ? (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-6">
                        <h2 className="text-lg font-semibold text-red-700">Referral workspace unavailable</h2>
                        <p className="mt-2 text-sm text-red-600">{error}</p>
                        <p className="mt-3 text-xs text-red-500">
                            If this is a fresh rollout, make sure the admin referral routes are mounted on the backend.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            title="Active Referrers"
                            value={String(summary?.totalReferrers ?? 0)}
                            description="Users with at least one referral"
                            icon={Users}
                        />
                        <StatCard
                            title="Referred Users"
                            value={String(summary?.totalReferredUsers ?? 0)}
                            description="All accounts tied to a referrer"
                            icon={TrendingUp}
                        />
                        <StatCard
                            title="Referral Bonuses"
                            value={formatCurrency(summary?.totalReferralBonuses ?? 0)}
                            description="Completed bonus value on the ledger"
                            icon={BadgeDollarSign}
                        />
                        <StatCard
                            title="Bonus Transactions"
                            value={String(summary?.totalBonusTransactions ?? 0)}
                            description="Adjustment and payout entries combined"
                            icon={Gift}
                        />
                    </div>

                    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.6fr),minmax(320px,0.9fr)]">
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                                        <div>
                                            <CardTitle className="text-base">Leaderboard oversight</CardTitle>
                                            <CardDescription>
                                                Review who is driving referrals, conversion rates, and bonus value on
                                                the ledger.
                                            </CardDescription>
                                        </div>

                                        <form onSubmit={handleSearchSubmit} className="flex w-full max-w-xl gap-2">
                                            <Input
                                                value={searchInput}
                                                onChange={(event) => setSearchInput(event.target.value)}
                                                placeholder="Search name, email, username, or referral code"
                                                leftIcon={<Search className="h-4 w-4" />}
                                                className="flex-1"
                                            />
                                            <Button type="submit" variant="secondary">
                                                Search
                                            </Button>
                                        </form>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <DataTable>
                                        {refreshing ? (
                                            <div className="flex items-center justify-center py-16">
                                                <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
                                            </div>
                                        ) : leaderboard.length === 0 ? (
                                            <EmptyState
                                                icon={Trophy}
                                                title="No referrers found"
                                                description="No referral performance matched this search yet."
                                            />
                                        ) : (
                                            <>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Referrer</TableHead>
                                                            <TableHead>Code</TableHead>
                                                            <TableHead>Referrals</TableHead>
                                                            <TableHead>Converted</TableHead>
                                                            <TableHead>Bonuses</TableHead>
                                                            <TableHead>Last Bonus</TableHead>
                                                            <TableHead className="text-right">Action</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {leaderboard.map((leader) => (
                                                            <TableRow key={leader.id}>
                                                                <TableCell>
                                                                    <p className="font-medium text-zinc-900">{leader.displayName}</p>
                                                                    <p className="text-xs text-zinc-500">{leader.email}</p>
                                                                    <p className="text-xs text-zinc-400">ID: {leader.id}</p>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant="gold">{leader.referralCode || 'N/A'}</Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <p className="font-semibold text-zinc-900">{leader.referralCount}</p>
                                                                    <p className="text-xs text-zinc-400">All referred users</p>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <p className="font-semibold text-zinc-900">{leader.referredInvestedCount}</p>
                                                                    <p className="text-xs text-zinc-400">With funded activity</p>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <p className="font-semibold text-zinc-900">
                                                                        {formatCurrency(leader.referralBonusTotal)}
                                                                    </p>
                                                                    <p className="text-xs text-zinc-400">{leader.bonusCount} ledger entries</p>
                                                                </TableCell>
                                                                <TableCell className="text-xs text-zinc-500">
                                                                    {formatDateTime(leader.lastBonusAt)}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <Button
                                                                        type="button"
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        onClick={() => handleSelectLeader(leader)}
                                                                    >
                                                                        <Gift className="h-4 w-4" />
                                                                        Correct bonus
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                                {pagination && pagination.pages > 1 && (
                                                    <Pagination
                                                        page={pagination.page}
                                                        pages={pagination.pages}
                                                        total={pagination.total}
                                                        limit={pagination.limit}
                                                        onPageChange={(nextPage) => loadDashboard(nextPage, true)}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </DataTable>
                                </CardContent>
                            </Card>

                            <div className="grid gap-6 xl:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-gold-50 p-2">
                                                <Trophy className="h-5 w-5 text-gold-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">Top referrers</CardTitle>
                                                <CardDescription>Highest bonus totals in the current view</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {topReferrers.length === 0 ? (
                                            <EmptyState
                                                icon={Trophy}
                                                title="No top performers"
                                                description="No top performers available yet."
                                                className="py-8"
                                            />
                                        ) : (
                                            topReferrers.map((leader, index) => (
                                                <div
                                                    key={leader.id}
                                                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-4"
                                                >
                                                    <div>
                                                        <p className="text-xs text-zinc-400">#{index + 1}</p>
                                                        <p className="mt-1 font-medium text-zinc-900">{leader.displayName}</p>
                                                        <p className="mt-1 text-xs text-zinc-500">
                                                            {leader.referralCount} referrals, {leader.referredInvestedCount} converted
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-gold-700">
                                                            {formatCurrency(leader.referralBonusTotal)}
                                                        </p>
                                                        <p className="mt-1 text-xs text-zinc-400">{leader.bonusCount} bonus entries</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-gold-50 p-2">
                                                <BadgeDollarSign className="h-5 w-5 text-gold-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">Recent referral bonuses</CardTitle>
                                                <CardDescription>Latest completed referral bonus entries</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {recentBonuses.length === 0 ? (
                                            <EmptyState
                                                icon={Gift}
                                                title="No bonus activity"
                                                description="No referral bonus activity is available yet."
                                                className="py-8"
                                            />
                                        ) : (
                                            recentBonuses.map((bonus) => (
                                                <div
                                                    key={bonus.id}
                                                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <p className="font-medium text-zinc-900">{getDisplayName(bonus.user)}</p>
                                                            <p className="mt-1 text-xs text-zinc-500">
                                                                {bonus.user?.email || bonus.reference || 'Referral bonus entry'}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold text-gold-700">
                                                                {formatCurrency(bonus.amount)}
                                                            </p>
                                                            <p className="mt-1 text-xs text-zinc-400">{formatDateTime(bonus.createdAt)}</p>
                                                        </div>
                                                    </div>
                                                    {bonus.description ? (
                                                        <p className="mt-3 text-sm text-zinc-600">{bonus.description}</p>
                                                    ) : null}
                                                </div>
                                            ))
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-gold-50 p-2">
                                        <Gift className="h-5 w-5 text-gold-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">Manual bonus correction</CardTitle>
                                        <CardDescription>
                                            Apply an audited positive or negative referral bonus adjustment.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleBonusCorrection} className="space-y-4">
                                    <Input
                                        label="Target user ID"
                                        value={bonusForm.userId}
                                        onChange={(event) =>
                                            setBonusForm((current) => ({ ...current, userId: event.target.value }))
                                        }
                                        placeholder="Select a referrer above or paste a user ID"
                                    />

                                    <Input
                                        label="Adjustment amount"
                                        type="number"
                                        step="0.01"
                                        value={bonusForm.amount}
                                        onChange={(event) =>
                                            setBonusForm((current) => ({ ...current, amount: event.target.value }))
                                        }
                                        placeholder="Use a negative value to reverse an over-credit"
                                    />

                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-zinc-700">Reason</label>
                                        <textarea
                                            value={bonusForm.reason}
                                            onChange={(event) =>
                                                setBonusForm((current) => ({ ...current, reason: event.target.value }))
                                            }
                                            rows={5}
                                            placeholder="Explain why the referral bonus needs correction"
                                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                                        />
                                    </div>

                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                                        This action writes a completed `REFERRAL_BONUS` transaction and an audit log entry,
                                        then notifies the user about the correction.
                                    </div>

                                    <Button type="submit" disabled={saving} className="w-full">
                                        {saving ? (
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Gift className="h-4 w-4" />
                                        )}
                                        Save referral correction
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    )
}

export default ReferralManagement
