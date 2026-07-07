'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    apiClient,
    CreateTransactionPayload,
    PaymentMethod,
    TransactionRecord,
    TransactionStatus,
    TransactionType,
    UpdateTransactionPayload,
} from '@/lib/api'
import {
    AlertTriangle,
    Loader2,
    Search,
    User,
    X,
} from 'lucide-react'

interface UserSearchResult {
    id: string
    email: string
    username: string
    firstName: string
    lastName: string
    balance: number
}

interface TransactionFormModalProps {
    isOpen: boolean
    transaction?: TransactionRecord | null
    onClose: () => void
    onSuccess: () => void
}

const TRANSACTION_TYPES: TransactionType[] = [
    'DEPOSIT',
    'WITHDRAWAL',
    'INVESTMENT',
    'PAYOUT',
    'FEE',
    'REFUND',
    'BONUS',
    'REFERRAL_BONUS',
]

const TRANSACTION_STATUSES: TransactionStatus[] = [
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'REFUNDED',
]

const PAYMENT_METHODS: PaymentMethod[] = [
    'STRIPE_CARD',
    'STRIPE_BANK',
    'COINBASE_CRYPTO',
    'CRYPTO',
    'BANK_TRANSFER',
    'MANUAL',
]

const toDateTimeLocalValue = (value: Date | string) => {
    const date = typeof value === 'string' ? new Date(value) : value
    const pad = (part: number) => String(part).padStart(2, '0')

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const createDefaultFormState = (): FormState => ({
    amount: '',
    fee: '0',
    type: 'DEPOSIT',
    status: 'PENDING',
    description: '',
    reference: '',
    paymentMethod: '',
    failureReason: '',
    investmentId: '',
    assetPositionId: '',
    transactionDate: toDateTimeLocalValue(new Date()),
})

interface FormState {
    amount: string
    fee: string
    type: TransactionType
    status: TransactionStatus
    description: string
    reference: string
    paymentMethod: string
    failureReason: string
    investmentId: string
    assetPositionId: string
    transactionDate: string
}

const defaultFormState: FormState = createDefaultFormState()

const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
    isOpen,
    transaction,
    onClose,
    onSuccess,
}) => {
    const isEditing = Boolean(transaction)
    const [formData, setFormData] = useState<FormState>(defaultFormState)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
    const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
    const [showResults, setShowResults] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [showBalanceWarning, setShowBalanceWarning] = useState(false)

    useEffect(() => {
        if (!isOpen) {
            return
        }

        if (transaction) {
            setFormData({
                amount: String(transaction.amount),
                fee: String(transaction.fee || 0),
                type: transaction.type,
                status: transaction.status,
                description: transaction.description || '',
                reference: transaction.reference || '',
                paymentMethod: transaction.paymentMethod || '',
                failureReason: transaction.failureReason || '',
                investmentId: transaction.investmentId || '',
                assetPositionId: transaction.assetPositionId || '',
                transactionDate: toDateTimeLocalValue(transaction.createdAt),
            })
            setSelectedUser({
                id: transaction.user.id,
                email: transaction.user.email,
                username: transaction.user.username,
                firstName: transaction.user.firstName || '',
                lastName: transaction.user.lastName || '',
                balance: Number(transaction.user.balance || 0),
            })
            setSearchQuery(
                `${transaction.user.firstName || ''} ${transaction.user.lastName || ''} (${transaction.user.email})`.trim()
            )
        } else {
            setFormData(createDefaultFormState())
            setSelectedUser(null)
            setSearchQuery('')
        }

        setError(null)
        setFieldErrors({})
        setShowBalanceWarning(false)
        setSearchResults([])
        setShowResults(false)
    }, [isOpen, transaction])

    const loadUsers = async (query: string) => {
        setIsSearching(true)
        try {
            const response = await apiClient.getUsers({
                page: 1,
                limit: 10,
                search: query.trim() || undefined,
            })

            if (response.success && response.data) {
                const transformedUsers = response.data.users.map((user: UserSearchResult) => ({
                    ...user,
                    balance: Number(user.balance),
                }))
                setSearchResults(transformedUsers)
            } else {
                setSearchResults([])
            }
        } catch (err) {
            console.error('Error searching users:', err)
            setSearchResults([])
        } finally {
            setIsSearching(false)
        }
    }

    useEffect(() => {
        if (!isOpen || !showResults) {
            return
        }

        const debounce = setTimeout(() => {
            void loadUsers(searchQuery)
        }, 300)

        return () => clearTimeout(debounce)
    }, [isOpen, searchQuery, showResults])

    const handleUserSearchFocus = () => {
        setShowResults(true)
        if (searchResults.length === 0) {
            void loadUsers(searchQuery)
        }
    }

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: '' }))
        }
    }

    const handleUserSelect = (user: UserSearchResult) => {
        setSelectedUser(user)
        setSearchQuery(`${user.firstName} ${user.lastName} (${user.email})`)
        setShowResults(false)
        if (fieldErrors.user) {
            setFieldErrors((prev) => ({ ...prev, user: '' }))
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

        if (formData.fee && (isNaN(Number(formData.fee)) || Number(formData.fee) < 0)) {
            errors.fee = 'Fee must be 0 or greater'
        }

        if (formData.status === 'FAILED' && !formData.failureReason.trim()) {
            errors.failureReason = 'Failure reason is required for failed transactions'
        }

        if (!formData.transactionDate) {
            errors.transactionDate = 'Transaction date is required'
        } else if (Number.isNaN(new Date(formData.transactionDate).getTime())) {
            errors.transactionDate = 'Please enter a valid transaction date'
        }

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const hasBalanceImpactChanges = (): boolean => {
        if (!transaction || !selectedUser) {
            return false
        }

        return (
            transaction.status === 'COMPLETED' &&
            (transaction.userId !== selectedUser.id ||
                transaction.type !== formData.type ||
                Number(transaction.amount) !== Number(formData.amount) ||
                transaction.status !== formData.status)
        )
    }

    const buildPayload = (): CreateTransactionPayload | UpdateTransactionPayload => {
        const payload = {
            userId: selectedUser!.id,
            type: formData.type,
            amount: Number(formData.amount),
            status: formData.status,
            description: formData.description || undefined,
            fee: Number(formData.fee) || 0,
            paymentMethod: (formData.paymentMethod as PaymentMethod) || undefined,
            failureReason: formData.failureReason || undefined,
            reference: formData.reference || undefined,
            investmentId: formData.investmentId || undefined,
            assetPositionId: formData.assetPositionId || undefined,
            transactionDate: new Date(formData.transactionDate).toISOString(),
        }

        return payload
    }

    const submitTransaction = async () => {
        if (!validateForm()) {
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            const payload = buildPayload()
            const response = isEditing
                ? await apiClient.updateTransaction(transaction!.id, payload)
                : await apiClient.createTransaction(payload as CreateTransactionPayload)

            if (response.success) {
                onSuccess()
                onClose()
            } else {
                setError(response.error?.message || 'Failed to save transaction')
            }
        } catch (err) {
            console.error('Error saving transaction:', err)
            setError('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
            setShowBalanceWarning(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        if (hasBalanceImpactChanges() && !showBalanceWarning) {
            setShowBalanceWarning(true)
            return
        }

        await submitTransaction()
    }

    if (!isOpen) {
        return null
    }

    const showInvestmentFields =
        formData.type === 'INVESTMENT' || formData.type === 'PAYOUT'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-gold-500/20 bg-dark-900 shadow-2xl"
            >
                <div className="p-6 pb-0">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {isEditing ? 'Edit Transaction' : 'Add Transaction'}
                        </h2>
                        <p className="mt-1 text-sm text-gray-400">
                            {isEditing
                                ? 'Update transaction details. Balance adjustments apply automatically for completed transactions.'
                                : 'Create a manual ledger entry for any transaction type.'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-gold-500/20 p-2 text-gray-400 transition-colors hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {error && (
                    <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    </div>
                )}

                {showBalanceWarning && (
                    <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-yellow-300 font-medium">
                                    This will adjust user balances
                                </p>
                                <p className="text-sm text-yellow-200/80 mt-1">
                                    You are editing a completed transaction in a way that affects balance.
                                    Confirm to apply the reconciliation.
                                </p>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowBalanceWarning(false)}
                                        className="px-3 py-1.5 text-sm rounded-lg border border-gold-500/20 text-gray-300 hover:text-white"
                                    >
                                        Go Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={submitTransaction}
                                        disabled={isSubmitting}
                                        className="px-3 py-1.5 text-sm rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Saving...' : 'Confirm & Save'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                </div>

                <form onSubmit={handleSubmit} className="mt-6 flex flex-1 flex-col overflow-hidden">
                    <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
                    <div className="relative z-20">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-gold-500" />
                            User
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    setSelectedUser(null)
                                    setShowResults(true)
                                }}
                                onFocus={handleUserSearchFocus}
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-navy-900/60 text-white outline-none ${
                                    fieldErrors.user ? 'border-red-500/50' : 'border-gold-500/20'
                                }`}
                                placeholder="Search by name, email, or username..."
                            />
                            {isSearching && (
                                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-500 animate-spin" />
                            )}

                            <AnimatePresence>
                                {showResults && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute z-30 mt-2 w-full rounded-xl border border-gold-500/20 bg-navy-800 shadow-xl overflow-hidden"
                                    >
                                        {searchResults.length > 0 ? (
                                            searchResults.map((user) => (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    onClick={() => handleUserSelect(user)}
                                                    className="w-full px-4 py-3 text-left hover:bg-gold-500/10 transition-colors border-b border-gold-500/10 last:border-0"
                                                >
                                                    <p className="text-white font-medium">
                                                        {user.firstName} {user.lastName}
                                                    </p>
                                                    <p className="text-sm text-gray-400">{user.email}</p>
                                                    <p className="text-xs text-gold-400 mt-1">
                                                        Balance: ${user.balance.toFixed(2)}
                                                    </p>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-sm text-gray-400">
                                                {isSearching ? 'Searching users...' : 'No users found'}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {fieldErrors.user && (
                            <p className="mt-1 text-sm text-red-400">{fieldErrors.user}</p>
                        )}
                        {isEditing && selectedUser && transaction?.userId !== selectedUser.id && (
                            <p className="mt-1 text-sm text-yellow-400">
                                Changing the user will move balance effects to the new user.
                            </p>
                        )}

                        {selectedUser && (
                            <div className="mt-4 rounded-xl border border-gold-500/30 bg-gold-500/10 p-4">
                                <p className="text-white font-medium">
                                    {selectedUser.firstName} {selectedUser.lastName}
                                </p>
                                <p className="text-sm text-gray-400">{selectedUser.email}</p>
                                <p className="text-sm text-gold-400 mt-1">
                                    Balance: ${selectedUser.balance.toFixed(2)}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-gray-300">Type</span>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                            >
                                {TRANSACTION_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {type.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-gray-300">Status</span>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                            >
                                {TRANSACTION_STATUSES.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-gray-300">Amount</span>
                            <input
                                type="number"
                                name="amount"
                                min="0.01"
                                step="0.01"
                                value={formData.amount}
                                onChange={handleInputChange}
                                className={`w-full rounded-xl border bg-navy-900/60 px-4 py-3 text-white outline-none ${
                                    fieldErrors.amount ? 'border-red-500/50' : 'border-gold-500/20'
                                }`}
                            />
                            {fieldErrors.amount && (
                                <p className="text-sm text-red-400">{fieldErrors.amount}</p>
                            )}
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-gray-300">Fee</span>
                            <input
                                type="number"
                                name="fee"
                                min="0"
                                step="0.01"
                                value={formData.fee}
                                onChange={handleInputChange}
                                className={`w-full rounded-xl border bg-navy-900/60 px-4 py-3 text-white outline-none ${
                                    fieldErrors.fee ? 'border-red-500/50' : 'border-gold-500/20'
                                }`}
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-gray-300">Transaction Date</span>
                            <input
                                type="datetime-local"
                                name="transactionDate"
                                value={formData.transactionDate}
                                onChange={handleInputChange}
                                className={`w-full rounded-xl border bg-navy-900/60 px-4 py-3 text-white outline-none ${
                                    fieldErrors.transactionDate ? 'border-red-500/50' : 'border-gold-500/20'
                                }`}
                            />
                            {fieldErrors.transactionDate && (
                                <p className="text-sm text-red-400">{fieldErrors.transactionDate}</p>
                            )}
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-gray-300">Payment Method</span>
                            <select
                                name="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={handleInputChange}
                                className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                            >
                                <option value="">None</option>
                                {PAYMENT_METHODS.map((method) => (
                                    <option key={method} value={method}>
                                        {method.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-gray-300">Reference</span>
                            <input
                                name="reference"
                                value={formData.reference}
                                onChange={handleInputChange}
                                placeholder="Auto-generated if empty"
                                className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                            />
                        </label>
                    </div>

                    {showInvestmentFields && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="space-y-2">
                                <span className="text-sm font-medium text-gray-300">Investment ID</span>
                                <input
                                    name="investmentId"
                                    value={formData.investmentId}
                                    onChange={handleInputChange}
                                    placeholder="Optional linked investment"
                                    className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                                />
                            </label>
                            <label className="space-y-2">
                                <span className="text-sm font-medium text-gray-300">Asset Position ID</span>
                                <input
                                    name="assetPositionId"
                                    value={formData.assetPositionId}
                                    onChange={handleInputChange}
                                    placeholder="Optional linked asset position"
                                    className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                                />
                            </label>
                        </div>
                    )}

                    <label className="block space-y-2">
                        <span className="text-sm font-medium text-gray-300">Description</span>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                            placeholder="Transaction description"
                        />
                    </label>

                    {formData.status === 'FAILED' && (
                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-gray-300">Failure Reason</span>
                            <textarea
                                name="failureReason"
                                value={formData.failureReason}
                                onChange={handleInputChange}
                                rows={2}
                                className={`w-full rounded-xl border bg-navy-900/60 px-4 py-3 text-white outline-none ${
                                    fieldErrors.failureReason ? 'border-red-500/50' : 'border-gold-500/20'
                                }`}
                                placeholder="Reason for failure"
                            />
                            {fieldErrors.failureReason && (
                                <p className="text-sm text-red-400">{fieldErrors.failureReason}</p>
                            )}
                        </label>
                    )}

                    </div>

                    <div className="flex justify-end gap-3 border-t border-gold-500/20 px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-gold-500/20 text-gray-300 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || showBalanceWarning}
                            className="px-4 py-2 rounded-lg bg-gold-600 hover:bg-gold-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isEditing ? 'Save Changes' : 'Create Transaction'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}

export default TransactionFormModal
