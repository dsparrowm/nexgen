'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../../components/AdminLayout'
import { useToast } from '@/components/ToastContext'
import {
    ArrowLeft,
    Mail,
    Phone,
    Calendar,
    DollarSign,
    TrendingUp,
    Shield,
    User,
    Edit,
    Ban,
    CheckCircle,
    AlertTriangle,
    CreditCard,
    FileText,
    Activity
} from 'lucide-react'

interface UserDetails {
    id: string
    email: string
    username: string
    firstName: string | null
    lastName: string | null
    role: string
    isActive: boolean
    isVerified: boolean
    isEmailVerified: boolean
    kycStatus: string
    balance: number
    totalInvested: number
    totalEarnings: number
    referralCode: string
    phoneNumber: string | null
    country: string | null
    createdAt: string
    updatedAt: string
    _count: {
        investments: number
        transactions: number
        kycDocuments: number
        referrals: number
    }
}

const UserDetailsPage = () => {
    const router = useRouter()
    const params = useParams()
    const userId = params?.userId as string
    const { addToast } = useToast()

    const [user, setUser] = useState<UserDetails | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (userId) {
            fetchUserDetails()
        }
    }, [userId])

    const fetchUserDetails = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await apiClient.getUserById(userId)

            if (response.success && response.data) {
                setUser(response.data.user)
            } else {
                setError(response.error?.message || 'Failed to load user details')
            }
        } catch (err) {
            console.error('Error fetching user details:', err)
            setError('An error occurred while loading user details')
        } finally {
            setIsLoading(false)
        }
    }

    const getUserDisplayName = () => {
        if (!user) return 'User'
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`
        }
        return user.username
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getKycStatusColor = (status: string) => {
        switch (status) {
            case 'VERIFIED':
                return 'text-green-400 bg-green-500/10 border-green-500/30'
            case 'PENDING':
                return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
            case 'REJECTED':
                return 'text-red-400 bg-red-500/10 border-red-500/30'
            default:
                return 'text-gray-400 bg-gray-500/10 border-gray-500/30'
        }
    }

    const handleToggleStatus = async () => {
        if (!user) return

        const newStatus = !user.isActive
        const action = newStatus ? 'activate' : 'suspend'

        if (!window.confirm(`Are you sure you want to ${action} this user?`)) return

        try {
            const response = await apiClient.updateUser(userId, { isActive: newStatus })

            if (response.success) {
                setUser({ ...user, isActive: newStatus })
                addToast('success', `User ${action}d successfully`)
            } else {
                addToast('error', `Failed to ${action} user`, response.error?.message)
            }
        } catch (error) {
            console.error('Toggle status error:', error)
            addToast('error', `An error occurred while ${action}ing the user`)
        }
    }

    return (
        <ProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.push('/admin/users')}
                                className="p-2 text-gray-400 hover:text-white hover:bg-navy-700/50 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-white">User Details</h1>
                                <p className="text-gray-400">View and manage user information</p>
                            </div>
                        </div>
                        {user && (
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => router.push(`/admin/users/${userId}/edit`)}
                                    className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                    <span>Edit User</span>
                                </button>
                                <button
                                    onClick={handleToggleStatus}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${user.isActive
                                        ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                        }`}
                                >
                                    {user.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                    <span>{user.isActive ? 'Suspend' : 'Activate'}</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mb-4"></div>
                                <p className="text-gray-400">Loading user details...</p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                            <div className="flex items-center">
                                <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
                                <div>
                                    <h3 className="text-lg font-semibold text-red-500">Error Loading User</h3>
                                    <p className="text-red-400 mt-1">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* User Details */}
                    {user && !isLoading && (
                        <>
                            {/* Profile Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-blue-500/20"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-6">
                                        <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center">
                                            <span className="text-white font-bold text-3xl">
                                                {user.firstName?.charAt(0) || user.username.charAt(0)}
                                                {user.lastName?.charAt(0) || user.username.charAt(1) || ''}
                                            </span>
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold text-white mb-2">{getUserDisplayName()}</h2>
                                            <div className="flex items-center space-x-4 text-gray-300">
                                                <div className="flex items-center space-x-2">
                                                    <Mail className="w-4 h-4" />
                                                    <span>{user.email}</span>
                                                </div>
                                                {user.phoneNumber && (
                                                    <div className="flex items-center space-x-2">
                                                        <Phone className="w-4 h-4" />
                                                        <span>{user.phoneNumber}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-3 mt-3">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${user.isActive
                                                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                                    }`}>
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getKycStatusColor(user.kycStatus)}`}>
                                                    KYC: {user.kycStatus}
                                                </span>
                                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-400 border-purple-500/30">
                                                    {user.role}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20"
                                >
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                            <DollarSign className="w-6 h-6 text-green-500" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-white">
                                        ${Number(user.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-gray-400 text-sm">Current Balance</p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20"
                                >
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                            <TrendingUp className="w-6 h-6 text-blue-500" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-white">
                                        ${Number(user.totalInvested).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-gray-400 text-sm">Total Invested</p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20"
                                >
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-12 h-12 bg-gold-500/20 rounded-xl flex items-center justify-center">
                                            <CreditCard className="w-6 h-6 text-gold-500" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-white">
                                        ${Number(user.totalEarnings).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-gray-400 text-sm">Total Earnings</p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20"
                                >
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                            <Activity className="w-6 h-6 text-purple-500" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{user._count.investments}</p>
                                    <p className="text-gray-400 text-sm">Active Investments</p>
                                </motion.div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Account Information */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20"
                                >
                                    <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                                        <User className="w-5 h-5 mr-2 text-gold-500" />
                                        Account Information
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-gray-400 text-sm">Username</p>
                                            <p className="text-white font-medium">{user.username}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Email</p>
                                            <p className="text-white font-medium">{user.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Role</p>
                                            <p className="text-white font-medium">{user.role}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Referral Code</p>
                                            <p className="text-white font-medium font-mono">{user.referralCode}</p>
                                        </div>
                                        {user.country && (
                                            <div>
                                                <p className="text-gray-400 text-sm">Country</p>
                                                <p className="text-white font-medium">{user.country}</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Account Status */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20"
                                >
                                    <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                                        <Shield className="w-5 h-5 mr-2 text-gold-500" />
                                        Account Status
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-gray-400">Account Active</p>
                                            <p className={`font-medium ${user.isActive ? 'text-green-400' : 'text-red-400'}`}>
                                                {user.isActive ? 'Yes' : 'No'}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-gray-400">Email Verified</p>
                                            <p className={`font-medium ${user.isEmailVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                                                {user.isEmailVerified ? 'Yes' : 'No'}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-gray-400">KYC Status</p>
                                            <p className="font-medium text-white">{user.kycStatus}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-gray-400">KYC Documents</p>
                                            <p className="font-medium text-white">{user._count.kycDocuments}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-gray-400">Total Transactions</p>
                                            <p className="font-medium text-white">{user._count.transactions}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-gray-400">Referrals</p>
                                            <p className="font-medium text-white">{user._count.referrals}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Timestamps */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20"
                            >
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                                    <Calendar className="w-5 h-5 mr-2 text-gold-500" />
                                    Timeline
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-gray-400 text-sm mb-1">Member Since</p>
                                        <p className="text-white font-medium">{formatDate(user.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm mb-1">Last Updated</p>
                                        <p className="text-white font-medium">{formatDate(user.updatedAt)}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </div>
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default UserDetailsPage
