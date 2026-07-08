'use client'

import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import {
    Button,
    Card,
    CardContent,
    Input,
    WorkspaceHeader,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import {
    DollarSign,
    Search,
    User,
    Mail,
    Check,
    AlertCircle,
    Loader2,
    FileText,
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
        reference: '',
    })

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

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
                    search: searchQuery,
                })

                if (response.success && response.data) {
                    const transformedUsers = response.data.users.map((user: UserSearchResult) => ({
                        ...user,
                        balance: Number(user.balance),
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
        if (fieldErrors.user) {
            setFieldErrors((prev) => ({ ...prev, user: '' }))
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
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
                reference: formData.reference || undefined,
            })

            if (response.success) {
                setSuccess(true)
                setTimeout(() => {
                    router.push('/admin/treasury/credits')
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
            <div className="flex min-h-[400px] items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                        <Check className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="mb-2 text-2xl font-semibold text-zinc-900">Credits added successfully</h2>
                    <p className="text-zinc-500">Redirecting to credits management...</p>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <WorkspaceHeader
                title="Add Credits"
                description="Add credits to a user account."
                action={
                    <Button variant="secondary" onClick={() => router.back()}>
                        Cancel
                    </Button>
                }
            />

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="flex items-center gap-3 p-4">
                        <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                        <p className="text-sm text-red-700">{error}</p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div>
                            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-zinc-900">
                                <User className="h-5 w-5 text-gold-600" />
                                Select user
                            </h3>
                            <div className="relative">
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value)
                                        if (!e.target.value) {
                                            setSelectedUser(null)
                                        }
                                    }}
                                    onFocus={() => searchResults.length > 0 && setShowResults(true)}
                                    leftIcon={<Search className="h-4 w-4" />}
                                    rightIcon={
                                        isSearching ? <Loader2 className="h-4 w-4 animate-spin text-gold-500" /> : undefined
                                    }
                                    placeholder="Search by name, email, or username..."
                                    error={fieldErrors.user}
                                />

                                <AnimatePresence>
                                    {showResults && searchResults.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-card-hover"
                                        >
                                            {searchResults.map((user) => (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    onClick={() => handleUserSelect(user)}
                                                    className="flex w-full items-center justify-between border-b border-zinc-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-zinc-50"
                                                >
                                                    <div>
                                                        <p className="font-medium text-zinc-900">
                                                            {user.firstName} {user.lastName}
                                                        </p>
                                                        <p className="text-sm text-zinc-500">{user.email}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium text-gold-700">
                                                            ${Number(user.balance).toFixed(2)}
                                                        </p>
                                                        <p className="text-xs text-zinc-400">Current balance</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {selectedUser && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 rounded-lg border border-gold-200 bg-gold-50 p-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-100">
                                            <User className="h-6 w-6 text-gold-700" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-zinc-900">
                                                {selectedUser.firstName} {selectedUser.lastName}
                                            </p>
                                            <p className="flex items-center gap-2 text-sm text-zinc-500">
                                                <Mail className="h-4 w-4" />
                                                {selectedUser.email}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-semibold text-gold-700">
                                                ${Number(selectedUser.balance).toFixed(2)}
                                            </p>
                                            <p className="text-xs text-zinc-500">Current balance</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        <div>
                            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-zinc-900">
                                <DollarSign className="h-5 w-5 text-gold-600" />
                                Credit details
                            </h3>
                            <div className="space-y-4">
                                <Input
                                    label="Amount (USD) *"
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="0"
                                    leftIcon={<DollarSign className="h-4 w-4" />}
                                    placeholder="100.00"
                                    error={fieldErrors.amount}
                                />
                                {selectedUser && formData.amount && (
                                    <p className="text-sm text-zinc-500">
                                        New balance will be:{' '}
                                        <span className="font-semibold text-gold-700">
                                            ${(Number(selectedUser.balance) + Number(formData.amount)).toFixed(2)}
                                        </span>
                                    </p>
                                )}

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                                        Reason <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleInputChange}
                                        rows={4}
                                        className={cn(
                                            'flex w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500',
                                            fieldErrors.reason ? 'border-red-300' : 'border-zinc-200'
                                        )}
                                        placeholder="Provide a detailed reason for adding credits (e.g., bonus, refund, compensation, etc.)"
                                    />
                                    {fieldErrors.reason && (
                                        <p className="mt-1.5 text-sm text-red-600">{fieldErrors.reason}</p>
                                    )}
                                </div>

                                <Input
                                    label="Reference number (optional)"
                                    type="text"
                                    name="reference"
                                    value={formData.reference}
                                    onChange={handleInputChange}
                                    leftIcon={<FileText className="h-4 w-4" />}
                                    placeholder="REF-2024-001"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 border-t border-zinc-200 pt-6">
                            <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Adding credits...
                                    </>
                                ) : (
                                    <>
                                        <DollarSign className="h-4 w-4" />
                                        Add credits
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default AddCreditsForm
