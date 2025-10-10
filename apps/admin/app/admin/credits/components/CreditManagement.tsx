'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api'
import { useToast } from '@/components/ToastContext'
import {
    CreditCard,
    Plus,
    Minus,
    Search,
    Filter,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Calendar,
    User,
    CheckCircle,
    Clock,
    AlertTriangle,
    Download,
    RefreshCw,
    Eye,
    MoreVertical,
    Loader2
} from 'lucide-react'

// Credit transaction interface
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
    const [transactions, setTransactions] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [showAddCredit, setShowAddCredit] = useState(false)
    const [selectedUser, setSelectedUser] = useState('')
    const [creditAmount, setCreditAmount] = useState('')
    const [creditReason, setCreditReason] = useState('')
    const [operationType, setOperationType] = useState('credit')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { showToast } = useToast()

    // Fetch credit transactions
    const fetchCreditHistory = async (userId = null) => {
        setIsLoading(true)
        setError(null)

        try {
            let params = {}
            if (userId) {
                params.userId = userId
            }

            const response = await apiClient.getCreditHistory(params)

            if (response.success) {
                setTransactions(response.data || [])
            } else {
                setError(response.error?.message || 'Failed to load credit history')
            }
        } catch (err) {
            console.error('Error fetching credit history:', err)
            setError('An error occurred while loading credit history')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchCreditHistory()
    }, [])

    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = transaction.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = typeFilter === 'all' || transaction.type === typeFilter
        const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter

        return matchesSearch && matchesType && matchesStatus
    })

    const stats = {
        totalCredits: transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0),
        totalDebits: transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0),
        pendingTransactions: transactions.filter(t => t.status === 'pending').length,
        completedTransactions: transactions.filter(t => t.status === 'completed').length
    }

    const getStatusBadge = (status: string) => {
        const badges = {
            completed: 'bg-green-500/20 text-green-400 border-green-500/30',
            pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            failed: 'bg-red-500/20 text-red-400 border-red-500/30'
        }
        return badges[status as keyof typeof badges] || badges.pending
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-500" />
            case 'pending':
                return <Clock className="w-4 h-4 text-yellow-500" />
            default:
                return <AlertTriangle className="w-4 h-4 text-red-500" />
        }
    }

    const handleAddCredit = async () => {
        if (!selectedUser || !creditAmount || !creditReason) {
            showToast('Please fill in all required fields', 'error')
            return
        }

        setIsSubmitting(true)

        try {
            const amount = parseFloat(creditAmount)
            if (isNaN(amount) || amount <= 0) {
                showToast('Please enter a valid amount', 'error')
                return
            }

            let response
            if (operationType === 'credit') {
                response = await apiClient.addCredits(selectedUser, {
                    amount,
                    reason: creditReason
                })
            } else {
                response = await apiClient.deductCredits(selectedUser, amount, creditReason)
            }

            if (response.success) {
                showToast(`Credits ${operationType === 'credit' ? 'added' : 'deducted'} successfully`, 'success')
                setShowAddCredit(false)
                setSelectedUser('')
                setCreditAmount('')
                setCreditReason('')
                fetchCreditHistory() // Refresh the list
            } else {
                showToast(response.error?.message || `Failed to ${operationType} credits`, 'error')
            }
        } catch (error) {
            console.error('Error managing credits:', error)
            showToast('An error occurred while processing the request', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-4" />
                        <p className="text-gray-400">Loading credit transactions...</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                    <div className="flex items-center">
                        <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
                        <div>
                            <h3 className="text-red-400 font-semibold">Error Loading Credit Data</h3>
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => fetchCreditHistory()}
                        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Main Content */}
            {!isLoading && !error && (
                {/* Header */ }
                < motion.div
                initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-2xl p-6 border border-green-500/20"
            >
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Credit Management</h2>
                    <p className="text-gray-300">Manage user account credits and debits</p>
                </div>
                <button
                    onClick={() => setShowAddCredit(true)}
                    className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Credit/Debit</span>
                </button>
            </div>
        </motion.div>

            {/* Stats Cards */ }
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
    >
        <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
            <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-white">${stats.totalCredits.toLocaleString()}</p>
                    <p className="text-gray-400 text-sm">Total Credits</p>
                </div>
            </div>
        </div>
        <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
            <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-red-500" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-white">${stats.totalDebits.toLocaleString()}</p>
                    <p className="text-gray-400 text-sm">Total Debits</p>
                </div>
            </div>
        </div>
        <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
            <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-white">{stats.pendingTransactions}</p>
                    <p className="text-gray-400 text-sm">Pending</p>
                </div>
            </div>
        </div>
        <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
            <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-white">{stats.completedTransactions}</p>
                    <p className="text-gray-400 text-sm">Completed</p>
                </div>
            </div>
        </div>
    </motion.div>

    {/* Add Credit Modal */ }
    {
        showAddCredit && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-dark-800 rounded-2xl p-6 w-full max-w-md border border-gold-500/20"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">Add Credit/Debit</h3>
                        <button
                            onClick={() => setShowAddCredit(false)}
                            className="text-gray-400 hover:text-white"
                        >
                            ×
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Operation Type</label>
                            <select
                                value={operationType}
                                onChange={(e) => setOperationType(e.target.value)}
                                className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="credit">Credit (Add Money)</option>
                                <option value="debit">Debit (Deduct Money)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">User Name</label>
                            <input
                                type="text"
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                placeholder="Enter user name"
                                className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Amount ($)</label>
                            <input
                                type="number"
                                value={creditAmount}
                                onChange={(e) => setCreditAmount(e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Reason</label>
                            <textarea
                                value={creditReason}
                                onChange={(e) => setCreditReason(e.target.value)}
                                placeholder="Enter reason for this transaction"
                                rows={3}
                                className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex space-x-4 pt-4">
                            <button
                                onClick={() => setShowAddCredit(false)}
                                className="flex-1 px-4 py-3 bg-gray-600/20 text-gray-300 rounded-xl hover:bg-gray-600/30 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddCredit}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-semibold"
                            >
                                {operationType === 'credit' ? 'Add Credit' : 'Add Debit'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }

    {/* Controls */ }
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20"
    >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-navy-800/50 border border-gold-500/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                </div>

                {/* Type Filter */}
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-2 bg-navy-800/50 border border-gold-500/20 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                    <option value="all">All Types</option>
                    <option value="credit">Credits</option>
                    <option value="debit">Debits</option>
                </select>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-navy-800/50 border border-gold-500/20 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                </select>
            </div>

            <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-400 hover:text-white hover:bg-navy-700/50 rounded-lg transition-colors">
                    <Download className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-white hover:bg-navy-700/50 rounded-lg transition-colors">
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>
        </div>
    </motion.div>

    {/* Transactions Table */ }
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="bg-dark-800/50 backdrop-blur-sm rounded-xl border border-gold-500/20 overflow-hidden"
    >
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-navy-800/50 border-b border-gold-500/20">
                    <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Transaction</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Balance Change</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gold-500/10">
                    {filteredTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-navy-800/30 transition-colors">
                            <td className="px-6 py-4">
                                <div>
                                    <p className="text-white font-medium">{transaction.transactionId}</p>
                                    <p className="text-gray-400 text-sm">{transaction.reason}</p>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{transaction.userName}</p>
                                        <p className="text-gray-400 text-sm">{transaction.userEmail}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center space-x-2">
                                    {transaction.type === 'credit' ? (
                                        <Plus className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <Minus className="w-4 h-4 text-red-500" />
                                    )}
                                    <span className={`font-medium ${transaction.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`font-medium ${transaction.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                                    {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toLocaleString()}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div>
                                    <p className="text-gray-400 text-sm">
                                        ${transaction.previousBalance.toLocaleString()} → ${transaction.newBalance.toLocaleString()}
                                    </p>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center space-x-2">
                                    {getStatusIcon(transaction.status)}
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(transaction.status)}`}>
                                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div>
                                    <p className="text-white text-sm">{transaction.timestamp.split(' ')[0]}</p>
                                    <p className="text-gray-400 text-xs">{transaction.timestamp.split(' ')[1]}</p>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center space-x-2">
                                    <button className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-white hover:bg-navy-700/50 rounded-lg transition-colors">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No transactions found matching your criteria</p>
            </div>
        )}
    </motion.div>
            )}
        </div >
    )
}

export default CreditManagement