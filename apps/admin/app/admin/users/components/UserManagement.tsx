'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Users,
    Search,
    Filter,
    Plus,
    MoreVertical,
    Edit,
    Trash2,
    UserCheck,
    UserX,
    Mail,
    Phone,
    Calendar,
    DollarSign,
    Shield,
    Eye,
    Download,
    RefreshCw
} from 'lucide-react'

// Mock user data
const mockUsers = [
    {
        id: 1,
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '+1 (555) 123-4567',
        status: 'active',
        balance: 15420.50,
        joinDate: '2024-01-15',
        lastLogin: '2024-10-01',
        investmentValue: 25000,
        kycStatus: 'verified',
        avatar: 'JS'
    },
    {
        id: 2,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+1 (555) 234-5678',
        status: 'active',
        balance: 8750.25,
        joinDate: '2024-02-20',
        lastLogin: '2024-09-30',
        investmentValue: 18500,
        kycStatus: 'verified',
        avatar: 'SJ'
    },
    {
        id: 3,
        name: 'Michael Chen',
        email: 'michael.chen@email.com',
        phone: '+1 (555) 345-6789',
        status: 'suspended',
        balance: 3200.75,
        joinDate: '2024-03-10',
        lastLogin: '2024-09-25',
        investmentValue: 8000,
        kycStatus: 'pending',
        avatar: 'MC'
    },
    {
        id: 4,
        name: 'Emily Davis',
        email: 'emily.davis@email.com',
        phone: '+1 (555) 456-7890',
        status: 'active',
        balance: 22100.00,
        joinDate: '2024-01-05',
        lastLogin: '2024-10-02',
        investmentValue: 45000,
        kycStatus: 'verified',
        avatar: 'ED'
    },
    {
        id: 5,
        name: 'Robert Wilson',
        email: 'robert.wilson@email.com',
        phone: '+1 (555) 567-8901',
        status: 'inactive',
        balance: 1200.30,
        joinDate: '2024-04-15',
        lastLogin: '2024-08-15',
        investmentValue: 5000,
        kycStatus: 'rejected',
        avatar: 'RW'
    }
]

