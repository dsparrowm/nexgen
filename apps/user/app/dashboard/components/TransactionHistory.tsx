"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    History,
    Download,
    Filter,
    Search,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Bitcoin,
    Coins,
    Zap,
    DollarSign
} from 'lucide-react'

const TransactionHistory = () => {
    const [filter, setFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')

    const transactions = [
        {
            id: 1,
            type: 'mining_reward',
            description: 'Bitcoin Mining Reward',
            amount: '+0.0024 BTC',
            usdValue: '+$144.00',
            date: '2024-01-20',
            time: '14:30',
            status: 'completed',
            txHash: '0x1234...5678',
            icon: Bitcoin,
            color: 'text-orange-500',
            bgColor: 'bg-orange-500/20'
        },
        {
            id: 2,
            type: 'gold_purchase',
            description: 'Gold Investment',
            amount: '+2.5 oz',
            usdValue: '-$5,200.00',
            date: '2024-01-18',
            time: '10:15',
            status: 'completed',
            txHash: '0xabcd...efgh',
            icon: Coins,
            color: 'text-gold-500',
            bgColor: 'bg-gold-500/20'
        },
        {
            id: 3,
            type: 'hashpower_rental',
            description: 'Hashpower Upgrade',
            amount: '+50 TH/s',
            usdValue: '-$125.00',
            date: '2024-01-15',
            time: '16:45',
            status: 'completed',
            txHash: '0x9876...5432',
            icon: Zap,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/20'
        },
        {
            id: 4,
            type: 'withdrawal',
            description: 'Bitcoin Withdrawal',
            amount: '-0.1 BTC',
            usdValue: '-$6,000.00',
            date: '2024-01-10',
            time: '09:20',
            status: 'completed',
            txHash: '0xfedc...ba98',
            icon: ArrowUpRight,
            color: 'text-red-500',
            bgColor: 'bg-red-500/20'
        },
        {
            id: 5,
            type: 'deposit',
            description: 'USD Deposit',
            amount: '+$10,000.00',
            usdValue: '+$10,000.00',
            date: '2024-01-05',
            time: '11:30',
            status: 'completed',
            txHash: '0x1111...2222',
            icon: DollarSign,
            color: 'text-green-500',
            bgColor: 'bg-green-500/20'
        },
    ]

    const filteredTransactions = transactions.filter(tx => {
        const matchesFilter = filter === 'all' || tx.type === filter
        const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesFilter && matchesSearch
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-500 bg-green-500/20'
            case 'pending': return 'text-yellow-500 bg-yellow-500/20'
            case 'failed': return 'text-red-500 bg-red-500/20'
            default: return 'text-gray-500 bg-gray-500/20'
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
                        <p className="text-gray-400">Track all your mining rewards, investments, and transfers</p>
                    </div>
                    <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center px-4 py-2 bg-navy-800 text-white rounded-lg hover:bg-navy-700 transition-colors"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </motion.button>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-navy-800/50 border border-gold-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-500"
                        />
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 bg-navy-800/50 border border-gold-500/30 rounded-lg text-white focus:outline-none focus:border-gold-500"
                    >
                        <option value="all">All Transactions</option>
                        <option value="mining_reward">Mining Rewards</option>
                        <option value="gold_purchase">Gold Purchases</option>
                        <option value="hashpower_rental">Hashpower</option>
                        <option value="deposit">Deposits</option>
                        <option value="withdrawal">Withdrawals</option>
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
                {[
                    { label: 'Total Deposits', value: '$45,000', change: '+12.5%', color: 'text-green-500' },
                    { label: 'Total Withdrawals', value: '$8,500', change: '-2.3%', color: 'text-red-500' },
                    { label: 'Mining Rewards', value: '0.247 BTC', change: '+15.8%', color: 'text-orange-500' },
                    { label: 'Gold Holdings', value: '12.5 oz', change: '+8.4%', color: 'text-gold-500' },
                ].map((stat, index) => (
                    <div key={index} className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-4 border border-gold-500/20">
                        <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                        <p className="text-xl font-bold text-white mb-1">{stat.value}</p>
                        <p className={`text-sm ${stat.color}`}>{stat.change}</p>
                    </div>
                ))}
            </motion.div>

            {/* Transaction List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl border border-gold-500/20 overflow-hidden"
            >
                <div className="p-6 border-b border-gold-500/20">
                    <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
                </div>

                <div className="divide-y divide-gold-500/10">
                    {filteredTransactions.map((transaction) => (
                        <motion.div
                            key={transaction.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-6 hover:bg-navy-800/30 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className={`p-3 rounded-xl ${transaction.bgColor}`}>
                                        <transaction.icon className={`w-5 h-5 ${transaction.color}`} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium">{transaction.description}</h4>
                                        <div className="flex items-center space-x-4 mt-1">
                                            <p className="text-gray-400 text-sm">{transaction.date} at {transaction.time}</p>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(transaction.status)}`}>
                                                {transaction.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-white font-medium">{transaction.amount}</p>
                                    <p className="text-gray-400 text-sm">{transaction.usdValue}</p>
                                    <p className="text-gray-500 text-xs mt-1">
                                        {transaction.txHash}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {filteredTransactions.length === 0 && (
                    <div className="p-12 text-center">
                        <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">No transactions found matching your criteria</p>
                    </div>
                )}
            </motion.div>
        </div>
    )
}

export default TransactionHistory