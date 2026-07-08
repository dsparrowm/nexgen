"use client"

import React, { useState } from 'react'
import {
    Eye,
    EyeOff,
    Lock,
    Mail,
    Shield,
    AlertCircle,
    LayoutDashboard,
    Wallet,
    BadgeCheck,
    ArrowRight,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { NexgenLogo } from '@/components/NexgenLogo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const features = [
    {
        icon: LayoutDashboard,
        title: 'Operations Center',
        description: 'Monitor platform health and clear priority queues in real time.',
    },
    {
        icon: Wallet,
        title: 'Treasury Controls',
        description: 'Approve transactions, manage credits, and run payouts securely.',
    },
    {
        icon: BadgeCheck,
        title: 'Compliance Workflows',
        description: 'Review KYC submissions and keep customer verification on track.',
    },
]

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
        <div className="flex min-h-screen bg-zinc-50">
            {/* Brand panel */}
            <div className="relative hidden w-[52%] overflow-hidden bg-navy-900 lg:flex lg:flex-col lg:justify-between">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,215,0,0.12)_0%,_transparent_50%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
                <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />

                <div className="relative z-10 p-12">
                    <NexgenLogo size="lg" variant="login" theme="dark" />
                </div>

                <div className="relative z-10 flex flex-1 flex-col justify-center px-12">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
                        NexGen Admin
                    </p>
                    <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight tracking-tight text-white">
                        Run your platform with confidence
                    </h1>
                    <p className="mt-4 max-w-sm text-base leading-relaxed text-zinc-400">
                        A focused workspace for operations, finance, and compliance teams.
                    </p>

                    <div className="mt-12 space-y-5">
                        {features.map((feature) => (
                            <div key={feature.title} className="flex items-start gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gold-400">
                                    <feature.icon className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{feature.title}</p>
                                    <p className="mt-0.5 text-sm leading-relaxed text-zinc-400">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 border-t border-white/10 p-12">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Shield className="h-4 w-4 text-gold-400" />
                        <span>Encrypted access · Activity monitored · Admin only</span>
                    </div>
                </div>
            </div>

            {/* Form panel */}
            <div className="flex flex-1 items-center justify-center px-6 py-12">
                <div className="w-full max-w-[420px] animate-fade-in">
                    <div className="mb-8 lg:hidden">
                        <NexgenLogo size="md" variant="login" />
                    </div>

                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-card lg:border-none lg:bg-transparent lg:p-0 lg:shadow-none">
                        <div className="mb-8">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-3 py-1 text-xs font-medium text-gold-800">
                                <Shield className="h-3.5 w-3.5" />
                                Secure sign in
                            </div>
                            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                                Welcome back
                            </h2>
                            <p className="mt-2 text-sm text-zinc-500">
                                Enter your credentials to access the admin dashboard.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {errors.general && (
                                <div
                                    className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                                    role="alert"
                                >
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                                    <p className="text-sm text-red-700">{errors.general}</p>
                                </div>
                            )}

                            <Input
                                label="Email address"
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
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
                                autoComplete="current-password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Enter your password"
                                error={errors.password}
                                leftIcon={<Lock className="h-4 w-4" />}
                                rightIcon={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="rounded-md p-0.5 text-zinc-400 transition-colors hover:text-zinc-600"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                }
                            />

                            <div className="flex items-center justify-between pt-1">
                                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-600">
                                    <input
                                        id="remember-me"
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="h-4 w-4 rounded border-zinc-300 text-gold-500 focus:ring-gold-500 focus:ring-offset-0"
                                    />
                                    Remember me
                                </label>
                                <a
                                    href="#"
                                    className="text-sm font-medium text-zinc-600 transition-colors hover:text-gold-700"
                                >
                                    Forgot password?
                                </a>
                            </div>

                            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy-900/30 border-t-navy-900" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign in to dashboard
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>

                        <p className="mt-8 text-center text-xs leading-relaxed text-zinc-400">
                            Authorized personnel only. Unauthorized access attempts are logged and may be prosecuted.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
