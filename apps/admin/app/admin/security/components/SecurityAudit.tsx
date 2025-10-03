'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Shield,
    Activity,
    UserCheck,
    AlertTriangle,
    CheckCircle,
    Clock,
    Eye,
    Lock,
    Server,
    Key,
    Search,
    Download,
    Filter
} from 'lucide-react'

const SecurityAudit = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedFilter, setSelectedFilter] = useState('all')

    const securityMetrics = [
        {
            title: 'Login Attempts',
            value: '1,247',
            status: 'success',
            description: 'Last 24 hours',
            icon: UserCheck,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10'
        },
        {
            title: 'Failed Logins',
            value: '23',
            status: 'warning',
            description: 'Requires attention',
            icon: AlertTriangle,
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-500/10'
        },
        {
            title: 'Active Sessions',
            value: '847',
            status: 'info',
            description: 'Currently online',
            icon: Activity,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10'
        },
        {
            title: 'Blocked IPs',
            value: '12',
            status: 'danger',
            description: 'Suspicious activity',
            icon: Shield,
            color: 'text-red-500',
            bgColor: 'bg-red-500/10'
        }
    ]

    // Mock audit log data - will be fetched from API
    const auditLogs = [
        {
            id: '1',
            action: 'ADMIN_LOGIN',
            admin: 'Admin User',
            resource: 'Authentication',
            ipAddress: '192.168.1.1',
            timestamp: new Date(Date.now() - 1000 * 60 * 5),
            status: 'success',
            details: 'Successful admin login'
        },
        {
            id: '2',
            action: 'USER_UPDATED',
            admin: 'Admin User',
            resource: 'User Management',
            ipAddress: '192.168.1.1',
            timestamp: new Date(Date.now() - 1000 * 60 * 15),
            status: 'success',
            details: 'Updated user profile: john@example.com'
        },
        {
            id: '3',
            action: 'CREDIT_ADDED',
            admin: 'Super Admin',
            resource: 'Credit Management',
            ipAddress: '192.168.1.5',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            status: 'success',
            details: 'Added $500 credits to user account'
        },
        {
            id: '4',
            action: 'LOGIN_FAILED',
            admin: 'Unknown',
            resource: 'Authentication',
            ipAddress: '45.123.45.67',
            timestamp: new Date(Date.now() - 1000 * 60 * 45),
            status: 'failure',
            details: 'Failed login attempt - invalid credentials'
        },
        {
            id: '5',
            action: 'SETTINGS_CHANGED',
            admin: 'Super Admin',
            resource: 'System Settings',
            ipAddress: '192.168.1.5',
            timestamp: new Date(Date.now() - 1000 * 60 * 60),
            status: 'success',
            details: 'Updated platform settings'
        }
    ]

    const formatRelativeTime = (date: Date): string => {
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="w-4 h-4 text-green-500" />
            case 'failure':
                return <AlertTriangle className="w-4 h-4 text-red-500" />
            default:
                return <Clock className="w-4 h-4 text-yellow-500" />
        }
    }

    const getActionBadgeColor = (action: string) => {
        if (action.includes('LOGIN')) return 'bg-blue-500/20 text-blue-400'
        if (action.includes('CREDIT')) return 'bg-green-500/20 text-green-400'
        if (action.includes('USER')) return 'bg-purple-500/20 text-purple-400'
        if (action.includes('SETTINGS')) return 'bg-gold-500/20 text-gold-400'
        if (action.includes('FAILED')) return 'bg-red-500/20 text-red-400'
        return 'bg-gray-500/20 text-gray-400'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Security & Audit</h1>
                    <p className="text-gray-400">Monitor system security and audit administrative actions</p>
                </div>

                <button className="btn-primary flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    <span>Export Logs</span>
                </button>
            </div>

            {/* Security Metrics */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {securityMetrics.map((metric, index) => {
                    const Icon = metric.icon
                    return (
                        <div
                            key={index}
                            className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20 hover:border-gold-500/40 transition-all"
                        >
                            <div className={`w-12 h-12 ${metric.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                                <Icon className={`w-6 h-6 ${metric.color}`} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">{metric.value}</h3>
                            <p className="text-gray-400 text-sm font-medium">{metric.title}</p>
                            <p className="text-gray-500 text-xs mt-1">{metric.description}</p>
                        </div>
                    )
                })}
            </motion.div>

            {/* Audit Logs */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl border border-gold-500/20"
            >
                <div className="p-6 border-b border-gold-500/20">
                    <h3 className="text-xl font-bold text-white mb-4">Audit Logs</h3>

                    {/* Search and Filter */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500/40"
                            />
                        </div>
                        <select
                            value={selectedFilter}
                            onChange={(e) => setSelectedFilter(e.target.value)}
                            className="px-4 py-2 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white focus:outline-none focus:border-gold-500/40"
                        >
                            <option value="all">All Actions</option>
                            <option value="login">Login Events</option>
                            <option value="user">User Actions</option>
                            <option value="credit">Credit Actions</option>
                            <option value="settings">Settings Changes</option>
                        </select>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gold-500/20">
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Timestamp
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Action
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Admin
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    IP Address
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Details
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gold-500/10">
                            {auditLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-navy-800/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-300">
                                            <Clock className="w-4 h-4 mr-2 text-gray-500" />
                                            {formatRelativeTime(log.timestamp)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${getActionBadgeColor(log.action)}`}>
                                            {log.action.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {log.admin}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                                        {log.ipAddress}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusIcon(log.status)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-400">
                                        {log.details}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gold-500/20 flex items-center justify-between">
                    <p className="text-sm text-gray-400">
                        Showing <span className="text-white font-medium">1-5</span> of <span className="text-white font-medium">127</span> logs
                    </p>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 bg-navy-800/50 border border-gold-500/20 rounded-lg text-gray-400 hover:text-white hover:border-gold-500/40 transition-colors">
                            Previous
                        </button>
                        <button className="px-3 py-1 bg-gold-500 text-navy-900 rounded-lg font-medium">
                            1
                        </button>
                        <button className="px-3 py-1 bg-navy-800/50 border border-gold-500/20 rounded-lg text-gray-400 hover:text-white hover:border-gold-500/40 transition-colors">
                            2
                        </button>
                        <button className="px-3 py-1 bg-navy-800/50 border border-gold-500/20 rounded-lg text-gray-400 hover:text-white hover:border-gold-500/40 transition-colors">
                            Next
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Info Note */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="bg-gold-500/10 border border-gold-500/20 rounded-xl p-4"
            >
                <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-gold-500 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-gold-400 mb-1">Audit Log Integration</h4>
                        <p className="text-xs text-gray-400">
                            Currently showing mock data. Backend integration will fetch real audit logs from the database with full filtering and pagination support.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default SecurityAudit
