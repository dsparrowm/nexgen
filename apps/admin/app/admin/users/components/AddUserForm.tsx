'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import {
    User,
    Mail,
    Lock,
    Phone,
    Shield,
    ArrowLeft,
    Check,
    AlertCircle,
    Eye,
    EyeOff
} from 'lucide-react'

const AddUserForm = () => {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        role: 'USER' as 'USER' | 'ADMIN' | 'SUPER_ADMIN',
        isActive: true,
        isVerified: false
    })

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        const checked = (e.target as HTMLInputElement).checked

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))

        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: ''
            }))
        }
    }

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {}

        if (!formData.email) {
            errors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Please enter a valid email'
        }

        if (!formData.username) {
            errors.username = 'Username is required'
        } else if (formData.username.length < 3) {
            errors.username = 'Username must be at least 3 characters'
        }

        if (!formData.password) {
            errors.password = 'Password is required'
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters'
        }

        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match'
        }

        if (!formData.firstName) {
            errors.firstName = 'First name is required'
        }

        if (!formData.lastName) {
            errors.lastName = 'Last name is required'
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
            const response = await apiClient.createUser({
                email: formData.email,
                username: formData.username,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phoneNumber: formData.phoneNumber || undefined,
                role: formData.role,
                isActive: formData.isActive,
                isVerified: formData.isVerified
            })

            if (response.success) {
                setSuccess(true)
                setTimeout(() => {
                    router.push('/admin/users')
                }, 2000)
            } else {
                setError(response.error?.message || 'Failed to create user')
            }
        } catch (err) {
            console.error('Error creating user:', err)
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
                    <h2 className="text-2xl font-bold text-white mb-2">User Created Successfully!</h2>
                    <p className="text-gray-400">Redirecting to user management...</p>
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
                    <h1 className="text-3xl font-bold text-white mb-2">Add New User</h1>
                    <p className="text-gray-400">Create a new user account</p>
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
                    {/* Personal Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-gold-500" />
                            Personal Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 bg-navy-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500/40 transition-colors ${fieldErrors.firstName ? 'border-red-500/50' : 'border-gold-500/20'
                                        }`}
                                    placeholder="John"
                                />
                                {fieldErrors.firstName && (
                                    <p className="mt-1 text-sm text-red-400">{fieldErrors.firstName}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 bg-navy-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500/40 transition-colors ${fieldErrors.lastName ? 'border-red-500/50' : 'border-gold-500/20'
                                        }`}
                                    placeholder="Doe"
                                />
                                {fieldErrors.lastName && (
                                    <p className="mt-1 text-sm text-red-400">{fieldErrors.lastName}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Account Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-gold-500" />
                            Account Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 bg-navy-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500/40 transition-colors ${fieldErrors.email ? 'border-red-500/50' : 'border-gold-500/20'
                                        }`}
                                    placeholder="john@example.com"
                                />
                                {fieldErrors.email && (
                                    <p className="mt-1 text-sm text-red-400">{fieldErrors.email}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Username <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 bg-navy-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500/40 transition-colors ${fieldErrors.username ? 'border-red-500/50' : 'border-gold-500/20'
                                        }`}
                                    placeholder="johndoe"
                                />
                                {fieldErrors.username && (
                                    <p className="mt-1 text-sm text-red-400">{fieldErrors.username}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500/40 transition-colors"
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white focus:outline-none focus:border-gold-500/40 transition-colors"
                                >
                                    <option value="USER">User</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="SUPER_ADMIN">Super Admin</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-gold-500" />
                            Security
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 pr-10 bg-navy-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500/40 transition-colors ${fieldErrors.password ? 'border-red-500/50' : 'border-gold-500/20'
                                            }`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {fieldErrors.password && (
                                    <p className="mt-1 text-sm text-red-400">{fieldErrors.password}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Confirm Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 bg-navy-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500/40 transition-colors ${fieldErrors.confirmPassword ? 'border-red-500/50' : 'border-gold-500/20'
                                        }`}
                                    placeholder="••••••••"
                                />
                                {fieldErrors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-400">{fieldErrors.confirmPassword}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleInputChange}
                                className="w-4 h-4 text-gold-500 bg-navy-800 border-gold-500/30 rounded focus:ring-gold-500 focus:ring-2"
                            />
                            <span className="text-sm text-gray-300">Active account (user can login)</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="isVerified"
                                checked={formData.isVerified}
                                onChange={handleInputChange}
                                className="w-4 h-4 text-gold-500 bg-navy-800 border-gold-500/30 rounded focus:ring-gold-500 focus:ring-2"
                            />
                            <span className="text-sm text-gray-300">Email verified</span>
                        </label>
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
                                    Creating User...
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <User className="w-5 h-5" />
                                    Create User
                                </div>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}

export default AddUserForm
