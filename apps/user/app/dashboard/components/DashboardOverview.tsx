"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
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
    EyeOff
} from 'lucide-react'

const DashboardOverview = () => {
    const [showBalance, setShowBalance] = React.useState(true)

    // Mock data for charts
    const miningData = [
        { name: 'Jan', earnings: 2400, hashpower: 100 },
        { name: 'Feb', earnings: 2800, hashpower: 120 },
        { name: 'Mar', earnings: 3200, hashpower: 140 },
        { name: 'Apr', earnings: 2900, hashpower: 130 },
        { name: 'May', earnings: 3800, hashpower: 160 },
        { name: 'Jun', earnings: 4200, hashpower: 180 },
    ]

    const investmentData = [
        { name: 'Bitcoin Mining', value: 45, color: '#F59E0B' },
        { name: 'Gold Investment', value: 30, color: '#FFD700' },
        { name: 'Ethereum Mining', value: 15, color: '#8B5CF6' },
        { name: 'Cash Reserve', value: 10, color: '#10B981' },
    ]

    const dailyEarningsData = [
        { name: '00:00', btc: 0.002, usd: 120 },
        { name: '04:00', btc: 0.0025, usd: 150 },
        { name: '08:00', btc: 0.003, usd: 180 },
        { name: '12:00', btc: 0.0028, usd: 168 },
        { name: '16:00', btc: 0.0032, usd: 192 },
        { name: '20:00', btc: 0.0035, usd: 210 },
        { name: '24:00', btc: 0.004, usd: 240 },
    ]

    const stats = [
        {
            title: 'Total Balance',
            value: showBalance ? '$47,832.50' : '****',
            btcValue: showBalance ? '0.8423 BTC' : '****',
            change: '+12.5%',
            changeType: 'positive',
            icon: DollarSign,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
        },
        {
            title: 'Active Hashpower',
            value: '180 TH/s',
            subtitle: 'Premium Plan',
            change: '+5.2%',
            changeType: 'positive',
            icon: Zap,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
        },
        {
            title: 'Gold Holdings',
            value: '12.5 oz',
            subtitle: '$24,750.00',
            change: '+2.8%',
            changeType: 'positive',
            icon: Coins,
            color: 'text-gold-500',
            bgColor: 'bg-gold-500/10',
        },
        {
            title: 'Monthly Earnings',
            value: '$3,847.20',
            subtitle: '0.0678 BTC',
            change: '+8.1%',
            changeType: 'positive',
            icon: TrendingUp,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
        },
    ]

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
                        <h2 className="text-2xl font-bold text-white mb-2">Welcome back, John!</h2>
                        <p className="text-gray-300">Here's your portfolio overview for today.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setShowBalance(!showBalance)}
                            className="p-2 rounded-lg text-gray-400 hover:text-gold-500 transition-colors"
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
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20 card-hover"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div className={`flex items-center text-sm ${stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'
                                }`}>
                                {stat.changeType === 'positive' ? (
                                    <ArrowUpRight className="w-4 h-4 mr-1" />
                                ) : (
                                    <ArrowDownRight className="w-4 h-4 mr-1" />
                                )}
                                {stat.change}
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                        <p className="text-gray-400 text-sm mb-1">{stat.title}</p>
                        {stat.btcValue && <p className="text-gold-500 text-sm">{stat.btcValue}</p>}
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
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={miningData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1F2937',
                                    border: '1px solid #F59E0B',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="earnings"
                                stroke="#F59E0B"
                                strokeWidth={3}
                                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="hashpower"
                                stroke="#3B82F6"
                                strokeWidth={3}
                                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Portfolio Allocation */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
                >
                    <h3 className="text-lg font-semibold text-white mb-6">Portfolio Allocation</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={investmentData}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                innerRadius={60}
                                dataKey="value"
                                startAngle={90}
                                endAngle={450}
                            >
                                {investmentData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1F2937',
                                    border: '1px solid #F59E0B',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                        {investmentData.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div
                                        className="w-3 h-3 rounded-full mr-2"
                                        style={{ backgroundColor: item.color }}
                                    ></div>
                                    <span className="text-sm text-gray-300">{item.name}</span>
                                </div>
                                <span className="text-sm text-white font-medium">{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Daily Earnings Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Today's Earnings</h3>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center text-sm text-gray-400">
                            <Bitcoin className="w-4 h-4 mr-2 text-gold-500" />
                            BTC Earned: 0.0242
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                            <DollarSign className="w-4 h-4 mr-2 text-green-500" />
                            USD Value: $1,452.80
                        </div>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={dailyEarningsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1F2937',
                                border: '1px solid #F59E0B',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="usd"
                            stackId="1"
                            stroke="#10B981"
                            fill="url(#colorUsd)"
                            strokeWidth={2}
                        />
                        <defs>
                            <linearGradient id="colorUsd" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                    </AreaChart>
                </ResponsiveContainer>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20 card-hover cursor-pointer">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                            <Zap className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h4 className="text-white font-semibold">Upgrade Mining</h4>
                            <p className="text-gray-400 text-sm">Increase your hashpower</p>
                        </div>
                    </div>
                </div>

                <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20 card-hover cursor-pointer">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gold-500/20 rounded-xl">
                            <Coins className="w-6 h-6 text-gold-500" />
                        </div>
                        <div>
                            <h4 className="text-white font-semibold">Buy Gold</h4>
                            <p className="text-gray-400 text-sm">Diversify your portfolio</p>
                        </div>
                    </div>
                </div>

                <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20 card-hover cursor-pointer">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-green-500/20 rounded-xl">
                            <Activity className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <h4 className="text-white font-semibold">View Transactions</h4>
                            <p className="text-gray-400 text-sm">Track your history</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default DashboardOverview