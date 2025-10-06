'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../../../components/AdminLayout'
import {
    ArrowLeft,
    Save,
    X,
    User,
    Mail,
    Phone,
    MapPin,
    Shield,
    DollarSign,
    CheckCircle,
    AlertCircle,
    Loader
} from 'lucide-react'

interface UserData {
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
    phoneNumber: string | null
    country: string | null
    state: string | null
    city: string | null
    address: string | null
    zipCode: string | null
}

interface FormData {
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    country: string
    state: string
    city: string
    address: string
    zipCode: string
    role: string
    isActive: boolean
    isVerified: boolean
    kycStatus: string
    balance: string
}

const EditUserPage = () => {
    const router = useRouter()
    const params = useParams()
    const userId = params?.userId as string

    const [user, setUser] = useState<UserData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        country: '',
        state: '',
        city: '',
        address: '',
        zipCode: '',
        role: 'USER',
        isActive: true,
        isVerified: false,
        kycStatus: 'PENDING',
        balance: '0'
    })

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
                const userData = response.data.user
                setUser(userData)

                // Populate form with user data
                setFormData({
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    email: userData.email || '',
                    phoneNumber: userData.phoneNumber || '',
                    country: userData.country || '',
                    state: userData.state || '',
                    city: userData.city || '',
                    address: userData.address || '',
                    zipCode: userData.zipCode || '',
                    role: userData.role || 'USER',
                    isActive: userData.isActive ?? true,
                    isVerified: userData.isVerified ?? false,
                    kycStatus: userData.kycStatus || 'PENDING',
                    balance: userData.balance?.toString() || '0'
                })
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked
            setFormData(prev => ({ ...prev, [name]: checked }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setError(null)
        setSuccessMessage(null)

        try {
            // Prepare data for API
            const updateData: any = {
                firstName: formData.firstName || null,
                lastName: formData.lastName || null,
                phoneNumber: formData.phoneNumber || null,
                country: formData.country || null,
                state: formData.state || null,
                city: formData.city || null,
                address: formData.address || null,
                zipCode: formData.zipCode || null,
                role: formData.role,
                isActive: formData.isActive,
                isVerified: formData.isVerified,
                kycStatus: formData.kycStatus,
                balance: parseFloat(formData.balance) || 0
            }

            const response = await apiClient.updateUser(userId, updateData)

            if (response.success) {
                setSuccessMessage('User updated successfully!')

                // Redirect after 1.5 seconds
                setTimeout(() => {
                    router.push(`/admin/users/${userId}`)
                }, 1500)
            } else {
                setError(response.error?.message || 'Failed to update user')
            }
        } catch (err) {
            console.error('Error updating user:', err)
            setError('An error occurred while updating the user')
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        router.push(`/admin/users/${userId}`)
    }

    if (isLoading) {
        return (
            <ProtectedRoute>
                <AdminLayout>
                    <div className="flex items-center justify-center min-h-[600px]">
                        <div className="text-center">
                            <Loader className="w-12 h-12 text-gold-500 animate-spin mx-auto mb-4" />
                            <p className="text-gray-400">Loading user details...</p>
                        </div>
                    </div>
                </AdminLayout>
            </ProtectedRoute>
        )
    }

    if (error && !user) {
        return (
            <ProtectedRoute>
                <AdminLayout>
                    <div className="flex items-center justify-center min-h-[600px]">
                        <div className="text-center">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <p className="text-xl text-white mb-2">Error Loading User</p>
                            <p className="text-gray-400 mb-6">{error}</p>
                            <button
                                onClick={() => router.push('/admin/users')}
                                className="px-6 py-2 bg-gold-500 text-dark-900 rounded-lg hover:bg-gold-600 transition-colors"
                            >
                                Back to Users
                            </button>
                        </div>
                    </div>
                </AdminLayout>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute>
            <AdminLayout>
                <div className="p-8 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleCancel}
                                className="p-2 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors border border-gold-500/20"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-400" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-white">Edit User</h1>
                                <p className="text-gray-400 mt-1">Update user information</p>
                            </div>
                        </div>
                    </div>

                    {/* Success Message */}
                    {successMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-center space-x-3"
                        >
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <p className="text-green-400">{successMessage}</p>
                        </motion.div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center space-x-3"
                        >
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            <p className="text-red-400">{error}</p>
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20"
                        >
                            <div className="flex items-center space-x-3 mb-6">
                                <User className="w-6 h-6 text-gold-500" />
                                <h2 className="text-xl font-semibold text-white">Personal Information</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-navy-800/50 border border-gold-500/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                                        placeholder="Enter first name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-navy-800/50 border border-gold-500/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                                        placeholder="Enter last name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        value={user?.username || ''}
                                        disabled
                                        className="w-full px-4 py-2 bg-navy-900/50 border border-gold-500/10 rounded-lg text-gray-500 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full px-4 py-2 bg-navy-900/50 border border-gold-500/10 rounded-lg text-gray-500 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Contact Information */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20"
                        >
                            <div className="flex items-center space-x-3 mb-6">
                                <Phone className="w-6 h-6 text-gold-500" />
                                <h2 className="text-xl font-semibold text-white">Contact Information</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-navy-800/50 border border-gold-500/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                                        placeholder="Enter phone number"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-navy-800/50 border border-gold-500/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                                        placeholder="Enter country"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        State/Province
                                    </label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-navy-800/50 border border-gold-500/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                                        placeholder="Enter state/province"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-navy-800/50 border border-gold-500/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                                        placeholder="Enter city"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-navy-800/50 border border-gold-500/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                                        placeholder="Enter address"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        ZIP/Postal Code
                                    </label>
                                    <input
                                        type="text"
                                        name="zipCode"
                                        value={formData.zipCode}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-navy-800/50 border border-gold-500/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                                        placeholder="Enter ZIP/postal code"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Account Settings */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20"
                        >
                            <div className="flex items-center space-x-3 mb-6">
                                <Shield className="w-6 h-6 text-gold-500" />
                                <h2 className="text-xl font-semibold text-white">Account Settings</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Role
                                    </label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-navy-800/50 border border-gold-500/20 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                                    >
                                        <option value="USER">User</option>
                                        <option value="ADMIN">Admin</option>
                                        <option value="SUPER_ADMIN">Super Admin</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        KYC Status
                                    </label>
                                    <select
                                        name="kycStatus"
                                        value={formData.kycStatus}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-navy-800/50 border border-gold-500/20 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="VERIFIED">Verified</option>
                                        <option value="REJECTED">Rejected</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Balance ($)
                                    </label>
                                    <input
                                        type="number"
                                        name="balance"
                                        value={formData.balance}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="0"
                                        className="w-full px-4 py-2 bg-navy-800/50 border border-gold-500/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={formData.isActive}
                                            onChange={handleInputChange}
                                            className="w-5 h-5 bg-navy-800/50 border border-gold-500/20 rounded text-gold-500 focus:ring-2 focus:ring-gold-500"
                                        />
                                        <label className="text-sm font-medium text-gray-300">
                                            Account Active
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            name="isVerified"
                                            checked={formData.isVerified}
                                            onChange={handleInputChange}
                                            className="w-5 h-5 bg-navy-800/50 border border-gold-500/20 rounded text-gold-500 focus:ring-2 focus:ring-gold-500"
                                        />
                                        <label className="text-sm font-medium text-gray-300">
                                            Account Verified
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Form Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex justify-end space-x-4"
                        >
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isSaving}
                                className="px-6 py-3 bg-dark-800 text-gray-300 rounded-lg hover:bg-dark-700 transition-colors border border-gold-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                <X className="w-5 h-5" />
                                <span>Cancel</span>
                            </button>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-6 py-3 bg-gold-500 text-dark-900 rounded-lg hover:bg-gold-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader className="w-5 h-5 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </form>
                </div>
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default EditUserPage
