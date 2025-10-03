'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    TrendingUp,
    Users,
    DollarSign,
    Activity,
    Download,
    Calendar,
    BarChart3,
    PieChart,
    LineChart,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react'

const ReportsAnalytics = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('30d')
    const [selectedReport, setSelectedReport] = useState('overview')

    const reportTypes = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'revenue', label: 'Revenue', icon: DollarSign },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'activity', label: 'Activity', icon: Activity }
    ]

    const keyMetrics = [
        {
            title: 'Total Revenue',
            value: '$2.4M',
            change: '+12.5%',
            changeType: 'increase',
            period: 'vs last month',
            icon: DollarSign,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10'
        },
        {
            title: 'New Users',
            value: '1,429',
            change: '+8.3%',
            changeType: 'increase',
            period: 'vs last month',
            icon: Users,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10'
        },
        {
            title: 'Active Investments',
            value: '8,742',
            change: '+15.2%',
            changeType: 'increase',
            period: 'vs last month',
            icon: TrendingUp,
            color: 'text-gold-500',
            bgColor: 'bg-gold-500/10'
        },
        {
            title: 'Platform Activity',
            value: '94.2%',
            change: '+2.1%',
            changeType: 'increase',
            period: 'engagement rate',
            icon: Activity,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10'
        }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
                    <p className="text-gray-400">Comprehensive platform insights and performance metrics</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Period Selector */}
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="px-4 py-2 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white focus:outline-none focus:border-gold-500/40"
                    >
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                        <option value="1y">Last Year</option>
                        <option value="all">All Time</option>
                    </select>

                    {/* Export Button */}
                    <button className="btn-primary flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>
                </div>
            </div>

            {/* Report Type Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {reportTypes.map((type) => {
                    const Icon = type.icon
                    return (
                        <button
                            key={type.id}
                            onClick={() => setSelectedReport(type.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${selectedReport === type.id
                                    ? 'bg-gold-500 text-navy-900'
                                    : 'bg-navy-800/50 text-gray-400 hover:text-white hover:bg-navy-700/50'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{type.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Key Metrics */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {keyMetrics.map((metric, index) => {
                    const Icon = metric.icon
                    return (
                        <div
                            key={index}
                            className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20 hover:border-gold-500/40 transition-all"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl ${metric.bgColor}`}>
                                    <Icon className={`w-6 h-6 ${metric.color}`} />
                                </div>
                                <div className="flex items-center text-sm">
                                    {metric.changeType === 'increase' ? (
                                        <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                                    ) : (
                                        <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                                    )}
                                    <span className={metric.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}>
                                        {metric.change}
                                    </span>
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">{metric.value}</h3>
                            <p className="text-gray-400 text-sm font-medium">{metric.title}</p>
                            <p className="text-gray-500 text-xs mt-1">{metric.period}</p>
                        </div>
                    )
                })}
            </motion.div>

            {/* Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.6 }}
                    className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white">Revenue Trend</h3>
                            <p className="text-sm text-gray-400">Monthly revenue over time</p>
                        </div>
                        <LineChart className="w-5 h-5 text-gold-500" />
                    </div>
                    <div className="h-64 flex items-center justify-center bg-navy-900/30 rounded-xl border border-gold-500/10">
                        <div className="text-center">
                            <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-400 text-sm">Chart integration coming soon</p>
                            <p className="text-gray-500 text-xs mt-1">This will display revenue analytics</p>
                        </div>
                    </div>
                </motion.div>

                {/* User Growth Chart */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white">User Growth</h3>
                            <p className="text-sm text-gray-400">New users registration trend</p>
                        </div>
                        <PieChart className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="h-64 flex items-center justify-center bg-navy-900/30 rounded-xl border border-gold-500/10">
                        <div className="text-center">
                            <Users className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-400 text-sm">Chart integration coming soon</p>
                            <p className="text-gray-500 text-xs mt-1">This will display user growth analytics</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Info Note */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4"
            >
                <div className="flex items-start gap-3">
                    <BarChart3 className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-blue-400 mb-1">Advanced Analytics Coming Soon</h4>
                        <p className="text-xs text-gray-400">
                            Full chart integration with Chart.js or Recharts is planned for the next phase.
                            Current metrics are fetched from real backend data.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default ReportsAnalytics
