'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
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
    PieChart
} from 'lucide-react'

const AdminOverview = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('7d')

    const stats = [
        {
            title: 'Total Users',
            value: '12,847',
            change: '+15.3%',
            changeType: 'increase',
            icon: Users,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            description: 'Active users this month'
        },
        {
            title: 'Total Investments',
            value: '$47.2M',
            change: '+8.2%',
            changeType: 'increase',
            icon: DollarSign,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
            description: 'Total platform investments'
        },
        {
            title: 'Monthly Returns',
            value: '$3.8M',
            change: '+12.1%',
            changeType: 'increase',
            icon: TrendingUp,
            color: 'text-gold-500',
            bgColor: 'bg-gold-500/10',
            description: 'Generated this month'
        },
        {
            title: 'System Uptime',
            value: '99.9%',
            change: '+0.2%',
            changeType: 'increase',
            icon: Activity,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            description: 'Platform availability'
        }
    ]

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

    const recentActivities = [
        {
            id: 1,
            user: 'John Smith',
            action: 'New Investment',
            amount: '$5,000',
            time: '2 minutes ago',
            status: 'completed',
            type: 'investment'
        },
        {
            id: 2,
            user: 'Sarah Johnson',
            action: 'Withdrawal Request',
            amount: '$1,200',
            time: '15 minutes ago',
            status: 'pending',
            type: 'withdrawal'
        },
        {
            id: 3,
            user: 'Admin User',
            action: 'User Credit Added',
            amount: '$500',
            time: '1 hour ago',
            status: 'completed',
            type: 'credit'
        },
        {
            id: 4,
            user: 'Michael Chen',
            action: 'Account Verification',
            amount: 'KYC Approved',
            time: '2 hours ago',
            status: 'completed',
            type: 'verification'
        },
        {
            id: 5,
            user: 'Emily Davis',
            action: 'Dividend Payout',
            amount: '$850',
            time: '3 hours ago',
            status: 'completed',
            type: 'dividend'
        }
    ]

    const pendingTasks = [
        {
            id: 1,
            title: 'KYC Verification Pending',
            count: 23,
            priority: 'high',
            icon: AlertTriangle,
            color: 'text-red-500'
        },
        {
            id: 2,
            title: 'Withdrawal Approvals',
            count: 8,
            priority: 'medium',
            icon: Wallet,
            color: 'text-yellow-500'
        },
        {
            id: 3,
            title: 'Support Tickets',
            count: 15,
            priority: 'low',
            icon: CheckCircle,
            color: 'text-blue-500'
        }
    ]

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
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-gradient-to-r from-gold-500/10 to-blue-500/10 rounded-2xl p-6 border border-gold-500/20"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Welcome back, Admin</h2>
                        <p className="text-gray-300">Here's what's happening with your investment platform today.</p>
                    </div>
                    <div className="flex items-center space-x-2">
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
                {stats.map((stat, index) => (
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
                            <button
                                key={index}
                                className="p-4 bg-navy-800/50 rounded-xl border border-gold-500/20 hover:border-gold-500/40 transition-all duration-300 group"
                            >
                                <div className={`w-10 h-10 ${action.bgColor} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                    <action.icon className={`w-5 h-5 ${action.color}`} />
                                </div>
                                <p className="text-white font-medium text-sm mb-1">{action.title}</p>
                                <p className="text-gray-400 text-xs">{action.description}</p>
                            </button>
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
                        <button className="text-gold-500 hover:text-gold-400 transition-colors">
                            <Eye className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {recentActivities.slice(0, 5).map((activity) => (
                            <div key={activity.id} className="flex items-center justify-between p-3 rounded-xl bg-navy-800/30 hover:bg-navy-800/50 transition-colors">
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
                            </div>
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
                            <div key={task.id} className="flex items-center justify-between p-4 rounded-xl bg-navy-800/30 hover:bg-navy-800/50 transition-colors cursor-pointer">
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
                            </div>
                        ))}
                    </div>

                    {/* System Status */}
                    <div className="mt-6 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-green-400 font-medium text-sm">System Status: Online</span>
                            </div>
                            <span className="text-green-400 text-sm">99.9%</span>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">All services operational</p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default AdminOverview