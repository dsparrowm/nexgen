'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api'
import { useToast } from '@/components/ToastContext'
import {
    Search,
    Filter,
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
    MoreVertical,
    Loader2
} from 'lucide-react'

// Transaction interface
interface Transaction {
    id: string
    userId: string
    user: {
        id: string
        email: string
        username: string
        firstName: string
        lastName: string
    }
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'BONUS' | 'FEE' | 'INVESTMENT' | 'PAYOUT'
    amount: number
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
    description: string
    reference: string
    paymentMethod: string
    paymentId: string | null
    fee: number
    netAmount: number
    processedAt: string | null
    failureReason: string | null
    metadata: any
    createdAt: string
    updatedAt: string
}

const TransactionManagement = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalTransactions, setTotalTransactions] = useState(0)
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [processingTransaction, setProcessingTransaction] = useState<string | null>(null)
    const { addToast } = useToast()

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
                setTransactions(response.data?.transactions || [])
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

    const getStatusBadge = (status: string) => {
        const badges = {
            PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
            FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
            CANCELLED: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        }
        return badges[status as keyof typeof badges] || badges.PENDING
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
        const isNegative = type === 'WITHDRAWAL' || type === 'FEE'
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Transaction Management</h1>
                    <p className="text-gray-400">Review and manage deposit/withdrawal requests</p>
                </div>
                <button
                    onClick={() => fetchTransactions(currentPage)}
                    className="flex items-center gap-2 px-4 py-2 bg-navy-700 hover:bg-navy-600 text-white rounded-lg transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-dark-800/50 backdrop-blur-sm border border-gold-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <DollarSign className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Total Transactions</p>
                            <p className="text-white font-semibold">{totalTransactions}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-dark-800/50 backdrop-blur-sm border border-gold-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/20 rounded-lg">
                            <Clock className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Pending</p>
                            <p className="text-white font-semibold">
                                {transactions.filter(t => t.status === 'PENDING').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-dark-800/50 backdrop-blur-sm border border-gold-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Completed</p>
                            <p className="text-white font-semibold">
                                {transactions.filter(t => t.status === 'COMPLETED').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-dark-800/50 backdrop-blur-sm border border-gold-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                            <XCircle className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Failed/Rejected</p>
                            <p className="text-white font-semibold">
                                {transactions.filter(t => ['FAILED', 'CANCELLED'].includes(t.status)).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-dark-800/50 backdrop-blur-sm border border-gold-500/20 rounded-lg p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by user email, username, reference, or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-dark-900/50 border border-gold-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-400"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 bg-dark-900/50 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-400"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-3 py-2 bg-dark-900/50 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-400"
                        >
                            <option value="all">All Types</option>
                            <option value="deposit">Deposit</option>
                            <option value="withdrawal">Withdrawal</option>
                            <option value="bonus">Bonus</option>
                            <option value="fee">Fee</option>
                            <option value="investment">Investment</option>
                            <option value="payout">Payout</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-dark-800/50 backdrop-blur-sm border border-gold-500/20 rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
                        <span className="ml-2 text-gray-400">Loading transactions...</span>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center py-12">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                        <span className="ml-2 text-red-400">{error}</span>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-dark-900/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gold-500/10">
                                    {filteredTransactions.map((transaction) => (
                                        <tr key={transaction.id} className="hover:bg-dark-900/30">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-white">
                                                        {transaction.user.firstName} {transaction.user.lastName}
                                                    </div>
                                                    <div className="text-sm text-gray-400">
                                                        {transaction.user.email}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {getTypeIcon(transaction.type)}
                                                    <span className="text-sm text-white capitalize">
                                                        {transaction.type.toLowerCase()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-sm font-medium ${transaction.type === 'WITHDRAWAL' || transaction.type === 'FEE'
                                                    ? 'text-red-400'
                                                    : 'text-green-400'
                                                    }`}>
                                                    {formatAmount(transaction.amount, transaction.type)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(transaction.status)}`}>
                                                    {getStatusIcon(transaction.status)}
                                                    {transaction.status.toLowerCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {new Date(transaction.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTransaction(transaction)
                                                            setShowDetailsModal(true)
                                                        }}
                                                        className="text-gray-400 hover:text-white transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>

                                                    {transaction.status === 'PENDING' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApproveTransaction(transaction.id)}
                                                                disabled={processingTransaction === transaction.id}
                                                                className="text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                                                                title="Approve"
                                                            >
                                                                {processingTransaction === transaction.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <CheckCircle className="w-4 h-4" />
                                                                )}
                                                            </button>

                                                            <button
                                                                onClick={() => handleRejectTransaction(transaction.id, 'Rejected by admin')}
                                                                disabled={processingTransaction === transaction.id}
                                                                className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                                                                title="Reject"
                                                            >
                                                                {processingTransaction === transaction.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <XCircle className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 bg-dark-900/50 border-t border-gold-500/10">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-400">
                                        Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalTransactions)} of {totalTransactions} transactions
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => fetchTransactions(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 text-sm bg-navy-700 hover:bg-navy-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded transition-colors"
                                        >
                                            Previous
                                        </button>
                                        <span className="text-sm text-gray-400">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => fetchTransactions(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1 text-sm bg-navy-700 hover:bg-navy-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Transaction Details Modal */}
            {showDetailsModal && selectedTransaction && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-dark-800 border border-gold-500/20 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Transaction Details</h2>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-400">Transaction ID</label>
                                        <p className="text-white font-mono">{selectedTransaction.id}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400">Reference</label>
                                        <p className="text-white">{selectedTransaction.reference || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-400">User</label>
                                        <p className="text-white">
                                            {selectedTransaction.user.firstName} {selectedTransaction.user.lastName}
                                        </p>
                                        <p className="text-gray-400 text-sm">{selectedTransaction.user.email}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400">Type</label>
                                        <p className="text-white capitalize">{selectedTransaction.type.toLowerCase()}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-400">Amount</label>
                                        <p className={`text-lg font-semibold ${selectedTransaction.type === 'WITHDRAWAL' || selectedTransaction.type === 'FEE'
                                            ? 'text-red-400'
                                            : 'text-green-400'
                                            }`}>
                                            {formatAmount(selectedTransaction.amount, selectedTransaction.type)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400">Status</label>
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(selectedTransaction.status)}`}>
                                            {getStatusIcon(selectedTransaction.status)}
                                            {selectedTransaction.status.toLowerCase()}
                                        </span>
                                    </div>
                                </div>

                                {selectedTransaction.fee > 0 && (
                                    <div>
                                        <label className="text-sm text-gray-400">Fee</label>
                                        <p className="text-orange-400">-${selectedTransaction.fee.toFixed(2)}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm text-gray-400">Description</label>
                                    <p className="text-white">{selectedTransaction.description || 'N/A'}</p>
                                </div>

                                {selectedTransaction.type === 'WITHDRAWAL' && selectedTransaction.metadata?.withdrawalAddress && (
                                    <div>
                                        <label className="text-sm text-gray-400">Withdrawal Address</label>
                                        <p className="text-white font-mono bg-dark-900/50 p-2 rounded border">
                                            {selectedTransaction.metadata.withdrawalAddress}
                                        </p>
                                        {selectedTransaction.metadata.currency && (
                                            <p className="text-gray-400 text-xs mt-1">
                                                Currency: {selectedTransaction.metadata.currency}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                                    <div>
                                        <label className="text-sm text-gray-400">Additional Details</label>
                                        <div className="bg-dark-900/50 p-3 rounded border text-sm">
                                            {Object.entries(selectedTransaction.metadata).map(([key, value]) => {
                                                // Skip fields we've already displayed above
                                                if (key === 'withdrawalAddress' || key === 'currency') return null;
                                                return (
                                                    <div key={key} className="flex justify-between py-1">
                                                        <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                                        <span className="text-white ml-2">{String(value)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {selectedTransaction.failureReason && (
                                    <div>
                                        <label className="text-sm text-gray-400">Failure Reason</label>
                                        <p className="text-red-400">{selectedTransaction.failureReason}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-400">Created</label>
                                        <p className="text-gray-300">
                                            {new Date(selectedTransaction.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    {selectedTransaction.processedAt && (
                                        <div>
                                            <label className="text-sm text-gray-400">Processed</label>
                                            <p className="text-gray-300">
                                                {new Date(selectedTransaction.processedAt).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedTransaction.status === 'PENDING' && (
                                <div className="flex gap-3 mt-6 pt-6 border-t border-gold-500/20">
                                    <button
                                        onClick={() => {
                                            handleApproveTransaction(selectedTransaction.id)
                                            setShowDetailsModal(false)
                                        }}
                                        disabled={processingTransaction === selectedTransaction.id}
                                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
                                    >
                                        {processingTransaction === selectedTransaction.id ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Processing...
                                            </span>
                                        ) : (
                                            'Approve Transaction'
                                        )}
                                    </button>

                                    <button
                                        onClick={() => {
                                            handleRejectTransaction(selectedTransaction.id, 'Rejected by admin')
                                            setShowDetailsModal(false)
                                        }}
                                        disabled={processingTransaction === selectedTransaction.id}
                                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
                                    >
                                        {processingTransaction === selectedTransaction.id ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Processing...
                                            </span>
                                        ) : (
                                            'Reject Transaction'
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}

export default TransactionManagement