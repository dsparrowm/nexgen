"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import {
    Bitcoin,
    TrendingUp,
    Zap,
    Coins,
    DollarSign,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Eye,
    EyeOff,
    AlertCircle,
    RefreshCw
} from 'lucide-react'
import { useDashboardData } from '@/hooks/useDashboardData'
import { formatCurrency, formatHashrate, formatCrypto, formatPercentage } from '@/utils/formatters'

type StatCard = {
    title: string;
    value: string;
    subtitle: string;
    icon: any;
    color: string;
    bgColor: string;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
};

const DashboardOverview = () => {
    const router = useRouter()
    const [showBalance, setShowBalance] = React.useState(true)
    const { data, stats, loading, error, refetch } = useDashboardData()

    // Calculate percentage changes from historical data
    const calculatePercentageChange = (currentValue: number, historicalData: any[]): { change: string, changeType: 'positive' | 'negative' | 'neutral' } | null => {
        if (!historicalData || historicalData.length < 2) return null;

        const sortedData = [...historicalData].sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());
        const currentMonth = sortedData[0]?.earnings || 0;
        const previousMonth = sortedData[1]?.earnings || 0;

        if (previousMonth === 0) return null;

        const percentChange = ((currentMonth - previousMonth) / previousMonth) * 100;

        return {
            change: `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}%`,
            changeType: percentChange > 0 ? 'positive' : percentChange < 0 ? 'negative' : 'neutral'
        };
    };

    const earningsChange = stats?.earnings?.byMonth ? calculatePercentageChange(0, stats.earnings.byMonth) : null;

    const statsCards: StatCard[] = [
        {
            title: 'Total Balance',
            value: showBalance ? formatCurrency(data?.user?.balance || 0) : '****',
            subtitle: 'Available to invest',
            icon: DollarSign,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
        },
        {
            title: 'Total Hashpower',
            value: formatHashrate(data?.user?.totalHashpower || 0),
            subtitle: data?.stats?.activeMiningOperations
                ? `${data.stats.activeMiningOperations} ${data.stats.activeMiningOperations === 1 ? 'Miner' : 'Miners'} Active`
                : 'No active miners',
            icon: Zap,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
        },
        {
            title: 'Active Investments',
            value: formatCurrency(data?.user?.totalInvested || 0),
            subtitle: data?.stats?.activeInvestments
                ? `${data.stats.activeInvestments} ${data.stats.activeInvestments === 1 ? 'Investment' : 'Investments'}`
                : 'No investments',
            icon: Coins,
            color: 'text-gold-500',
            bgColor: 'bg-gold-500/10',
        },
        {
            title: 'Total Earnings',
            value: formatCurrency(data?.user?.totalEarnings || 0),
            subtitle: data?.stats?.dailyEarnings
                ? `${formatCurrency(data.stats.dailyEarnings)} today`
                : 'No earnings',
            icon: TrendingUp,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
        },
    ]

    // Loading state
    if (loading) {
        return (
            <div className="space-y-6">
                {/* Loading skeleton */}
                <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20 animate-pulse">
                    <div className="h-20 bg-gray-700/50 rounded"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20 animate-pulse">
                            <div className="h-32 bg-gray-700/50 rounded"></div>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20 animate-pulse">
                            <div className="h-64 bg-gray-700/50 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="space-y-6">
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
                                <h3 className="text-white font-semibold text-lg">Failed to load dashboard data</h3>
                                <p className="text-gray-300 text-sm mt-1">{error}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => refetch()}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Retry</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        )
    }

    const userName = data?.user?.firstName || data?.user?.username || 'User'

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-gradient-to-r from-gold-500/10 to-blue-500/10 rounded-2xl p-6 border border-gold-500/20"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Welcome back, {userName}!</h2>
                        <p className="text-gray-300">Here's your portfolio overview for today.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setShowBalance(!showBalance)}
                            className="p-2 rounded-lg text-gray-400 hover:text-gold-500 transition-colors"
                            title={showBalance ? 'Hide balance' : 'Show balance'}
                        >
                            {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {statsCards.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20 card-hover"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            {stat.change && (
                                <div className={`flex items-center text-sm ${stat.changeType === 'positive' ? 'text-green-500' : stat.changeType === 'negative' ? 'text-red-500' : 'text-gray-400'
                                    }`}>
                                    {stat.changeType === 'positive' ? (
                                        <ArrowUpRight className="w-4 h-4 mr-1" />
                                    ) : stat.changeType === 'negative' ? (
                                        <ArrowDownRight className="w-4 h-4 mr-1" />
                                    ) : null}
                                    {stat.change}
                                </div>
                            )}
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                        <p className="text-gray-400 text-sm mb-1">{stat.title}</p>
                        {stat.subtitle && <p className="text-gray-500 text-sm">{stat.subtitle}</p>}
                    </div>
                ))}
            </motion.div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mining Performance Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Mining Performance</h3>
                        <div className="flex items-center space-x-2">
                            <div className="flex items-center text-sm text-gray-400">
                                <div className="w-3 h-3 bg-gold-500 rounded-full mr-2"></div>
                                Earnings
                            </div>
                            <div className="flex items-center text-sm text-gray-400">
                                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                Hashpower
                            </div>
                        </div>
                    </div>
                    {(data?.stats?.activeMiningOperations ?? 0) > 0 ? (
                        <div className="flex items-center justify-center h-[300px]">
                            <div className="text-center">
                                <Activity className="w-16 h-16 text-blue-500 mx-auto mb-4 opacity-50" />
                                <p className="text-gray-400 text-sm">Historical mining data will appear here</p>
                                <p className="text-gray-500 text-xs mt-2">Chart shows performance trends over time</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[300px]">
                            <div className="text-center">
                                <Zap className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-30" />
                                <p className="text-gray-400 text-sm">No active mining operations</p>
                                <button
                                    onClick={() => router.push('/dashboard/mining')}
                                    className="mt-4 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                                >
                                    Start Mining
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Portfolio Allocation */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
                >
                    <h3 className="text-lg font-semibold text-white mb-6">Portfolio Allocation</h3>
                    {(data?.stats?.activeInvestments ?? 0) > 0 || (data?.user?.balance ?? 0) > 0 ? (
                        <div className="flex items-center justify-center h-[300px]">
                            <div className="text-center">
                                <TrendingUp className="w-16 h-16 text-gold-500 mx-auto mb-4 opacity-50" />
                                <p className="text-gray-400 text-sm">Portfolio breakdown will appear here</p>
                                <p className="text-gray-500 text-xs mt-2">Shows asset distribution across investments</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[300px]">
                            <div className="text-center">
                                <Coins className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-30" />
                                <p className="text-gray-400 text-sm">No active investments</p>
                                <button
                                    onClick={() => router.push('/dashboard/investments')}
                                    className="mt-4 px-4 py-2 bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 rounded-lg transition-colors"
                                >
                                    Start Investing
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Monthly Earnings Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Earnings History</h3>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center text-sm text-gray-400">
                            <Bitcoin className="w-4 h-4 mr-2 text-gold-500" />
                            Total: {showBalance ? formatCurrency(data?.user?.totalEarnings || 0) : '****'}
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                            <DollarSign className="w-4 h-4 mr-2 text-green-500" />
                            Today: {showBalance ? formatCurrency(data?.stats?.dailyEarnings || 0) : '****'}
                        </div>
                    </div>
                </div>
                {stats?.earnings?.byMonth && stats.earnings.byMonth.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart
                            data={stats.earnings.byMonth
                                .slice()
                                .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
                                .map(item => ({
                                    month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                                    earnings: Number(item.earnings) || 0
                                }))}
                        >
                            <defs>
                                <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                            <XAxis
                                dataKey="month"
                                stroke="#9CA3AF"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#9CA3AF"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value.toLocaleString()}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1F2937',
                                    border: '1px solid #374151',
                                    borderRadius: '8px',
                                    color: '#F9FAFB'
                                }}
                                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Earnings']}
                            />
                            <Area
                                type="monotone"
                                dataKey="earnings"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                fill="url(#earningsGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-[250px]">
                        <div className="text-center">
                            <DollarSign className="w-12 h-12 text-gray-500 mx-auto mb-3 opacity-30" />
                            <p className="text-gray-400 text-sm">No earnings history yet</p>
                            <p className="text-gray-500 text-xs mt-2">Start mining or investing to build your earnings history</p>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                <button
                    onClick={() => router.push('/dashboard/mining')}
                    className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20 card-hover cursor-pointer text-left transition-all hover:border-blue-500/40"
                >
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                            <Zap className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h4 className="text-white font-semibold">Start Mining</h4>
                            <p className="text-gray-400 text-sm">Increase your hashpower</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => router.push('/dashboard/investments')}
                    className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20 card-hover cursor-pointer text-left transition-all hover:border-gold-500/40"
                >
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gold-500/20 rounded-xl">
                            <Coins className="w-6 h-6 text-gold-500" />
                        </div>
                        <div>
                            <h4 className="text-white font-semibold">New Investment</h4>
                            <p className="text-gray-400 text-sm">Diversify your portfolio</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => router.push('/dashboard/transactions')}
                    className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20 card-hover cursor-pointer text-left transition-all hover:border-green-500/40"
                >
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-green-500/20 rounded-xl">
                            <Activity className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <h4 className="text-white font-semibold">View Transactions</h4>
                            <p className="text-gray-400 text-sm">Track your history</p>
                        </div>
                    </div>
                </button>
            </motion.div>
        </div>
    )
}

export default DashboardOverview