const UserManagement = () => {
    const [users, setUsers] = useState(mockUsers)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [kycFilter, setKycFilter] = useState('all')
    const [selectedUsers, setSelectedUsers] = useState<number[]>([])
    const [showAddUser, setShowAddUser] = useState(false)

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter
        const matchesKyc = kycFilter === 'all' || user.kycStatus === kycFilter

        return matchesSearch && matchesStatus && matchesKyc
    })

    const getStatusBadge = (status: string) => {
        const badges = {
            active: 'bg-green-500/20 text-green-400 border-green-500/30',
            inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
            suspended: 'bg-red-500/20 text-red-400 border-red-500/30'
        }
        return badges[status as keyof typeof badges] || badges.inactive
    }

    const getKycBadge = (status: string) => {
        const badges = {
            verified: 'bg-green-500/20 text-green-400 border-green-500/30',
            pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            rejected: 'bg-red-500/20 text-red-400 border-red-500/30'
        }
        return badges[status as keyof typeof badges] || badges.pending
    }

    const handleUserAction = (action: string, userId: number) => {
        switch (action) {
            case 'edit':
                console.log('Edit user:', userId)
                break
            case 'delete':
                if (window.confirm('Are you sure you want to delete this user?')) {
                    setUsers(users.filter(user => user.id !== userId))
                }
                break
            case 'suspend':
                setUsers(users.map(user =>
                    user.id === userId ? { ...user, status: 'suspended' } : user
                ))
                break
            case 'activate':
                setUsers(users.map(user =>
                    user.id === userId ? { ...user, status: 'active' } : user
                ))
                break
            default:
                break
        }
    }

    const handleBulkAction = (action: string) => {
        if (selectedUsers.length === 0) return

        switch (action) {
            case 'delete':
                if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
                    setUsers(users.filter(user => !selectedUsers.includes(user.id)))
                    setSelectedUsers([])
                }
                break
            case 'suspend':
                setUsers(users.map(user =>
                    selectedUsers.includes(user.id) ? { ...user, status: 'suspended' } : user
                ))
                setSelectedUsers([])
                break
            case 'activate':
                setUsers(users.map(user =>
                    selectedUsers.includes(user.id) ? { ...user, status: 'active' } : user
                ))
                setSelectedUsers([])
                break
            default:
                break
        }
    }

    const toggleUserSelection = (userId: number) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const selectAllUsers = () => {
        if (selectedUsers.length === filteredUsers.length) {
            setSelectedUsers([])
        } else {
            setSelectedUsers(filteredUsers.map(user => user.id))
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-500/20"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">User Management</h2>
                        <p className="text-gray-300">Manage all user accounts and permissions</p>
                    </div>
                    <button
                        onClick={() => setShowAddUser(true)}
                        className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add New User</span>
                    </button>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
                <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{users.length}</p>
                            <p className="text-gray-400 text-sm">Total Users</p>
                        </div>
                    </div>
                </div>
                <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <UserCheck className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{users.filter(u => u.status === 'active').length}</p>
                            <p className="text-gray-400 text-sm">Active Users</p>
                        </div>
                    </div>
                </div>
                <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gold-500/20 rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-gold-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{users.filter(u => u.kycStatus === 'verified').length}</p>
                            <p className="text-gray-400 text-sm">KYC Verified</p>
                        </div>
                    </div>
                </div>
                <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">
                                ${users.reduce((sum, user) => sum + user.balance, 0).toLocaleString()}
                            </p>
                            <p className="text-gray-400 text-sm">Total Balance</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Controls */}
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
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-navy-800/50 border border-gold-500/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 bg-navy-800/50 border border-gold-500/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                        </select>

                        {/* KYC Filter */}
                        <select
                            value={kycFilter}
                            onChange={(e) => setKycFilter(e.target.value)}
                            className="px-4 py-2 bg-navy-800/50 border border-gold-500/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All KYC</option>
                            <option value="verified">Verified</option>
                            <option value="pending">Pending</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Bulk Actions */}
                        {selectedUsers.length > 0 && (
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-400">{selectedUsers.length} selected</span>
                                <button
                                    onClick={() => handleBulkAction('activate')}
                                    className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                                >
                                    Activate
                                </button>
                                <button
                                    onClick={() => handleBulkAction('suspend')}
                                    className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/30 transition-colors"
                                >
                                    Suspend
                                </button>
                                <button
                                    onClick={() => handleBulkAction('delete')}
                                    className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-navy-700/50 rounded-lg transition-colors">
                            <Download className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-navy-700/50 rounded-lg transition-colors">
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Users Table */}
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
                                <th className="px-6 py-4 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                        onChange={selectAllUsers}
                                        className="rounded border-gold-500/20 bg-navy-800/50 text-blue-500 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">KYC</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Balance</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Investment</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Join Date</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gold-500/10">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-navy-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={() => toggleUserSelection(user.id)}
                                            className="rounded border-gold-500/20 bg-navy-800/50 text-blue-500 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                                <span className="text-white font-semibold text-sm">{user.avatar}</span>
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{user.name}</p>
                                                <p className="text-gray-400 text-sm">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(user.status)}`}>
                                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getKycBadge(user.kycStatus)}`}>
                                            {user.kycStatus.charAt(0).toUpperCase() + user.kycStatus.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-white font-medium">${user.balance.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-white font-medium">${user.investmentValue.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-gray-400">{user.joinDate}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleUserAction('edit', user.id)}
                                                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleUserAction(user.status === 'active' ? 'suspend' : 'activate', user.id)}
                                                className={`p-2 rounded-lg transition-colors ${user.status === 'active'
                                                        ? 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10'
                                                        : 'text-gray-400 hover:text-green-400 hover:bg-green-500/10'
                                                    }`}
                                            >
                                                {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleUserAction('delete', user.id)}
                                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">No users found matching your criteria</p>
                    </div>
                )}
            </motion.div>
        </div>
    )
}

export default UserManagement