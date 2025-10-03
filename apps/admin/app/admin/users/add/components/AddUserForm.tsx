'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Phone, UserCircle, Save, X, Eye, EyeOff } from 'lucide-react'

interface FormData {
    email: string
    username: string
    password: string
    confirmPassword: string
    firstName: string
    lastName: string
    phoneNumber: string
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
}

const AddUserForm: React.FC = () => {
    const router = useRouter()
    const [formData, setFormData] = useState<FormData>({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        role: 'USER'
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [submitSuccess, setSubmitSuccess] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        // Clear error for this field
        if (errors[name as keyof FormData]) {
            setErrors(prev => ({ ...prev, [name]: undefined }))
        }
        setSubmitError(null)
    }

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof FormData, string>> = {}

        if (!formData.email) {
            newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email'
        }

        if (!formData.username) {
            newErrors.username = 'Username is required'
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters'
        }

        if (!formData.password) {
            newErrors.password = 'Password is required'
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters'
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm password'
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
        }

        if (!formData.firstName) {
            newErrors.firstName = 'First name is required'
        }

        if (!formData.lastName) {
            newErrors.lastName = 'Last name is required'
        }

        if (formData.phoneNumber && !/^\+?[\d\s-()]+$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = 'Please enter a valid phone number'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        setIsSubmitting(true)
        setSubmitError(null)

        try {
            const { confirmPassword, ...userData } = formData
            const response = await apiClient.createUser(userData)

            if (response.success) {
                setSubmitSuccess(true)
                setTimeout(() => {
                    router.push('/admin/users')
                }, 2000)
            } else {
                setSubmitError(response.error?.message || 'Failed to create user')
            }
        } catch (error) {
            console.error('Create user error:', error)
            setSubmitError('An unexpected error occurred. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancel = () => {
        router.push('/admin/users')
    }

    return (
        <div className="max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Add New User</h1>
                    <p className="text-gray-400">Create a new user account for the platform</p>
                </div>

                {/* Success Message */}
                {submitSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 bg-green-500/10 border border-green-500/30 rounded-xl p-4"
                    >
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-green-500 font-medium">User created successfully!</p>
                                <p className="text-green-400 text-sm">Redirecting to user list...</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Error Message */}
                {submitError && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4"
                    >
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center mr-3">
                                <X className="w-5 h-5 text-red-500" />
                            </div>
                            <p className="text-red-500">{submitError}</p>
                        </div>
                    </motion.div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gold-500/20">
                    {/* Personal Information */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                            <UserCircle className="w-5 h-5 mr-2 text-gold-500" />
                            Personal Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* First Name */}
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                                    First Name *
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-4 py-3 bg-navy-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 ${errors.firstName ? 'border-red-500' : 'border-gold-500/30'
                                            }`}
                                        placeholder="John"
                                    />
                                </div>
                                {errors.firstName && (
                                    <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
                                )}
                            </div>

                            {/* Last Name */}
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                                    Last Name *
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-4 py-3 bg-navy-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 ${errors.lastName ? 'border-red-500' : 'border-gold-500/30'
                                            }`}
                                        placeholder="Doe"
                                    />
                                </div>
                                {errors.lastName && (
                                    <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Account Information */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                            <Mail className="w-5 h-5 mr-2 text-gold-500" />
                            Account Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                    Email Address *
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-4 py-3 bg-navy-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 ${errors.email ? 'border-red-500' : 'border-gold-500/30'
                                            }`}
                                        placeholder="john.doe@example.com"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                                )}
                            </div>

                            {/* Username */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                                    Username *
                                </label>
                                <div className="relative">
                                    <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-4 py-3 bg-navy-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 ${errors.username ? 'border-red-500' : 'border-gold-500/30'
                                            }`}
                                        placeholder="johndoe"
                                    />
                                </div>
                                {errors.username && (
                                    <p className="mt-1 text-sm text-red-500">{errors.username}</p>
                                )}
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-4 py-3 bg-navy-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 ${errors.phoneNumber ? 'border-red-500' : 'border-gold-500/30'
                                            }`}
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>
                                {errors.phoneNumber && (
                                    <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>
                                )}
                            </div>

                            {/* Role */}
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
                                    User Role *
                                </label>
                                <select
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                                >
                                    <option value="USER">User</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="SUPER_ADMIN">Super Admin</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                            <Lock className="w-5 h-5 mr-2 text-gold-500" />
                            Security
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                    Password *
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-12 py-3 bg-navy-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 ${errors.password ? 'border-red-500' : 'border-gold-500/30'
                                            }`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gold-500"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                                    Confirm Password *
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-12 py-3 bg-navy-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 ${errors.confirmPassword ? 'border-red-500' : 'border-gold-500/30'
                                            }`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gold-500"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gold-500/20">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-navy-700/50 text-white rounded-xl hover:bg-navy-700 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 font-semibold rounded-xl hover:from-gold-600 hover:to-gold-700 transition-all disabled:opacity-50 flex items-center"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-navy-900 mr-2"></div>
                                    Creating User...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5 mr-2" />
                                    Create User
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}

export default AddUserForm
