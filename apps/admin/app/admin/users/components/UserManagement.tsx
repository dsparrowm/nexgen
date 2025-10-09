'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api'
import { useToast } from '@/components/ToastContext'
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
    RefreshCw,
    AlertTriangle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'

interface User {
    id: string
    email: string
    username: string
    firstName: string | null
    lastName: string | null
    role: string
    isActive: boolean
    isVerified: boolean
    kycStatus: string
    balance: number
    totalInvested: number
    totalEarnings: number
    createdAt: string
    updatedAt: string
    _count: {
        investments: number
        transactions: number
        kycDocuments: number
    }
}

interface PaginationInfo {
    page: number
    limit: number
    total: number
    pages: number
}

const UserManagement = () => {
    const router = useRouter()
    const { addToast } = useToast()
    const [users, setUsers] = useState<User[]>([])
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
    })
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [kycFilter, setKycFilter] = useState('all')
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        kycVerified: 0,
        totalBalance: 0
    })

    // Fetch users from backend
    const fetchUsers = async (showRefreshIndicator = false) => {
        if (showRefreshIndicator) {
            setIsRefreshing(true)
        } else {
            setIsLoading(true)
        }
        setError(null)

        try {
            const params: any = {
                page: pagination.page,
                limit: pagination.limit
            }

            if (searchTerm) params.search = searchTerm
            if (statusFilter !== 'all') params.isActive = statusFilter === 'active'
            if (kycFilter !== 'all') params.kycStatus = kycFilter.toUpperCase()

            const response = await apiClient.getUsers(params)

            if (response.success && response.data) {
                setUsers(response.data.users)
                setPagination(response.data.pagination)

                // Calculate stats
                setStats({
                    totalUsers: response.data.pagination.total,
                    activeUsers: response.data.users.filter((u: User) => u.isActive).length,
                    kycVerified: response.data.users.filter((u: User) => u.kycStatus === 'VERIFIED').length,
                    totalBalance: response.data.users.reduce((sum: number, user: User) => sum + Number(user.balance), 0)
                })
            } else {
                setError(response.error?.message || 'Failed to load users')
            }
        } catch (err) {
            console.error('Error fetching users:', err)
            setError('An error occurred while loading users')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    // Initial fetch
    useEffect(() => {
        fetchUsers()
    }, [pagination.page, pagination.limit])

    // Debounced search
    useEffect(() => {
        const debounce = setTimeout(() => {
            if (pagination.page === 1) {
                fetchUsers()
            } else {
                setPagination(prev => ({ ...prev, page: 1 }))
            }
        }, 500)

        return () => clearTimeout(debounce)
    }, [searchTerm, statusFilter, kycFilter])

    const getUserInitials = (user: User) => {
        const first = user.firstName?.charAt(0) || user.username.charAt(0)
        const last = user.lastName?.charAt(0) || user.username.charAt(1) || ''
        return (first + last).toUpperCase()
    }

    const getUserDisplayName = (user: User) => {
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`
        }
        return user.username
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && user.isActive) ||
            (statusFilter === 'inactive' && !user.isActive)
        const matchesKyc = kycFilter === 'all' || user.kycStatus.toLowerCase() === kycFilter

        return matchesSearch && matchesStatus && matchesKyc
    })

    const getStatusBadge = (user: User) => {
        if (user.isActive) {
            return 'bg-green-500/20 text-green-400 border-green-500/30'
        }
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }

    const getKycBadge = (status: string) => {
        const badges: Record<string, string> = {
            VERIFIED: 'bg-green-500/20 text-green-400 border-green-500/30',
            PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30'
        }
        return badges[status] || badges.PENDING
    }

    const handleUserAction = async (action: string, userId: string) => {
        try {
            switch (action) {
                case 'edit':
                    router.push(`/admin/users/${userId}/edit`)
                    break
                case 'view':
                    router.push(`/admin/users/${userId}`)
                    break
                case 'delete':
                    await handleDeleteUser(userId)
                    break
                case 'suspend':
                    await handleToggleUserStatus(userId, false)
                    break
                case 'activate':
                    await handleToggleUserStatus(userId, true)
                    break
                default:
                    break
            }
        } catch (error) {
            console.error('Error handling user action:', error)
        }
    }

    const handleDeleteUser = async (userId: string) => {
        const user = users.find(u => u.id === userId)
        if (!user) return

        const confirmed = window.confirm(
            `Are you sure you want to delete ${getUserDisplayName(user)}?\n\nThis action cannot be undone.`
        )

        if (!confirmed) return

        try {
            const response = await apiClient.deleteUser(userId)

            if (response.success) {
                // Remove user from local state
                setUsers(users.filter(u => u.id !== userId))
                setSelectedUsers(selectedUsers.filter(id => id !== userId))

                // Update stats
                setStats(prev => ({
                    ...prev,
                    totalUsers: prev.totalUsers - 1,
                    activeUsers: user.isActive ? prev.activeUsers - 1 : prev.activeUsers,
                    kycVerified: user.kycStatus === 'VERIFIED' ? prev.kycVerified - 1 : prev.kycVerified,
                    totalBalance: prev.totalBalance - Number(user.balance)
                }))

                // Show success message
                addToast('success', 'User deleted successfully')
            } else {
                addToast('error', 'Failed to delete user', response.error?.message)
            }
        } catch (error) {
            console.error('Delete user error:', error)
            addToast('error', 'An error occurred while deleting the user')
        }
    }

    const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
        const user = users.find(u => u.id === userId)
        if (!user) return

        const action = isActive ? 'activate' : 'suspend'
        const confirmed = window.confirm(
            `Are you sure you want to ${action} ${getUserDisplayName(user)}?`
        )

        if (!confirmed) return

        try {
            const response = await apiClient.updateUser(userId, { isActive })

            if (response.success) {
                // Update user in local state
                setUsers(users.map(u =>
                    u.id === userId ? { ...u, isActive } : u
                ))

                // Update stats
                setStats(prev => ({
                    ...prev,
                    activeUsers: isActive
                        ? prev.activeUsers + 1
                        : prev.activeUsers - 1
                }))

                // Show success message
                addToast('success', `User ${action}d successfully`)
            } else {
                addToast('error', `Failed to ${action} user`, response.error?.message)
            }
        } catch (error) {
            console.error(`Toggle user status error:`, error)
            addToast('error', `An error occurred while ${action}ing the user`)
        }
    }

    const handleBulkAction = async (action: string) => {
        if (selectedUsers.length === 0) return

        const confirmed = window.confirm(
            `Are you sure you want to ${action} ${selectedUsers.length} selected user(s)?`
        )

        if (!confirmed) return

        try {
            let successCount = 0
            let failCount = 0

            for (const userId of selectedUsers) {
                try {
                    let response
                    switch (action) {
                        case 'delete':
                            response = await apiClient.deleteUser(userId)
                            break
                        case 'activate':
                            response = await apiClient.updateUser(userId, { isActive: true })
                            break
                        case 'suspend':
                            response = await apiClient.updateUser(userId, { isActive: false })
                            break
                        default:
                            continue
                    }

                    if (response.success) {
                        successCount++
                    } else {
                        failCount++
                    }
                } catch (error) {
                    failCount++
                    console.error(`Error ${action}ing user ${userId}:`, error)
                }
            }

            // Refresh the list after bulk operations
            await fetchUsers(true)

            // Clear selection
            setSelectedUsers([])

            // Show result
            if (failCount === 0) {
                addToast('success', `Successfully ${action}d ${successCount} user(s)`)
            } else {
                addToast('warning', `${action} completed: ${successCount} succeeded, ${failCount} failed`)
            }
        } catch (error) {
            console.error('Bulk action error:', error)
            addToast('error', 'An error occurred during bulk operation')
        }
    }

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const selectAllUsers = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([])
        } else {
            setSelectedUsers(users.map(user => user.id))
        }
    }

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }))
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
                        onClick={() => router.push('/admin/users/add')}
                        className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add New User</span>
                    </button>
                </div>
            </motion.div>

            {/* Error State */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
                            <p className="text-red-500">{error}</p>
                        </div>
                        <button
                            onClick={() => fetchUsers()}
                            className="text-red-500 hover:text-red-400 transition-colors"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </motion.div>
            )}

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
                            {isLoading ? (
                                <div className="h-8 w-16 bg-navy-700/50 rounded animate-pulse"></div>
                            ) : (
                                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                            )}
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
                            {isLoading ? (
                                <div className="h-8 w-16 bg-navy-700/50 rounded animate-pulse"></div>
                            ) : (
                                <p className="text-2xl font-bold text-white">{stats.activeUsers}</p>
                            )}
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
                            {isLoading ? (
                                <div className="h-8 w-16 bg-navy-700/50 rounded animate-pulse"></div>
                            ) : (
                                <p className="text-2xl font-bold text-white">{stats.kycVerified}</p>
                            )}
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
                            {isLoading ? (
                                <div className="h-8 w-20 bg-navy-700/50 rounded animate-pulse"></div>
                            ) : (
                                <p className="text-2xl font-bold text-white">
                                    ${stats.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            )}
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
                        <button
                            onClick={() => fetchUsers(true)}
                            disabled={isRefreshing}
                            className="p-2 text-gray-400 hover:text-white hover:bg-navy-700/50 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-navy-700/50 rounded-lg transition-colors">
                            <Download className="w-5 h-5" />
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
                {/* Loading State */}
                {isLoading && !isRefreshing ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mb-4"></div>
                            <p className="text-gray-400">Loading users...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-navy-800/50 border-b border-gold-500/20">
                                    <tr>
                                        <th className="px-6 py-4 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.length === users.length && users.length > 0}
                                                onChange={selectAllUsers}
                                                className="rounded border-gold-500/20 bg-navy-800/50 text-blue-500 focus:ring-blue-500"
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">KYC</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Balance</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Invested</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Join Date</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gold-500/10">
                                    {users.map((user) => (
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
                                                        <span className="text-white font-semibold text-sm">{getUserInitials(user)}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium">{getUserDisplayName(user)}</p>
                                                        <p className="text-gray-400 text-sm">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(user)}`}>
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getKycBadge(user.kycStatus)}`}>
                                                    {user.kycStatus.charAt(0) + user.kycStatus.slice(1).toLowerCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-white font-medium">${Number(user.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-white font-medium">${Number(user.totalInvested).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-400">{formatDate(user.createdAt)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleUserAction('view', user.id)}
                                                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleUserAction('edit', user.id)}
                                                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                        title="Edit User"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleUserAction(user.isActive ? 'suspend' : 'activate', user.id)}
                                                        className={`p-2 rounded-lg transition-colors ${user.isActive
                                                            ? 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10'
                                                            : 'text-gray-400 hover:text-green-400 hover:bg-green-500/10'
                                                            }`}
                                                        title={user.isActive ? 'Suspend User' : 'Activate User'}
                                                    >
                                                        {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleUserAction('delete', user.id)}
                                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Delete User"
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

                        {users.length === 0 && !isLoading && (
                            <div className="text-center py-12">
                                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-400">No users found matching your criteria</p>
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="border-t border-gold-500/20 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-400">
                                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handlePageChange(pagination.page - 1)}
                                            disabled={pagination.page === 1}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-navy-700/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>

                                        {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                                            let pageNum;
                                            if (pagination.pages <= 5) {
                                                pageNum = i + 1;
                                            } else if (pagination.page <= 3) {
                                                pageNum = i + 1;
                                            } else if (pagination.page >= pagination.pages - 2) {
                                                pageNum = pagination.pages - 4 + i;
                                            } else {
                                                pageNum = pagination.page - 2 + i;
                                            }

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`px-3 py-1 rounded-lg transition-colors ${pagination.page === pageNum
                                                        ? 'bg-blue-500 text-white'
                                                        : 'text-gray-400 hover:text-white hover:bg-navy-700/50'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}

                                        <button
                                            onClick={() => handlePageChange(pagination.page + 1)}
                                            disabled={pagination.page === pagination.pages}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-navy-700/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </motion.div>
        </div>
    )
}

export default UserManagement