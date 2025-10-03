'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'
import {
    Users,
    DollarSign,
    TrendingUp,
    Activity,
    UserPlus,
    CreditCard,
    AlertTriangle,
    CheckCircle,
    Clock,
    Eye,
    MoreVertical,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    PieChart,
    RefreshCw
} from 'lucide-react'

interface DashboardStats {
    totalUsers: number
    activeUsers: number
    totalInvestments: number
    totalTransactions: number
    pendingKyc: number
    pendingWithdrawals: number
    supportTickets: number
    recentTransactions: any[]
    changes: {
        users: string
        investments: string
        transactions: string
        uptime: string
    }
    systemUptime: string
}

const AdminOverview = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('7d')
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const { admin } = useAuth()

    const fetchDashboardStats = async (showRefreshIndicator = false) => {
        if (showRefreshIndicator) {
            setIsRefreshing(true)
        } else {
            setIsLoading(true)
        }
        setError(null)

        try {
            const response = await apiClient.getDashboardStats()

            if (response.success && response.data?.stats) {
                setStats(response.data.stats)
            } else {
                setError(response.error?.message || 'Failed to load dashboard statistics')
            }
        } catch (err) {
            console.error('Error fetching dashboard stats:', err)
            setError('An error occurred while loading dashboard statistics')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        fetchDashboardStats()
    }, [])

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchDashboardStats(true)
        }, 30000)

        return () => clearInterval(interval)
    }, [])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US').format(num)
    }

    const calculateUptime = () => {
        return stats?.systemUptime || '99.9%'
    }

    const dashboardStats = stats ? [
        {
            title: 'Total Users',
            value: formatNumber(stats.totalUsers),
            change: stats.changes.users,
            changeType: stats.changes.users.startsWith('+') ? 'increase' : 'decrease',
            icon: Users,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            description: `${formatNumber(stats.activeUsers)} active users`
        },
        {
            title: 'Total Investments',
            value: formatCurrency(stats.totalInvestments),
            change: stats.changes.investments,
            changeType: stats.changes.investments.startsWith('+') ? 'increase' : 'decrease',
            icon: DollarSign,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
            description: 'Total platform investments'
        },
        {
            title: 'Total Transactions',
            value: formatNumber(stats.totalTransactions),
            change: stats.changes.transactions,
            changeType: stats.changes.transactions.startsWith('+') ? 'increase' : 'decrease',
            icon: TrendingUp,
            color: 'text-gold-500',
            bgColor: 'bg-gold-500/10',
            description: 'All time transactions'
        },
        {
            title: 'System Uptime',
            value: calculateUptime(),
            change: stats.changes.uptime,
            changeType: stats.changes.uptime.startsWith('+') ? 'increase' : 'decrease',
            icon: Activity,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            description: 'Platform availability'
        }
    ] : []

    const quickActions = [
        {
            title: 'Add New User',
            description: 'Create new user account',
            icon: UserPlus,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            href: '/admin/users/add'
        },
        {
            title: 'Credit User',
            description: 'Add credits to user account',
            icon: CreditCard,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
            href: '/admin/credits/add'
        },
        {
            title: 'View Reports',
            description: 'System analytics & reports',
            icon: PieChart,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            href: '/admin/reports'
        },
        {
            title: 'User Management',
            description: 'Manage all user accounts',
            icon: Users,
            color: 'text-gold-500',
            bgColor: 'bg-gold-500/10',
            href: '/admin/users'
        }
    ]

    // Format recent activities from real transaction data
    const recentActivities = stats?.recentTransactions.map((transaction, index) => ({
        id: transaction.id,
        user: transaction.user?.username || transaction.user?.email || 'Unknown User',
        action: transaction.type,
        amount: formatCurrency(transaction.amount),
        time: formatRelativeTime(new Date(transaction.createdAt)),
        status: transaction.status.toLowerCase(),
        type: transaction.type.toLowerCase()
    })) || []

    function formatRelativeTime(date: Date): string {
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
        return `${days} day${days > 1 ? 's' : ''} ago`
    }

    const pendingTasks = stats ? [
        {
            id: 1,
            title: 'KYC Verification Pending',
            count: stats.pendingKyc,
            priority: 'high',
            icon: AlertTriangle,
            color: 'text-red-500',
            href: '/admin/users?filter=kyc-pending'
        },
        {
            id: 2,
            title: 'Withdrawal Approvals',
            count: stats.pendingWithdrawals,
            priority: 'medium',
            icon: Wallet,
            color: 'text-yellow-500',
            href: '/admin/transactions?filter=pending-withdrawals'
        },
        {
            id: 3,
            title: 'Support Tickets',
            count: stats.supportTickets,
            priority: 'low',
            icon: CheckCircle,
            color: 'text-blue-500',
            href: '/admin/support'
        }
    ] : []

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

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'investment':
                return <TrendingUp className="w-4 h-4 text-green-500" />
            case 'withdrawal':
                return <Wallet className="w-4 h-4 text-red-500" />
            case 'credit':
                return <CreditCard className="w-4 h-4 text-blue-500" />
            case 'verification':
                return <CheckCircle className="w-4 h-4 text-purple-500" />
            case 'dividend':
                return <DollarSign className="w-4 h-4 text-gold-500" />
            default:
                return <Activity className="w-4 h-4 text-gray-500" />
        }
    }

    return (
        <div className="space-y-6">
            {/* Loading State */}
            {isLoading && !stats && (
                <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mb-4"></div>
                        <p className="text-gray-400">Loading dashboard...</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && !stats && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
                            <div>
                                <h3 className="text-lg font-semibold text-red-500">Error Loading Dashboard</h3>
                                <p className="text-sm text-red-400 mt-1">{error}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => fetchDashboardStats()}
                            className="btn-primary"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Dashboard Content */}
            {stats && (
                <>
                    {/* Welcome Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="bg-gradient-to-r from-gold-500/10 to-blue-500/10 rounded-2xl p-6 border border-gold-500/20"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    Welcome back, {admin?.firstName || 'Admin'}
                                </h2>
                                <p className="text-gray-300">Here's what's happening with your investment platform today.</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => fetchDashboardStats(true)}
                                    disabled={isRefreshing}
                                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-navy-700/50 transition-colors disabled:opacity-50"
                                    title="Refresh data"
                                >
                                    <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                                </button>
                                {['24h', '7d', '30d', '90d'].map((period) => (
                                    <button
                                        key={period}
                                        onClick={() => setSelectedPeriod(period)}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${selectedPeriod === period
                                            ? 'bg-gold-500 text-navy-900'
                                            : 'text-gray-400 hover:text-white hover:bg-navy-700/50'
                                            }`}
                                    >
                                        {period}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.6 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        {dashboardStats.map((stat, index) => (
                            <div
                                key={index}
                                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20 hover:border-gold-500/40 transition-all duration-300"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                    </div>
                                    <div className="flex items-center text-sm">
                                        {stat.changeType === 'increase' ? (
                                            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                                        ) : (
                                            <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                                        )}
                                        <span className={stat.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}>
                                            {stat.change}
                                        </span>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                                <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                                <p className="text-gray-500 text-xs mt-1">{stat.description}</p>
                            </div>
                        ))}
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Quick Actions */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-white">Quick Actions</h3>
                                <MoreVertical className="w-5 h-5 text-gray-400" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {quickActions.map((action, index) => (
                                    <Link
                                        key={index}
                                        href={action.href}
                                        className="p-4 bg-navy-800/50 rounded-xl border border-gold-500/20 hover:border-gold-500/40 transition-all duration-300 group cursor-pointer block"
                                    >
                                        <div className={`w-10 h-10 ${action.bgColor} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                            <action.icon className={`w-5 h-5 ${action.color}`} />
                                        </div>
                                        <p className="text-white font-medium text-sm mb-1">{action.title}</p>
                                        <p className="text-gray-400 text-xs">{action.description}</p>
                                    </Link>
                                ))}
                            </div>
                        </motion.div>

                        {/* Recent Activities */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-white">Recent Activities</h3>
                                <Link href="/admin/transactions" className="text-gold-500 hover:text-gold-400 transition-colors">
                                    <Eye className="w-5 h-5" />
                                </Link>
                            </div>

                            <div className="space-y-4">
                                {recentActivities.slice(0, 5).map((activity) => (
                                    <Link
                                        key={activity.id}
                                        href={`/admin/transactions?id=${activity.id}`}
                                        className="flex items-center justify-between p-3 rounded-xl bg-navy-800/30 hover:bg-navy-800/50 transition-colors cursor-pointer block"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 rounded-lg bg-navy-700/50">
                                                {getActivityIcon(activity.type)}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-sm">{activity.user}</p>
                                                <p className="text-gray-400 text-xs">{activity.action}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-white text-sm font-medium">{activity.amount}</span>
                                                {getStatusIcon(activity.status)}
                                            </div>
                                            <p className="text-gray-400 text-xs">{activity.time}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </motion.div>

                        {/* Pending Tasks */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                            className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-white">Pending Tasks</h3>
                                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full font-medium">
                                    {pendingTasks.reduce((sum, task) => sum + task.count, 0)} Total
                                </span>
                            </div>

                            <div className="space-y-4">
                                {pendingTasks.map((task) => (
                                    <Link
                                        key={task.id}
                                        href={task.href}
                                        className="flex items-center justify-between p-4 rounded-xl bg-navy-800/30 hover:bg-navy-800/50 transition-colors cursor-pointer block"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <task.icon className={`w-5 h-5 ${task.color}`} />
                                            <div>
                                                <p className="text-white font-medium text-sm">{task.title}</p>
                                                <p className="text-gray-400 text-xs capitalize">{task.priority} priority</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                                task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {task.count}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* System Status */}
                            <div className="mt-6 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-green-400 font-medium text-sm">System Status: Online</span>
                                    </div>
                                    <span className="text-green-400 text-sm">{calculateUptime()}</span>
                                </div>
                                <p className="text-gray-400 text-xs mt-1">All services operational</p>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </div>
    )
}

export default AdminOverview