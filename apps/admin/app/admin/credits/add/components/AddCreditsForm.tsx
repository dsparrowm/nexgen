'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import {
    DollarSign,
    Search,
    User,
    Mail,
    Check,
    ArrowLeft,
    AlertCircle,
    Loader2,
    FileText
} from 'lucide-react'

interface UserSearchResult {
    id: string
    email: string
    username: string
    firstName: string
    lastName: string
    balance: number
}

const AddCreditsForm = () => {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
    const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
    const [showResults, setShowResults] = useState(false)

    const [formData, setFormData] = useState({
        amount: '',
        reason: '',
        reference: ''
    })

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

    // Search for users
    useEffect(() => {
        const searchUsers = async () => {
            if (searchQuery.length < 2) {
                setSearchResults([])
                return
            }

            setIsSearching(true)
            try {
                const response = await apiClient.getUsers({
                    page: 1,
                    limit: 5,
                    search: searchQuery
                })

                if (response.success && response.data) {
                    // Transform balance to number since it comes as string from Prisma Decimal
                    const transformedUsers = response.data.users.map((user: any) => ({
                        ...user,
                        balance: Number(user.balance)
                    }))
                    setSearchResults(transformedUsers)
                    setShowResults(true)
                }
            } catch (err) {
                console.error('Error searching users:', err)
            } finally {
                setIsSearching(false)
            }
        }

        const debounce = setTimeout(searchUsers, 300)
        return () => clearTimeout(debounce)
    }, [searchQuery])

    const handleUserSelect = (user: UserSearchResult) => {
        setSelectedUser(user)
        setSearchQuery(`${user.firstName} ${user.lastName} (${user.email})`)
        setShowResults(false)
        setError(null)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))

        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: ''
            }))
        }
    }

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {}

        if (!selectedUser) {
            errors.user = 'Please select a user'
        }

        if (!formData.amount) {
            errors.amount = 'Amount is required'
        } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
            errors.amount = 'Please enter a valid positive amount'
        }

        if (!formData.reason) {
            errors.reason = 'Reason is required'
        } else if (formData.reason.length < 10) {
            errors.reason = 'Please provide a detailed reason (minimum 10 characters)'
        }

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!validateForm()) return

        setIsLoading(true)

        try {
            const response = await apiClient.addCredits(selectedUser!.id, {
                amount: Number(formData.amount),
                reason: formData.reason,
                reference: formData.reference || undefined
            })

            if (response.success) {
                setSuccess(true)
                setTimeout(() => {
                    router.push('/admin/credits')
                }, 2000)
            } else {
                setError(response.error?.message || 'Failed to add credits')
            }
        } catch (err) {
            console.error('Error adding credits:', err)
            setError('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center min-h-[400px]"
            >
                <div className="text-center">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Credits Added Successfully!</h2>
                    <p className="text-gray-400">Redirecting to credits management...</p>
                </div>
            </motion.div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-navy-700/50 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Add Credits</h1>
                    <p className="text-gray-400">Add credits to a user account</p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
                >
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                </motion.div>
            )}

            {/* Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* User Search */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-gold-500" />
                            Select User
                        </h3>
                        <div className="relative">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value)
                                        if (!e.target.value) {
                                            setSelectedUser(null)
                                        }
                                    }}
                                    onFocus={() => searchResults.length > 0 && setShowResults(true)}
                                    className={`w-full pl-12 pr-4 py-3 bg-navy-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500/40 transition-colors ${fieldErrors.user ? 'border-red-500/50' : 'border-gold-500/20'
                                        }`}
                                    placeholder="Search by name, email, or username..."
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gold-500 animate-spin" />
                                )}
                            </div>

                            {/* Search Results Dropdown */}
                            <AnimatePresence>
                                {showResults && searchResults.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute z-10 w-full mt-2 bg-navy-800 border border-gold-500/30 rounded-xl shadow-xl overflow-hidden"
                                    >
                                        {searchResults.map((user) => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => handleUserSelect(user)}
                                                className="w-full px-4 py-3 text-left hover:bg-gold-500/10 transition-colors border-b border-gold-500/10 last:border-0"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-white font-medium">
                                                            {user.firstName} {user.lastName}
                                                        </p>
                                                        <p className="text-sm text-gray-400">{user.email}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-gold-500 font-medium">
                                                            ${Number(user.balance).toFixed(2)}
                                                        </p>
                                                        <p className="text-xs text-gray-500">Current Balance</p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {fieldErrors.user && (
                                <p className="mt-1 text-sm text-red-400">{fieldErrors.user}</p>
                            )}
                        </div>

                        {/* Selected User Card */}
                        {selectedUser && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-4 bg-gold-500/10 border border-gold-500/30 rounded-xl"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gold-500/20 rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6 text-gold-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-semibold">
                                            {selectedUser.firstName} {selectedUser.lastName}
                                        </p>
                                        <p className="text-sm text-gray-400 flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            {selectedUser.email}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-gold-500">
                                            ${Number(selectedUser.balance).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-400">Current Balance</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Credit Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-gold-500" />
                            Credit Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Amount (USD) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="0"
                                        className={`w-full pl-12 pr-4 py-3 bg-navy-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500/40 transition-colors ${fieldErrors.amount ? 'border-red-500/50' : 'border-gold-500/20'
                                            }`}
                                        placeholder="100.00"
                                    />
                                </div>
                                {fieldErrors.amount && (
                                    <p className="mt-1 text-sm text-red-400">{fieldErrors.amount}</p>
                                )}
                                {selectedUser && formData.amount && (
                                    <p className="mt-2 text-sm text-gray-400">
                                        New balance will be:
                                        <span className="text-gold-500 font-semibold ml-1">
                                            ${(Number(selectedUser.balance) + Number(formData.amount)).toFixed(2)}
                                        </span>
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Reason <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className={`w-full px-4 py-3 bg-navy-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500/40 transition-colors resize-none ${fieldErrors.reason ? 'border-red-500/50' : 'border-gold-500/20'
                                        }`}
                                    placeholder="Provide a detailed reason for adding credits (e.g., bonus, refund, compensation, etc.)"
                                />
                                {fieldErrors.reason && (
                                    <p className="mt-1 text-sm text-red-400">{fieldErrors.reason}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Reference Number (Optional)
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="reference"
                                        value={formData.reference}
                                        onChange={handleInputChange}
                                        className="w-full pl-12 pr-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500/40 transition-colors"
                                        placeholder="REF-2024-001"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            disabled={isLoading}
                            className="px-6 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white hover:bg-navy-700/50 hover:border-gold-500/40 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-navy-900"></div>
                                    Adding Credits...
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <DollarSign className="w-5 h-5" />
                                    Add Credits
                                </div>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}

export default AddCreditsForm
