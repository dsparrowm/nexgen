'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiClient, PayoutRecord } from '@/lib/api'
import { useToast } from '@/components/ToastContext'
import {
    Badge,
    Button,
    Card,
    CardContent,
    DataTable,
    EmptyState,
    IconButton,
    Input,
    Pagination,
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
    WorkspaceToolbarActions,
    WorkspaceToolbarFilters,
    type BadgeVariant,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import {
    AlertTriangle,
    HandCoins,
    Loader2,
    RefreshCw,
    Wallet,
    X,
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
    const [showProcessModal, setShowProcessModal] = useState(false)
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

    const getStatusBadgeVariant = (status: string): BadgeVariant => {
        switch (status) {
            case 'COMPLETED':
                return 'success'
            case 'PENDING':
                return 'warning'
            case 'FAILED':
                return 'error'
            case 'CANCELLED':
                return 'neutral'
            default:
                return 'neutral'
        }
    }

    const handleProcessPayouts = async () => {
        setShowProcessModal(false)
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

    const handlePageChange = (newPage: number) => {
        void fetchPayouts(newPage)
    }

    if (isLoading && payouts.length === 0) {
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
                title="Payout Management"
                description="Review payout history and trigger the daily payout batch when needed."
                action={
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => fetchPayouts(pagination.page, true)}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                            Refresh
                        </Button>
                        <Button onClick={() => setShowProcessModal(true)} disabled={isProcessing}>
                            {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <HandCoins className="h-4 w-4" />
                            )}
                            Process daily payouts
                        </Button>
                    </div>
                }
            />

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => fetchPayouts(pagination.page)}>
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard
                    title="Visible Payouts"
                    value={String(pagination.total)}
                    description="Across current filters"
                    icon={HandCoins}
                />
                <StatCard
                    title="Page Amount"
                    value={formatCurrency(pageAmount)}
                    description="Visible in the table below"
                    icon={Wallet}
                />
                <StatCard
                    title="Today on Page"
                    value={String(todaysPayouts.length)}
                    description="Dated for today"
                    icon={RefreshCw}
                />
            </div>

            <WorkspaceToolbar>
                <WorkspaceToolbarFilters>
                    <SearchInput
                        placeholder="Search by user or mining operation"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        containerClassName="w-full lg:flex-1"
                    />
                    <Select
                        value={statusFilter}
                        onChange={(event) => {
                            setStatusFilter(event.target.value)
                            setPagination((current) => ({ ...current, page: 1 }))
                        }}
                        className="w-full sm:w-40"
                    >
                        <option value="all">All statuses</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                    </Select>
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                        className="w-full sm:w-40"
                    />
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        className="w-full sm:w-40"
                    />
                </WorkspaceToolbarFilters>

                <WorkspaceToolbarActions>
                    <IconButton onClick={() => fetchPayouts(pagination.page, true)} disabled={isRefreshing} title="Refresh">
                        <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                    </IconButton>
                </WorkspaceToolbarActions>
            </WorkspaceToolbar>

            <DataTable>
                {isRefreshing ? (
                    <div className="flex items-center justify-center py-16">
                        <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
                    </div>
                ) : filteredPayouts.length === 0 ? (
                    <EmptyState
                        icon={HandCoins}
                        title="No payouts found"
                        description="Try adjusting your search or filters."
                    />
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Operation</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPayouts.map((payout) => (
                                    <TableRow key={payout.id}>
                                        <TableCell>
                                            <p className="font-medium text-zinc-900">
                                                {payout.investment.user.username || payout.investment.user.email}
                                            </p>
                                            <p className="text-sm text-zinc-500">{payout.investment.user.email}</p>
                                        </TableCell>
                                        <TableCell className="text-zinc-700">
                                            {payout.investment.miningOperation.name}
                                        </TableCell>
                                        <TableCell className="font-medium text-zinc-900">
                                            {formatCurrency(payout.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(payout.status)}>
                                                {payout.status.toLowerCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-zinc-500">{formatDate(payout.date)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Pagination
                            page={pagination.page}
                            pages={pagination.pages}
                            total={pagination.total}
                            limit={pagination.limit}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </DataTable>

            {showProcessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white shadow-card-hover"
                    >
                        <div className="p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-zinc-900">Process daily payouts</h2>
                                <button
                                    onClick={() => setShowProcessModal(false)}
                                    className="text-zinc-400 hover:text-zinc-600"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <p className="text-sm text-zinc-600">
                                Process daily payouts for all eligible active investments now? This action cannot be
                                undone.
                            </p>
                            <div className="mt-6 flex gap-3">
                                <Button variant="secondary" className="flex-1" onClick={() => setShowProcessModal(false)}>
                                    Cancel
                                </Button>
                                <Button className="flex-1" onClick={handleProcessPayouts} disabled={isProcessing}>
                                    {isProcessing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <HandCoins className="h-4 w-4" />
                                    )}
                                    Confirm
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}

export default PayoutManagement
