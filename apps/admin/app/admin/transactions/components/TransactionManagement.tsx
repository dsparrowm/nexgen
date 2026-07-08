'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { apiClient, TransactionRecord } from '@/lib/api'
import { useToast } from '@/components/ToastContext'
import TransactionFormModal from './TransactionFormModal'
import {
    Badge,
    Button,
    DataTable,
    EmptyState,
    IconButton,
    Pagination,
    SearchInput,
    Select,
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
    type BadgeVariant,
} from '@/components/ui'
import {
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Eye,
    DollarSign,
    CreditCard,
    ArrowUpCircle,
    ArrowDownCircle,
    RefreshCw,
    Loader2,
    Plus,
    Pencil
} from 'lucide-react'

const TransactionManagement = () => {
    const [transactions, setTransactions] = useState<TransactionRecord[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalTransactions, setTotalTransactions] = useState(0)
    const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [processingTransaction, setProcessingTransaction] = useState<string | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingTransaction, setEditingTransaction] = useState<TransactionRecord | null>(null)
    const { addToast } = useToast()

    const normalizeTransaction = (transaction: TransactionRecord): TransactionRecord => ({
        ...transaction,
        amount: Number(transaction.amount),
        fee: Number(transaction.fee),
        netAmount: Number(transaction.netAmount),
    })

    // Fetch transactions
    const fetchTransactions = async (page = 1) => {
        setIsLoading(true)
        setError(null)

        try {
            const params: any = {
                page,
                limit: 20
            }

            if (statusFilter !== 'all') {
                params.status = statusFilter.toUpperCase()
            }

            if (typeFilter !== 'all') {
                params.type = typeFilter.toUpperCase()
            }

            if (searchTerm) {
                params.search = searchTerm
            }

            const response = await apiClient.getTransactions(params)

            if (response.success) {
                const normalized = (response.data?.transactions || []).map(normalizeTransaction)
                setTransactions(normalized)
                setTotalPages(response.data?.pagination?.pages || 1)
                setTotalTransactions(response.data?.pagination?.total || 0)
                setCurrentPage(page)
            } else {
                setError(response.error?.message || 'Failed to load transactions')
            }
        } catch (err) {
            console.error('Error fetching transactions:', err)
            setError('An error occurred while loading transactions')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchTransactions()
    }, [statusFilter, typeFilter])

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm !== '') {
                fetchTransactions(1)
            }
        }, 500)

        return () => clearTimeout(timeoutId)
    }, [searchTerm])

    const openCreateForm = () => {
        setEditingTransaction(null)
        setIsFormOpen(true)
    }

    const openEditForm = (transaction: TransactionRecord) => {
        setEditingTransaction(transaction)
        setIsFormOpen(true)
        setShowDetailsModal(false)
    }

    const handleFormSuccess = () => {
        addToast(
            'success',
            'Success',
            editingTransaction ? 'Transaction updated successfully' : 'Transaction created successfully'
        )
        fetchTransactions(currentPage)
    }

    const handleApproveTransaction = async (transactionId: string) => {
        setProcessingTransaction(transactionId)
        try {
            const response = await apiClient.approveTransaction(transactionId)

            if (response.success) {
                addToast('success', 'Success', 'Transaction approved successfully')
                fetchTransactions(currentPage)
            } else {
                addToast('error', 'Error', response.error?.message || 'Failed to approve transaction')
            }
        } catch (err) {
            console.error('Error approving transaction:', err)
            addToast('error', 'Error', 'An error occurred while approving the transaction')
        } finally {
            setProcessingTransaction(null)
        }
    }

    const handleRejectTransaction = async (transactionId: string, reason: string) => {
        setProcessingTransaction(transactionId)
        try {
            const response = await apiClient.rejectTransaction(transactionId, reason)

            if (response.success) {
                addToast('success', 'Success', 'Transaction rejected successfully')
                fetchTransactions(currentPage)
            } else {
                addToast('error', 'Error', response.error?.message || 'Failed to reject transaction')
            }
        } catch (err) {
            console.error('Error rejecting transaction:', err)
            addToast('error', 'Error', 'An error occurred while rejecting the transaction')
        } finally {
            setProcessingTransaction(null)
        }
    }

    const getStatusBadgeVariant = (status: string): BadgeVariant => {
        switch (status) {
            case 'COMPLETED':
                return 'success'
            case 'FAILED':
            case 'CANCELLED':
                return 'error'
            case 'PENDING':
            case 'PROCESSING':
                return 'warning'
            default:
                return 'neutral'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <CheckCircle className="w-4 h-4 text-green-500" />
            case 'FAILED':
                return <XCircle className="w-4 h-4 text-red-500" />
            case 'PENDING':
                return <Clock className="w-4 h-4 text-yellow-500" />
            default:
                return <AlertTriangle className="w-4 h-4 text-gray-500" />
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'DEPOSIT':
                return <ArrowDownCircle className="w-4 h-4 text-green-500" />
            case 'WITHDRAWAL':
                return <ArrowUpCircle className="w-4 h-4 text-red-500" />
            case 'BONUS':
                return <DollarSign className="w-4 h-4 text-blue-500" />
            case 'FEE':
                return <CreditCard className="w-4 h-4 text-orange-500" />
            default:
                return <DollarSign className="w-4 h-4 text-gray-500" />
        }
    }

    const formatAmount = (amount: number, type: string) => {
        const isNegative = type === 'WITHDRAWAL' || type === 'FEE' || type === 'INVESTMENT'
        const displayAmount = isNegative ? -Math.abs(amount) : amount
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(displayAmount)
    }

    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = transaction.user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.description?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter.toUpperCase()
        const matchesType = typeFilter === 'all' || transaction.type === typeFilter.toUpperCase()

        return matchesSearch && matchesStatus && matchesType
    })

    return (
        <div className="space-y-6">
            <WorkspaceHeader
                title="Transaction Management"
                description="Manage ledger entries, deposits, withdrawals, and approvals."
                action={
                    <div className="flex gap-2">
                        <Button onClick={openCreateForm}>
                            <Plus className="h-4 w-4" />
                            Add transaction
                        </Button>
                        <Button variant="secondary" onClick={() => fetchTransactions(currentPage)}>
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <StatCard title="Total Transactions" value={String(totalTransactions)} icon={DollarSign} />
                <StatCard
                    title="Pending"
                    value={String(transactions.filter((t) => t.status === 'PENDING').length)}
                    icon={Clock}
                />
                <StatCard
                    title="Completed"
                    value={String(transactions.filter((t) => t.status === 'COMPLETED').length)}
                    icon={CheckCircle}
                />
                <StatCard
                    title="Failed/Rejected"
                    value={String(transactions.filter((t) => ['FAILED', 'CANCELLED'].includes(t.status)).length)}
                    icon={XCircle}
                />
            </div>

            <WorkspaceToolbar>
                <WorkspaceToolbarFilters>
                    <SearchInput
                        placeholder="Search by user, reference, or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        containerClassName="w-full lg:flex-1"
                    />
                    <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-40">
                        <option value="all">All status</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                    </Select>
                    <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full sm:w-40">
                        <option value="all">All types</option>
                        <option value="deposit">Deposit</option>
                        <option value="withdrawal">Withdrawal</option>
                        <option value="investment">Investment</option>
                        <option value="payout">Payout</option>
                        <option value="fee">Fee</option>
                        <option value="refund">Refund</option>
                        <option value="bonus">Bonus</option>
                        <option value="referral_bonus">Referral Bonus</option>
                    </Select>
                </WorkspaceToolbarFilters>
            </WorkspaceToolbar>

            <DataTable>
                {isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-zinc-500">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading transactions...
                    </div>
                ) : error ? (
                    <EmptyState icon={AlertTriangle} title="Failed to load transactions" description={error} />
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.map((transaction) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell>
                                            <p className="font-medium text-zinc-900">
                                                {transaction.user.firstName} {transaction.user.lastName}
                                            </p>
                                            <p className="text-sm text-zinc-500">{transaction.user.email}</p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 capitalize">
                                                {getTypeIcon(transaction.type)}
                                                {transaction.type.toLowerCase()}
                                            </div>
                                        </TableCell>
                                        <TableCell
                                            className={
                                                transaction.type === 'WITHDRAWAL' || transaction.type === 'FEE'
                                                    ? 'font-medium text-red-600'
                                                    : 'font-medium text-green-600'
                                            }
                                        >
                                            {formatAmount(transaction.amount, transaction.type)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(transaction.status)}>
                                                {transaction.status.toLowerCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-zinc-500">
                                            {new Date(transaction.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-1">
                                                <IconButton
                                                    onClick={() => {
                                                        setSelectedTransaction(transaction)
                                                        setShowDetailsModal(true)
                                                    }}
                                                    title="View details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </IconButton>
                                                <IconButton onClick={() => openEditForm(transaction)} title="Edit">
                                                    <Pencil className="h-4 w-4" />
                                                </IconButton>
                                                {transaction.status === 'PENDING' && (
                                                    <>
                                                        <IconButton
                                                            onClick={() => handleApproveTransaction(transaction.id)}
                                                            disabled={processingTransaction === transaction.id}
                                                            title="Approve"
                                                            className="hover:bg-green-50 hover:text-green-700"
                                                        >
                                                            {processingTransaction === transaction.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <CheckCircle className="h-4 w-4" />
                                                            )}
                                                        </IconButton>
                                                        <IconButton
                                                            onClick={() =>
                                                                handleRejectTransaction(transaction.id, 'Rejected by admin')
                                                            }
                                                            disabled={processingTransaction === transaction.id}
                                                            title="Reject"
                                                            className="hover:bg-red-50 hover:text-red-700"
                                                        >
                                                            {processingTransaction === transaction.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <XCircle className="h-4 w-4" />
                                                            )}
                                                        </IconButton>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Pagination
                            page={currentPage}
                            pages={totalPages}
                            total={totalTransactions}
                            limit={20}
                            onPageChange={fetchTransactions}
                        />
                    </>
                )}
            </DataTable>

            {/* Transaction Details Modal */}
            {showDetailsModal && selectedTransaction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-card-hover"
                    >
                        <div className="p-6">
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-zinc-900">Transaction details</h2>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-zinc-400 hover:text-zinc-600"
                                >
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-zinc-500">Transaction ID</label>
                                        <p className="font-mono text-zinc-900">{selectedTransaction.id}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-zinc-500">Reference</label>
                                        <p className="text-zinc-900">{selectedTransaction.reference || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-zinc-500">User</label>
                                        <p className="text-zinc-900">
                                            {selectedTransaction.user.firstName} {selectedTransaction.user.lastName}
                                        </p>
                                        <p className="text-sm text-zinc-500">{selectedTransaction.user.email}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-zinc-500">Type</label>
                                        <p className="capitalize text-zinc-900">{selectedTransaction.type.toLowerCase()}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-zinc-500">Amount</label>
                                        <p
                                            className={`text-lg font-semibold ${selectedTransaction.type === 'WITHDRAWAL' || selectedTransaction.type === 'FEE'
                                                ? 'text-red-600'
                                                : 'text-green-600'
                                                }`}
                                        >
                                            {formatAmount(selectedTransaction.amount, selectedTransaction.type)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-zinc-500">Status</label>
                                        <div className="mt-1">
                                            <Badge variant={getStatusBadgeVariant(selectedTransaction.status)}>
                                                {selectedTransaction.status.toLowerCase()}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {selectedTransaction.fee > 0 && (
                                    <div>
                                        <label className="text-sm text-zinc-500">Fee</label>
                                        <p className="text-orange-600">-${selectedTransaction.fee.toFixed(2)}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm text-zinc-500">Description</label>
                                    <p className="text-zinc-900">{selectedTransaction.description || 'N/A'}</p>
                                </div>

                                {selectedTransaction.type === 'WITHDRAWAL' &&
                                    typeof selectedTransaction.metadata?.withdrawalAddress === 'string' && (
                                    <div>
                                        <label className="text-sm text-zinc-500">Withdrawal Address</label>
                                        <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 font-mono text-sm text-zinc-900">
                                            {selectedTransaction.metadata.withdrawalAddress}
                                        </p>
                                    </div>
                                )}

                                {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                                    <div>
                                        <label className="text-sm text-zinc-500">Additional Details</label>
                                        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
                                            {Object.entries(selectedTransaction.metadata).map(([key, value]) => {
                                                if (key === 'withdrawalAddress' || key === 'currency') return null
                                                return (
                                                    <div key={key} className="flex justify-between py-1">
                                                        <span className="text-zinc-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                                        <span className="ml-2 text-zinc-900">{String(value)}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {selectedTransaction.failureReason && (
                                    <div>
                                        <label className="text-sm text-zinc-500">Failure Reason</label>
                                        <p className="text-red-600">{selectedTransaction.failureReason}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-zinc-500">Created</label>
                                        <p className="text-zinc-700">
                                            {new Date(selectedTransaction.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    {selectedTransaction.processedAt && (
                                        <div>
                                            <label className="text-sm text-zinc-500">Processed</label>
                                            <p className="text-zinc-700">
                                                {new Date(selectedTransaction.processedAt).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3 border-t border-zinc-200 pt-6">
                                <Button className="flex-1" onClick={() => openEditForm(selectedTransaction)}>
                                    Edit transaction
                                </Button>
                            </div>

                            {selectedTransaction.status === 'PENDING' && (
                                <div className="mt-3 flex gap-3">
                                    <Button
                                        className="flex-1"
                                        onClick={() => {
                                            handleApproveTransaction(selectedTransaction.id)
                                            setShowDetailsModal(false)
                                        }}
                                        disabled={processingTransaction === selectedTransaction.id}
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        variant="danger"
                                        className="flex-1"
                                        onClick={() => {
                                            handleRejectTransaction(selectedTransaction.id, 'Rejected by admin')
                                            setShowDetailsModal(false)
                                        }}
                                        disabled={processingTransaction === selectedTransaction.id}
                                    >
                                        Reject
                                    </Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}

            <TransactionFormModal
                isOpen={isFormOpen}
                transaction={editingTransaction}
                onClose={() => {
                    setIsFormOpen(false)
                    setEditingTransaction(null)
                }}
                onSuccess={handleFormSuccess}
            />
        </div>
    )
}

export default TransactionManagement