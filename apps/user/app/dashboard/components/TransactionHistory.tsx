"use client"

import React from 'react'
import { motion } from 'framer-motion'
import {
    History,
    Download,
    Search,
    ArrowUpRight,
    ArrowDownRight,
    Bitcoin,
    Coins,
    DollarSign,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    RefreshCw,
    TrendingUp,
    TrendingDown
} from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { formatCurrency } from '@/utils/formatters'
import { exportTransactionsToCSV } from '@/utils/api/transactionApi'

const TransactionHistory = () => {
    const {
        transactions,
        summary,
        pagination,
        loading,
        error,
        filters,
        setFilters,
        refetch,
        nextPage,
        prevPage
    } = useTransactions()

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'DEPOSIT': return DollarSign
            case 'WITHDRAWAL': return ArrowUpRight
            case 'INVESTMENT': return Coins
            case 'PAYOUT': return Bitcoin
            default: return DollarSign
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'DEPOSIT': return { text: 'text-green-500', bg: 'bg-green-500/20' }
            case 'WITHDRAWAL': return { text: 'text-red-500', bg: 'bg-red-500/20' }
            case 'INVESTMENT': return { text: 'text-gold-500', bg: 'bg-gold-500/20' }
            case 'PAYOUT': return { text: 'text-orange-500', bg: 'bg-orange-500/20' }
            default: return { text: 'text-gray-500', bg: 'bg-gray-500/20' }
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'text-green-500 bg-green-500/20'
            case 'PENDING': return 'text-yellow-500 bg-yellow-500/20'
            case 'FAILED': return 'text-red-500 bg-red-500/20'
            default: return 'text-gray-500 bg-gray-500/20'
        }
    }

    const getAmountDisplay = (transaction: any) => {
        const sign = transaction.type === 'DEPOSIT' || transaction.type === 'PAYOUT' ? '+' : '-'
        const amount = Math.abs(transaction.amount)
        return `${sign}${formatCurrency(amount)}`
    }

    const handleExport = () => {
        if (transactions.length > 0) {
            exportTransactionsToCSV(transactions, 'transactions')
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
            >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Transaction History</h2>
                        <p className="text-gray-400">Track all your investments, payouts, deposits, and withdrawals</p>
                    </div>
                    <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleExport}
                            disabled={transactions.length === 0}
                            className="flex items-center px-4 py-2 bg-navy-800 text-white rounded-lg hover:bg-navy-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </motion.button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <select
                        value={filters.type}
                        onChange={(e) => setFilters({ type: e.target.value })}
                        disabled={loading}
                        className="px-4 py-2 bg-navy-800/50 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500 disabled:opacity-50"
                    >
                        <option value="all">All Types</option>
                        <option value="DEPOSIT">Deposits</option>
                        <option value="WITHDRAWAL">Withdrawals</option>
                        <option value="INVESTMENT">Investments</option>
                        <option value="PAYOUT">Payouts</option>
                    </select>

                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ status: e.target.value })}
                        disabled={loading}
                        className="px-4 py-2 bg-navy-800/50 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500 disabled:opacity-50"
                    >
                        <option value="all">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="FAILED">Failed</option>
                    </select>
                </div>
            </motion.div>

            {/* Summary Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
                {loading ? (
                    // Loading skeletons
                    [1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-4 border border-gold-500/20 animate-pulse">
                            <div className="h-4 bg-gray-700/50 rounded w-24 mb-2"></div>
                            <div className="h-6 bg-gray-700/50 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-700/50 rounded w-16"></div>
                        </div>
                    ))
                ) : (
                    <>
                        <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-4 border border-gold-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-gray-400 text-sm">Total Deposits</p>
                                <TrendingUp className="w-4 h-4 text-green-500" />
                            </div>
                            <p className="text-2xl font-bold text-white mb-1">
                                {formatCurrency(summary?.deposits || 0)}
                            </p>
                            <p className="text-sm text-green-500">Funds added</p>
                        </div>

                        <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-4 border border-gold-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-gray-400 text-sm">Total Withdrawals</p>
                                <TrendingDown className="w-4 h-4 text-red-500" />
                            </div>
                            <p className="text-2xl font-bold text-white mb-1">
                                {formatCurrency(summary?.withdrawals || 0)}
                            </p>
                            <p className="text-sm text-red-500">Funds withdrawn</p>
                        </div>

                        <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-4 border border-gold-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-gray-400 text-sm">Total Investments</p>
                                <Coins className="w-4 h-4 text-gold-500" />
                            </div>
                            <p className="text-2xl font-bold text-white mb-1">
                                {formatCurrency(summary?.investments || 0)}
                            </p>
                            <p className="text-sm text-gold-500">Invested</p>
                        </div>

                        <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-4 border border-gold-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-gray-400 text-sm">Total Payouts</p>
                                <Bitcoin className="w-4 h-4 text-orange-500" />
                            </div>
                            <p className="text-2xl font-bold text-white mb-1">
                                {formatCurrency(summary?.payouts || 0)}
                            </p>
                            <p className="text-sm text-orange-500">Earnings paid</p>
                        </div>
                    </>
                )}
            </motion.div>

            {/* Error State */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-red-500/20 rounded-xl">
                                <AlertCircle className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-lg">Failed to load transactions</h3>
                                <p className="text-gray-400 text-sm mt-1">{error}</p>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={refetch}
                            className="flex items-center px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry
                        </motion.button>
                    </div>
                </motion.div>
            )}

            {/* Transaction List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl border border-gold-500/20 overflow-hidden"
            >
                <div className="p-6 border-b border-gold-500/20">
                    <h3 className="text-lg font-semibold text-white">
                        Transactions {pagination && `(${pagination.total})`}
                    </h3>
                </div>

                {loading ? (
                    // Loading skeletons
                    <div className="divide-y divide-gold-500/10">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="p-6 animate-pulse">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-gray-700/50 rounded-xl"></div>
                                        <div>
                                            <div className="h-4 bg-gray-700/50 rounded w-40 mb-2"></div>
                                            <div className="h-3 bg-gray-700/50 rounded w-32"></div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="h-4 bg-gray-700/50 rounded w-24 mb-2 ml-auto"></div>
                                        <div className="h-3 bg-gray-700/50 rounded w-20 ml-auto"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : transactions.length > 0 ? (
                    <div className="divide-y divide-gold-500/10">
                        {transactions.map((transaction) => {
                            const Icon = getTypeIcon(transaction.type)
                            const colors = getTypeColor(transaction.type)

                            return (
                                <motion.div
                                    key={transaction.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-6 hover:bg-navy-800/30 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-3 rounded-xl ${colors.bg}`}>
                                                <Icon className={`w-5 h-5 ${colors.text}`} />
                                            </div>
                                            <div>
                                                <h4 className="text-white font-medium">
                                                    {transaction.description || transaction.type}
                                                </h4>
                                                <div className="flex items-center space-x-4 mt-1">
                                                    <p className="text-gray-400 text-sm">
                                                        {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(transaction.status)}`}>
                                                        {transaction.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className={`font-medium text-lg ${transaction.type === 'DEPOSIT' || transaction.type === 'PAYOUT'
                                                ? 'text-green-500'
                                                : 'text-red-500'
                                                }`}>
                                                {getAmountDisplay(transaction)}
                                            </p>
                                            <p className="text-gray-400 text-sm">
                                                {transaction.currency}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg mb-2">No transactions found</p>
                        <p className="text-gray-500 text-sm">
                            {filters.type !== 'all' || filters.status !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Your transactions will appear here'}
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                    <div className="p-6 border-t border-gold-500/20 flex items-center justify-between">
                        <div className="text-sm text-gray-400">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                            {pagination.total} transactions
                        </div>
                        <div className="flex items-center space-x-2">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={prevPage}
                                disabled={pagination.page === 1 || loading}
                                className="p-2 bg-navy-800/50 border border-gold-500/30 rounded-lg text-white hover:bg-navy-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </motion.button>
                            <span className="text-white px-4">
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={nextPage}
                                disabled={pagination.page === pagination.pages || loading}
                                className="p-2 bg-navy-800/50 border border-gold-500/30 rounded-lg text-white hover:bg-navy-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </motion.button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    )
}

export default TransactionHistory