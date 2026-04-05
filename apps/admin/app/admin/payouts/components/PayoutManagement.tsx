'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { apiClient, PayoutRecord } from '@/lib/api'
import { useToast } from '@/components/ToastContext'
import {
    HandCoins,
    Loader2,
    RefreshCw,
    Search,
    Wallet,
} from 'lucide-react'

interface PaginationInfo {
    page: number
    limit: number
    total: number
    pages: number
}

const defaultPagination: PaginationInfo = {
    page: 1,
    limit: 15,
    total: 0,
    pages: 1,
}

const PayoutManagement = () => {
    const { addToast } = useToast()
    const [payouts, setPayouts] = useState<PayoutRecord[]>([])
    const [pagination, setPagination] = useState<PaginationInfo>(defaultPagination)
    const [statusFilter, setStatusFilter] = useState('all')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchPayouts = useCallback(async (page = pagination.page, showRefreshIndicator = false) => {
        if (showRefreshIndicator) {
            setIsRefreshing(true)
        } else {
            setIsLoading(true)
        }

        setError(null)

        try {
            const response = await apiClient.getPayouts({
                page,
                limit: pagination.limit,
                status: statusFilter !== 'all' ? statusFilter.toUpperCase() : undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            })

            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to load payouts')
            }

            setPayouts(response.data?.payouts || [])
            setPagination(response.data?.pagination || defaultPagination)
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : 'Failed to load payouts')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [endDate, pagination.limit, pagination.page, startDate, statusFilter])

    useEffect(() => {
        void fetchPayouts(1)
    }, [fetchPayouts])

    const filteredPayouts = payouts.filter((payout) => {
        const haystack = [
            payout.investment.user.email,
            payout.investment.user.username,
            payout.investment.miningOperation.name,
            payout.description,
            payout.status,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

        return haystack.includes(searchTerm.toLowerCase())
    })

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(Number(amount || 0))
    }

    const formatDate = (value: string) => {
        return new Date(value).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
    }

    const getStatusClasses = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
            COMPLETED: 'border-green-500/30 bg-green-500/10 text-green-300',
            FAILED: 'border-red-500/30 bg-red-500/10 text-red-300',
            CANCELLED: 'border-gray-500/30 bg-gray-500/10 text-gray-300',
        }

        return styles[status] || styles.COMPLETED
    }

    const handleProcessPayouts = async () => {
        const confirmed = window.confirm('Process daily payouts for all eligible active investments now?')
        if (!confirmed) {
            return
        }

        setIsProcessing(true)

        try {
            const response = await apiClient.processDailyPayouts()
            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to process payouts')
            }

            const processed = response.data?.processed || 0
            const totalAmount = formatCurrency(response.data?.totalAmount || 0)

            addToast(
                'success',
                'Payout run completed',
                processed > 0 ? `Processed ${processed} payouts totaling ${totalAmount}.` : response.message
            )
            await fetchPayouts(1, true)
        } catch (processError) {
            addToast(
                'error',
                'Payout run failed',
                processError instanceof Error ? processError.message : 'Unable to process payouts'
            )
        } finally {
            setIsProcessing(false)
        }
    }

    const pageAmount = filteredPayouts.reduce((sum, payout) => sum + Number(payout.amount || 0), 0)
    const todaysPayouts = filteredPayouts.filter((payout) => {
        const payoutDate = new Date(payout.date)
        const today = new Date()

        return (
            payoutDate.getFullYear() === today.getFullYear() &&
            payoutDate.getMonth() === today.getMonth() &&
            payoutDate.getDate() === today.getDate()
        )
    })

    const statCards = [
        {
            label: 'Visible Payouts',
            value: pagination.total,
            helper: 'Across current filters',
            icon: HandCoins,
        },
        {
            label: 'Page Amount',
            value: formatCurrency(pageAmount),
            helper: 'Visible in the table below',
            icon: Wallet,
        },
        {
            label: 'Today on Page',
            value: todaysPayouts.length,
            helper: 'Dated for today',
            icon: RefreshCw,
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Payout Management</h1>
                    <p className="text-gray-400">Review payout history and trigger the daily payout batch when needed.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => fetchPayouts(pagination.page, true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-navy-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-600"
                    >
                        {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Refresh
                    </button>
                    <button
                        onClick={handleProcessPayouts}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <HandCoins className="h-4 w-4" />}
                        Process Daily Payouts
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {statCards.map((card) => (
                    <div key={card.label} className="rounded-2xl border border-gold-500/20 bg-dark-800/50 p-5 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">{card.label}</p>
                                <p className="mt-2 text-3xl font-bold text-white">{card.value}</p>
                                <p className="mt-1 text-xs text-gray-500">{card.helper}</p>
                            </div>
                            <div className="rounded-xl bg-gold-500/10 p-3 text-gold-300">
                                <card.icon className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-3xl border border-gold-500/20 bg-dark-800/50 p-5 backdrop-blur-sm">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                    <div className="relative lg:col-span-2">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search by user or mining operation"
                            className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 py-3 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-gold-500/40"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(event) => {
                            setStatusFilter(event.target.value)
                            setPagination((current) => ({ ...current, page: 1 }))
                        }}
                        className="rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-sm text-white outline-none"
                    >
                        <option value="all">All statuses</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(event) => setStartDate(event.target.value)}
                            className="rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-sm text-white outline-none"
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(event) => setEndDate(event.target.value)}
                            className="rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-sm text-white outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-gold-500/20 bg-dark-800/50 backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gold-500/10">
                        <thead className="bg-dark-900/40">
                            <tr className="text-left text-xs uppercase tracking-[0.18em] text-gray-400">
                                <th className="px-5 py-4 font-medium">User</th>
                                <th className="px-5 py-4 font-medium">Operation</th>
                                <th className="px-5 py-4 font-medium">Amount</th>
                                <th className="px-5 py-4 font-medium">Status</th>
                                <th className="px-5 py-4 font-medium">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gold-500/10">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                                        Loading payout history...
                                    </td>
                                </tr>
                            ) : filteredPayouts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                                        No payouts matched the current filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredPayouts.map((payout) => (
                                    <tr key={payout.id}>
                                        <td className="px-5 py-4">
                                            <div className="space-y-1">
                                                <p className="font-medium text-white">{payout.investment.user.username || payout.investment.user.email}</p>
                                                <p className="text-sm text-gray-400">{payout.investment.user.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-300">
                                            {payout.investment.miningOperation.name}
                                        </td>
                                        <td className="px-5 py-4 font-medium text-white">{formatCurrency(payout.amount)}</td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(payout.status)}`}>
                                                {payout.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-300">{formatDate(payout.date)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-gold-500/10 px-5 py-4 text-sm text-gray-400 md:flex-row md:items-center md:justify-between">
                    <p>
                        Page {pagination.page} of {pagination.pages} with {pagination.total} payout{pagination.total === 1 ? '' : 's'} total
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchPayouts(Math.max(1, pagination.page - 1))}
                            disabled={pagination.page <= 1}
                            className="rounded-lg border border-gold-500/20 px-3 py-2 text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => fetchPayouts(Math.min(pagination.pages, pagination.page + 1))}
                            disabled={pagination.page >= pagination.pages}
                            className="rounded-lg border border-gold-500/20 px-3 py-2 text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PayoutManagement
