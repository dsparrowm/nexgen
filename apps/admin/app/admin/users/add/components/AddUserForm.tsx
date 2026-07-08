'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { adminRoutes } from '@/lib/adminRoutes'
import { User, Mail, Lock, Phone, UserCircle, Save, X, Eye, EyeOff } from 'lucide-react'
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    IconButton,
    Input,
    Select,
    WorkspaceHeader,
} from '@/components/ui'

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
        role: 'USER',
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [submitSuccess, setSubmitSuccess] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        if (errors[name as keyof FormData]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }))
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
                    router.push(adminRoutes.customers)
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
        router.push(adminRoutes.customers)
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex items-start gap-3">
                <IconButton onClick={handleCancel} title="Back to users" className="mt-0.5">
                    <X className="h-4 w-4" />
                </IconButton>
                <WorkspaceHeader
                    title="Add new user"
                    description="Create a new customer account for the platform."
                />
            </div>

            {submitSuccess && (
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                            <Save className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-green-700">User created successfully!</p>
                            <p className="text-sm text-green-600">Redirecting to user list...</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {submitError && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="flex items-center gap-3 p-4">
                        <X className="h-5 w-5 shrink-0 text-red-600" />
                        <p className="text-sm text-red-700">{submitError}</p>
                    </CardContent>
                </Card>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <UserCircle className="h-4 w-4 text-gold-600" />
                            Personal information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Input
                            label="First name *"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="John"
                            leftIcon={<User className="h-4 w-4" />}
                            error={errors.firstName}
                        />
                        <Input
                            label="Last name *"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Doe"
                            leftIcon={<User className="h-4 w-4" />}
                            error={errors.lastName}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Mail className="h-4 w-4 text-gold-600" />
                            Account information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Input
                            label="Email address *"
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john.doe@example.com"
                            leftIcon={<Mail className="h-4 w-4" />}
                            error={errors.email}
                        />
                        <Input
                            label="Username *"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="johndoe"
                            leftIcon={<UserCircle className="h-4 w-4" />}
                            error={errors.username}
                        />
                        <Input
                            label="Phone number"
                            id="phoneNumber"
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            placeholder="+1 (555) 123-4567"
                            leftIcon={<Phone className="h-4 w-4" />}
                            error={errors.phoneNumber}
                        />
                        <Select label="User role *" id="role" name="role" value={formData.role} onChange={handleChange}>
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                            <option value="SUPER_ADMIN">Super Admin</option>
                        </Select>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Lock className="h-4 w-4 text-gold-600" />
                            Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <Input
                                label="Password *"
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                leftIcon={<Lock className="h-4 w-4" />}
                                rightIcon={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-zinc-400 hover:text-zinc-600"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                }
                                error={errors.password}
                            />
                            <p className="mt-1 text-xs text-zinc-400">Minimum 8 characters</p>
                        </div>
                        <Input
                            label="Confirm password *"
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            leftIcon={<Lock className="h-4 w-4" />}
                            rightIcon={
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="text-zinc-400 hover:text-zinc-600"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            }
                            error={errors.confirmPassword}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3 border-t border-zinc-200 pt-6">
                    <Button type="button" variant="secondary" onClick={handleCancel} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-navy-900 border-t-transparent" />
                                Creating user...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Create user
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default AddUserForm
