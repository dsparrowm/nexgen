"use client"

import React, { useState } from 'react'
import { Eye, EyeOff, Lock, Mail, Shield, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { NexgenLogo } from '@/components/NexgenLogo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const Login: React.FC = () => {
    const { login } = useAuth()
    const [formData, setFormData] = useState({ email: '', password: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})
    const [rememberMe, setRememberMe] = useState(false)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        if (errors[name as keyof typeof errors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }))
        }
    }

    const validateForm = () => {
        const newErrors: { email?: string; password?: string } = {}

        if (!formData.email) {
            newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email'
        }

        if (!formData.password) {
            newErrors.password = 'Password is required'
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsLoading(true)
        setErrors({})

        try {
            const result = await login(formData.email, formData.password)
            if (!result.success) {
                setErrors({ general: result.error || 'Login failed. Please try again.' })
            }
        } catch (error) {
            console.error('Login error:', error)
            setErrors({ general: 'An unexpected error occurred. Please try again.' })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen">
            {/* Brand panel */}
            <div className="relative hidden w-[45%] flex-col justify-between bg-zinc-900 p-10 lg:flex">
                <div className="absolute left-0 top-0 h-full w-1 bg-gold-500" />
                <NexgenLogo size="lg" variant="login" className="[&_p]:text-white [&_p:last-child]:text-zinc-400" />
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-white">
                        Operations dashboard
                    </h2>
                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
                        Monitor platform health, clear queues, and manage customer operations from one place.
                    </p>
                </div>
                <p className="text-xs text-zinc-500">
                    Secure admin portal. All login attempts are monitored.
                </p>
            </div>

            {/* Form panel */}
            <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12">
                <div className="w-full max-w-sm">
                    <div className="mb-8 lg:hidden">
                        <NexgenLogo size="md" variant="login" />
                    </div>

                    <div className="mb-8">
                        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Welcome back</h1>
                        <p className="mt-1 text-sm text-zinc-500">Sign in to your admin account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {errors.general && (
                            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                                <p className="text-sm text-red-700">{errors.general}</p>
                            </div>
                        )}

                        <Input
                            label="Email address"
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="admin@nexgencrypto.live"
                            error={errors.email}
                            leftIcon={<Mail className="h-4 w-4" />}
                        />

                        <Input
                            label="Password"
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Enter your password"
                            error={errors.password}
                            leftIcon={<Lock className="h-4 w-4" />}
                            rightIcon={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-zinc-400 hover:text-zinc-600"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            }
                        />

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm text-zinc-600">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 rounded border-zinc-300 text-gold-500 focus:ring-gold-500"
                                />
                                Remember me
                            </label>
                            <a href="#" className="text-sm font-medium text-gold-700 hover:text-gold-600">
                                Forgot password?
                            </a>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy-900/30 border-t-navy-900" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <Shield className="h-4 w-4" />
                                    Sign in
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Login
