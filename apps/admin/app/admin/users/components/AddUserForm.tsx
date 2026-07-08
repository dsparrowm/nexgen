'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { adminRoutes } from '@/lib/adminRoutes'
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
    EyeOff,
} from 'lucide-react'
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
        isVerified: false,
    })

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        const checked = (e.target as HTMLInputElement).checked

        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }))

        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({
                ...prev,
                [name]: '',
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
                isVerified: formData.isVerified,
            })

            if (response.success) {
                setSuccess(true)
                setTimeout(() => {
                    router.push(adminRoutes.customers)
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
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="mb-2 text-xl font-semibold text-zinc-900">User created successfully!</h2>
                    <p className="text-sm text-zinc-500">Redirecting to user management...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-3">
                <IconButton onClick={() => router.back()} title="Go back" className="mt-0.5">
                    <ArrowLeft className="h-4 w-4" />
                </IconButton>
                <WorkspaceHeader title="Add new user" description="Create a new customer account." />
            </div>

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="flex items-center gap-3 p-4">
                        <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                        <p className="text-sm text-red-700">{error}</p>
                    </CardContent>
                </Card>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="h-4 w-4 text-gold-600" />
                            Personal information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Input
                            label="First name *"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            placeholder="John"
                            error={fieldErrors.firstName}
                        />
                        <Input
                            label="Last name *"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            placeholder="Doe"
                            error={fieldErrors.lastName}
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
                            label="Email *"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="john@example.com"
                            error={fieldErrors.email}
                        />
                        <Input
                            label="Username *"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            placeholder="johndoe"
                            error={fieldErrors.username}
                        />
                        <Input
                            label="Phone number"
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            placeholder="+1 (555) 123-4567"
                        />
                        <Select label="Role *" name="role" value={formData.role} onChange={handleInputChange}>
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
                        <Input
                            label="Password *"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="••••••••"
                            rightIcon={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-zinc-400 hover:text-zinc-600"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            }
                            error={fieldErrors.password}
                        />
                        <Input
                            label="Confirm password *"
                            type={showPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="••••••••"
                            error={fieldErrors.confirmPassword}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Shield className="h-4 w-4 text-gold-600" />
                            Account options
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <label className="flex cursor-pointer items-center gap-3">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleInputChange}
                                className="rounded border-zinc-300 text-gold-500 focus:ring-gold-500"
                            />
                            <span className="text-sm text-zinc-700">Active account (user can login)</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-3">
                            <input
                                type="checkbox"
                                name="isVerified"
                                checked={formData.isVerified}
                                onChange={handleInputChange}
                                className="rounded border-zinc-300 text-gold-500 focus:ring-gold-500"
                            />
                            <span className="text-sm text-zinc-700">Email verified</span>
                        </label>
                    </CardContent>
                </Card>

                <div className="flex gap-3">
                    <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} className="flex-1 sm:flex-none">
                        {isLoading ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-navy-900 border-t-transparent" />
                                Creating user...
                            </>
                        ) : (
                            <>
                                <User className="h-4 w-4" />
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
