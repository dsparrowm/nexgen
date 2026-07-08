'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api'
import { useToast } from '@/components/ToastContext'
import {
    Avatar,
    Badge,
    Button,
    Card,
    CardContent,
    DataTable,
    EmptyState,
    IconButton,
    Input,
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
    CreditCard,
    Plus,
    Minus,
    TrendingUp,
    TrendingDown,
    CheckCircle,
    Clock,
    AlertTriangle,
    Download,
    RefreshCw,
    Eye,
    MoreVertical,
    Loader2,
    X,
} from 'lucide-react'

interface CreditTransaction {
    id: string
    userId: string
    userName: string
    userEmail: string
    type: 'credit' | 'debit'
    amount: number
    previousBalance: number
    newBalance: number
    reason: string
    adminUser: string
    timestamp: string
    status: 'completed' | 'pending' | 'failed'
    transactionId: string
}

const CreditManagement = () => {
    const router = useRouter()
    const [transactions, setTransactions] = useState<CreditTransaction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [showAddCredit, setShowAddCredit] = useState(false)
    const [selectedUser, setSelectedUser] = useState('')
    const [creditAmount, setCreditAmount] = useState('')
    const [creditReason, setCreditReason] = useState('')
    const [operationType, setOperationType] = useState('credit')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { addToast } = useToast()

    const fetchCreditHistory = async (userId = null, showRefreshIndicator = false) => {
        if (showRefreshIndicator) {
            setIsRefreshing(true)
        } else {
            setIsLoading(true)
        }
        setError(null)

        try {
            const params: { page?: number; limit?: number; userId?: string; type?: string } = {}
            if (userId) {
                params.userId = userId
            }

            const response = await apiClient.getCreditHistory(params)

            if (response.success) {
                setTransactions(response.data?.transactions || [])
            } else {
                setError(response.error?.message || 'Failed to load credit history')
            }
        } catch (err) {
            console.error('Error fetching credit history:', err)
            setError('An error occurred while loading credit history')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        fetchCreditHistory()
    }, [])

    const filteredTransactions = transactions.filter((transaction) => {
        const matchesSearch =
            transaction.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = typeFilter === 'all' || transaction.type === typeFilter
        const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter

        return matchesSearch && matchesType && matchesStatus
    })

    const stats = {
        totalCredits: transactions.filter((t) => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0),
        totalDebits: transactions.filter((t) => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0),
        pendingTransactions: transactions.filter((t) => t.status === 'pending').length,
        completedTransactions: transactions.filter((t) => t.status === 'completed').length,
    }

    const getStatusBadgeVariant = (status: string): BadgeVariant => {
        switch (status) {
            case 'completed':
                return 'success'
            case 'pending':
                return 'warning'
            case 'failed':
                return 'error'
            default:
                return 'neutral'
        }
    }

    const resetAddCreditForm = () => {
        setSelectedUser('')
        setCreditAmount('')
        setCreditReason('')
        setOperationType('credit')
    }

    const handleAddCredit = async () => {
        if (!selectedUser || !creditAmount || !creditReason) {
            addToast('error', 'Validation Error', 'Please fill in all required fields')
            return
        }

        setIsSubmitting(true)

        try {
            const amount = parseFloat(creditAmount)
            if (isNaN(amount) || amount <= 0) {
                addToast('error', 'Invalid Amount', 'Please enter a valid amount')
                return
            }

            let response
            if (operationType === 'credit') {
                response = await apiClient.addCredits(selectedUser, {
                    amount,
                    reason: creditReason,
                })
            } else {
                response = await apiClient.deductCredits(selectedUser, amount, creditReason)
            }

            if (response.success) {
                addToast(
                    'success',
                    'Operation Successful',
                    `Credits ${operationType === 'credit' ? 'added' : 'deducted'} successfully`
                )
                setShowAddCredit(false)
                resetAddCreditForm()
                fetchCreditHistory()
            } else {
                addToast(
                    'error',
                    'Operation Failed',
                    response.error?.message || `Failed to ${operationType} credits`
                )
            }
        } catch (addError) {
            console.error('Error managing credits:', addError)
            addToast('error', 'Error', 'An error occurred while processing the request')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading && transactions.length === 0) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-16 w-full" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
                title="Credit Management"
                description="Manage user account credits and debits."
                action={
                    <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => setShowAddCredit(true)}>
                            <Plus className="h-4 w-4" />
                            Quick adjust
                        </Button>
                        <Button onClick={() => router.push('/admin/treasury/credits/add')}>
                            <CreditCard className="h-4 w-4" />
                            Add credits
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
                        <Button variant="ghost" size="sm" onClick={() => fetchCreditHistory()}>
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Total Credits"
                    value={`$${stats.totalCredits.toLocaleString()}`}
                    icon={TrendingUp}
                    iconClassName="bg-green-50"
                />
                <StatCard
                    title="Total Debits"
                    value={`$${stats.totalDebits.toLocaleString()}`}
                    icon={TrendingDown}
                    iconClassName="bg-red-50"
                />
                <StatCard title="Pending" value={String(stats.pendingTransactions)} icon={Clock} />
                <StatCard title="Completed" value={String(stats.completedTransactions)} icon={CheckCircle} />
            </div>

            <WorkspaceToolbar>
                <WorkspaceToolbarFilters>
                    <SearchInput
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        containerClassName="w-full sm:w-64"
                    />
                    <Select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full sm:w-36"
                    >
                        <option value="all">All types</option>
                        <option value="credit">Credits</option>
                        <option value="debit">Debits</option>
                    </Select>
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full sm:w-36"
                    >
                        <option value="all">All status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </Select>
                </WorkspaceToolbarFilters>

                <WorkspaceToolbarActions>
                    <IconButton onClick={() => fetchCreditHistory(null, true)} disabled={isRefreshing} title="Refresh">
                        <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                    </IconButton>
                    <IconButton title="Export">
                        <Download className="h-4 w-4" />
                    </IconButton>
                </WorkspaceToolbarActions>
            </WorkspaceToolbar>

            <DataTable>
                {isRefreshing ? (
                    <div className="flex items-center justify-center py-16">
                        <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <EmptyState
                        icon={CreditCard}
                        title="No transactions found"
                        description="Try adjusting your search or filters."
                        actionLabel="Add credits"
                        onAction={() => router.push('/admin/treasury/credits/add')}
                    />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Transaction</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Balance change</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                    <TableCell>
                                        <p className="font-medium text-zinc-900">{transaction.transactionId}</p>
                                        <p className="text-sm text-zinc-500">{transaction.reason}</p>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar name={transaction.userName} size="sm" />
                                            <div>
                                                <p className="font-medium text-zinc-900">{transaction.userName}</p>
                                                <p className="text-sm text-zinc-500">{transaction.userEmail}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 capitalize">
                                            {transaction.type === 'credit' ? (
                                                <Plus className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <Minus className="h-4 w-4 text-red-600" />
                                            )}
                                            <span
                                                className={
                                                    transaction.type === 'credit' ? 'text-green-700' : 'text-red-700'
                                                }
                                            >
                                                {transaction.type}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell
                                        className={
                                            transaction.type === 'credit'
                                                ? 'font-medium text-green-700'
                                                : 'font-medium text-red-700'
                                        }
                                    >
                                        {transaction.type === 'credit' ? '+' : '-'}$
                                        {transaction.amount.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-sm text-zinc-500">
                                        ${transaction.previousBalance.toLocaleString()} → $
                                        {transaction.newBalance.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(transaction.status)}>
                                            {transaction.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-sm text-zinc-900">{transaction.timestamp.split(' ')[0]}</p>
                                        <p className="text-xs text-zinc-500">{transaction.timestamp.split(' ')[1]}</p>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <IconButton title="View">
                                                <Eye className="h-4 w-4" />
                                            </IconButton>
                                            <IconButton title="More">
                                                <MoreVertical className="h-4 w-4" />
                                            </IconButton>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </DataTable>

            {showAddCredit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-card-hover"
                    >
                        <div className="p-6">
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-zinc-900">Quick credit/debit</h2>
                                <button
                                    onClick={() => {
                                        setShowAddCredit(false)
                                        resetAddCreditForm()
                                    }}
                                    className="text-zinc-400 hover:text-zinc-600"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                                        Operation type
                                    </label>
                                    <Select
                                        value={operationType}
                                        onChange={(e) => setOperationType(e.target.value)}
                                    >
                                        <option value="credit">Credit (add money)</option>
                                        <option value="debit">Debit (deduct money)</option>
                                    </Select>
                                </div>

                                <Input
                                    label="User name"
                                    value={selectedUser}
                                    onChange={(e) => setSelectedUser(e.target.value)}
                                    placeholder="Enter user name"
                                />

                                <Input
                                    label="Amount ($)"
                                    type="number"
                                    value={creditAmount}
                                    onChange={(e) => setCreditAmount(e.target.value)}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                />

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-zinc-700">Reason</label>
                                    <textarea
                                        value={creditReason}
                                        onChange={(e) => setCreditReason(e.target.value)}
                                        placeholder="Enter reason for this transaction"
                                        rows={3}
                                        className="flex w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => {
                                            setShowAddCredit(false)
                                            resetAddCreditForm()
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button className="flex-1" onClick={handleAddCredit} disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : operationType === 'credit' ? (
                                            'Add credit'
                                        ) : (
                                            'Add debit'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}

export default CreditManagement
