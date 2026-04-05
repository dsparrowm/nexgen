'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiClient, MiningOperationRecord } from '@/lib/api'
import { useToast } from '@/components/ToastContext'
import {
    AlertTriangle,
    Loader2,
    Plus,
    RefreshCw,
    Save,
    Search,
    Trash2,
    X,
} from 'lucide-react'

interface PaginationInfo {
    page: number
    limit: number
    total: number
    pages: number
}

interface MiningOperationFormState {
    name: string
    description: string
    minInvestment: string
    maxInvestment: string
    dailyReturn: string
    duration: string
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
    totalCapacity: string
    startDate: string
    endDate: string
    imageUrl: string
    features: string
}

const defaultPagination: PaginationInfo = {
    page: 1,
    limit: 9,
    total: 0,
    pages: 1,
}

const defaultFormState: MiningOperationFormState = {
    name: '',
    description: '',
    minInvestment: '',
    maxInvestment: '',
    dailyReturn: '',
    duration: '',
    riskLevel: 'LOW',
    status: 'DRAFT',
    totalCapacity: '',
    startDate: '',
    endDate: '',
    imageUrl: '',
    features: '',
}

const MiningManagement = () => {
    const { addToast } = useToast()
    const [operations, setOperations] = useState<MiningOperationRecord[]>([])
    const [pagination, setPagination] = useState<PaginationInfo>(defaultPagination)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
    const [editingOperation, setEditingOperation] = useState<MiningOperationRecord | null>(null)
    const [formData, setFormData] = useState<MiningOperationFormState>(defaultFormState)
    const [error, setError] = useState<string | null>(null)

    const fetchOperations = useCallback(async (page = pagination.page, showRefreshIndicator = false) => {
        if (showRefreshIndicator) {
            setIsRefreshing(true)
        } else {
            setIsLoading(true)
        }

        setError(null)

        try {
            const response = await apiClient.getMiningOperations({
                page,
                limit: pagination.limit,
                status: statusFilter !== 'all' ? statusFilter.toUpperCase() : undefined,
                search: searchTerm || undefined,
            })

            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to load mining operations')
            }

            setOperations(response.data?.operations || [])
            setPagination(response.data?.pagination || defaultPagination)
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : 'Failed to load mining operations')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [pagination.limit, pagination.page, searchTerm, statusFilter])

    useEffect(() => {
        void fetchOperations(1)
    }, [fetchOperations, statusFilter])

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            void fetchOperations(1)
        }, 350)

        return () => clearTimeout(timeoutId)
    }, [fetchOperations, searchTerm])

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(Number(amount || 0))
    }

    const formatPercent = (value: number | string) => {
        return `${(Number(value || 0) * 100).toFixed(2)}%`
    }

    const getStatusClasses = (status: string) => {
        const styles: Record<string, string> = {
            DRAFT: 'border-gray-500/30 bg-gray-500/10 text-gray-300',
            ACTIVE: 'border-green-500/30 bg-green-500/10 text-green-300',
            PAUSED: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
            COMPLETED: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
            CANCELLED: 'border-red-500/30 bg-red-500/10 text-red-300',
        }

        return styles[status] || styles.DRAFT
    }

    const openCreateModal = () => {
        setEditingOperation(null)
        setFormData(defaultFormState)
        setIsEditorOpen(true)
    }

    const openEditModal = (operation: MiningOperationRecord) => {
        setEditingOperation(operation)
        setFormData({
            name: operation.name || '',
            description: operation.description || '',
            minInvestment: String(operation.minInvestment || ''),
            maxInvestment: String(operation.maxInvestment || ''),
            dailyReturn: String(operation.dailyReturn || ''),
            duration: String(operation.duration || ''),
            riskLevel: operation.riskLevel || 'LOW',
            status: operation.status || 'DRAFT',
            totalCapacity: String(operation.totalCapacity || ''),
            startDate: operation.startDate ? new Date(operation.startDate).toISOString().slice(0, 10) : '',
            endDate: operation.endDate ? new Date(operation.endDate).toISOString().slice(0, 10) : '',
            imageUrl: operation.imageUrl || '',
            features: operation.features?.join(', ') || '',
        })
        setIsEditorOpen(true)
    }

    const closeEditor = () => {
        if (isSaving) return
        setIsEditorOpen(false)
        setEditingOperation(null)
        setFormData(defaultFormState)
    }

    const handleFormChange = (field: keyof MiningOperationFormState, value: string) => {
        setFormData((current) => ({ ...current, [field]: value }))
    }

    const handleSave = async () => {
        setIsSaving(true)

        try {
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                minInvestment: Number(formData.minInvestment),
                maxInvestment: Number(formData.maxInvestment),
                dailyReturn: Number(formData.dailyReturn),
                duration: Number(formData.duration),
                riskLevel: formData.riskLevel,
                totalCapacity: Number(formData.totalCapacity),
                startDate: new Date(formData.startDate).toISOString(),
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
                imageUrl: formData.imageUrl.trim() || undefined,
                features: formData.features
                    .split(',')
                    .map((feature) => feature.trim())
                    .filter(Boolean),
                ...(editingOperation ? { status: formData.status } : {}),
            }

            const response = editingOperation
                ? await apiClient.updateMiningOperation(editingOperation.id, payload)
                : await apiClient.createMiningOperation(payload)

            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to save operation')
            }

            addToast(
                'success',
                editingOperation ? 'Operation updated' : 'Operation created',
                response.message || 'Mining operation saved successfully.'
            )
            closeEditor()
            await fetchOperations(editingOperation ? pagination.page : 1, true)
        } catch (saveError) {
            addToast(
                'error',
                'Save failed',
                saveError instanceof Error ? saveError.message : 'Unable to save the mining operation'
            )
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (operation: MiningOperationRecord) => {
        const confirmed = window.confirm(
            `Delete ${operation.name}?\n\nThis only works when there are no active investments in the operation.`
        )

        if (!confirmed) {
            return
        }

        setIsDeletingId(operation.id)

        try {
            const response = await apiClient.deleteMiningOperation(operation.id)
            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to delete operation')
            }

            addToast('success', 'Operation deleted', response.message)
            await fetchOperations(pagination.page, true)
        } catch (deleteError) {
            addToast(
                'error',
                'Delete failed',
                deleteError instanceof Error ? deleteError.message : 'Unable to delete the mining operation'
            )
        } finally {
            setIsDeletingId(null)
        }
    }

    const totalInvested = operations.reduce((sum, operation) => sum + Number(operation.totalInvested || 0), 0)
    const totalActiveInvestments = operations.reduce((sum, operation) => sum + Number(operation.activeInvestments || 0), 0)

    const statCards = [
        {
            label: 'Visible Operations',
            value: pagination.total,
            helper: 'Across current filters',
        },
        {
            label: 'Active on Page',
            value: operations.filter((operation) => operation.status === 'ACTIVE').length,
            helper: 'Currently selling',
        },
        {
            label: 'Invested Value',
            value: formatCurrency(totalInvested),
            helper: 'Current page total',
        },
        {
            label: 'Active Investments',
            value: totalActiveInvestments,
            helper: 'Linked investor positions',
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Mining Operations</h1>
                    <p className="text-gray-400">Create, update, pause, or retire the plans users can invest in.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => fetchOperations(pagination.page, true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-navy-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-600"
                    >
                        {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Refresh
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400"
                    >
                        <Plus className="h-4 w-4" />
                        New Operation
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {statCards.map((card) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-gold-500/20 bg-dark-800/50 p-5 backdrop-blur-sm"
                    >
                        <p className="text-sm text-gray-400">{card.label}</p>
                        <p className="mt-2 text-3xl font-bold text-white">{card.value}</p>
                        <p className="mt-1 text-xs text-gray-500">{card.helper}</p>
                    </motion.div>
                ))}
            </div>

            <div className="rounded-3xl border border-gold-500/20 bg-dark-800/50 p-5 backdrop-blur-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search by operation name or description"
                            className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 py-3 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-gold-500/40"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(event) => {
                            setStatusFilter(event.target.value)
                            setPagination((current) => ({ ...current, page: 1 }))
                        }}
                        className="rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-sm text-white outline-none"
                    >
                        <option value="all">All statuses</option>
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {isLoading ? (
                    <div className="rounded-3xl border border-gold-500/20 bg-dark-800/50 px-6 py-12 text-center text-gray-400 xl:col-span-2">
                        Loading mining operations...
                    </div>
                ) : operations.length === 0 ? (
                    <div className="rounded-3xl border border-gold-500/20 bg-dark-800/50 px-6 py-12 text-center text-gray-400 xl:col-span-2">
                        No mining operations matched the current filters.
                    </div>
                ) : (
                    operations.map((operation) => (
                        <div key={operation.id} className="rounded-3xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h2 className="text-xl font-semibold text-white">{operation.name}</h2>
                                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(operation.status)}`}>
                                            {operation.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300">
                                        {operation.description || 'No description has been added for this operation yet.'}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => openEditModal(operation)}
                                        className="rounded-lg border border-gold-500/20 bg-navy-900/60 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-800"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(operation)}
                                        disabled={isDeletingId === operation.id}
                                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isDeletingId === operation.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        Delete
                                    </button>
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-2xl bg-navy-900/50 p-4">
                                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Investment Range</p>
                                    <p className="mt-2 text-sm font-medium text-white">
                                        {formatCurrency(operation.minInvestment)} - {formatCurrency(operation.maxInvestment)}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-navy-900/50 p-4">
                                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Daily Return</p>
                                    <p className="mt-2 text-sm font-medium text-white">{formatPercent(operation.dailyReturn)}</p>
                                </div>
                                <div className="rounded-2xl bg-navy-900/50 p-4">
                                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Capacity</p>
                                    <p className="mt-2 text-sm font-medium text-white">
                                        {formatCurrency(operation.currentCapacity)} / {formatCurrency(operation.totalCapacity)}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-navy-900/50 p-4">
                                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Investor Demand</p>
                                    <p className="mt-2 text-sm font-medium text-white">
                                        {operation.activeInvestments || 0} active investments
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-gray-400">
                                <span>Risk: {operation.riskLevel}</span>
                                <span>Duration: {operation.duration} days</span>
                                <span>Starts: {new Date(operation.startDate).toLocaleDateString('en-US')}</span>
                                {operation.endDate && <span>Ends: {new Date(operation.endDate).toLocaleDateString('en-US')}</span>}
                            </div>

                            {operation.features && operation.features.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {operation.features.map((feature) => (
                                        <span
                                            key={`${operation.id}-${feature}`}
                                            className="rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-300"
                                        >
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-gold-500/20 bg-dark-800/50 px-5 py-4 text-sm text-gray-400 md:flex-row md:items-center md:justify-between">
                <p>
                    Page {pagination.page} of {pagination.pages} with {pagination.total} operation{pagination.total === 1 ? '' : 's'} total
                </p>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchOperations(Math.max(1, pagination.page - 1))}
                        disabled={pagination.page <= 1}
                        className="rounded-lg border border-gold-500/20 px-3 py-2 text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => fetchOperations(Math.min(pagination.pages, pagination.page + 1))}
                        disabled={pagination.page >= pagination.pages}
                        className="rounded-lg border border-gold-500/20 px-3 py-2 text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            </div>

            {isEditorOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-4xl rounded-3xl border border-gold-500/20 bg-dark-900 p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {editingOperation ? 'Edit Mining Operation' : 'Create Mining Operation'}
                                </h2>
                                <p className="mt-1 text-sm text-gray-400">
                                    {editingOperation
                                        ? 'Update plan details, availability, and lifecycle state.'
                                        : 'New operations start as draft and can be activated after review.'}
                                </p>
                            </div>

                            <button
                                onClick={closeEditor}
                                className="rounded-xl border border-gold-500/20 p-2 text-gray-400 transition-colors hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <label className="space-y-2">
                                <span className="text-sm font-medium text-gray-300">Operation Name</span>
                                <input
                                    value={formData.name}
                                    onChange={(event) => handleFormChange('name', event.target.value)}
                                    className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                                />
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm font-medium text-gray-300">Risk Level</span>
                                <select
                                    value={formData.riskLevel}
                                    onChange={(event) => handleFormChange('riskLevel', event.target.value)}
                                    className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                </select>
                            </label>

                            <label className="space-y-2 md:col-span-2">
                                <span className="text-sm font-medium text-gray-300">Description</span>
                                <textarea
                                    value={formData.description}
                                    onChange={(event) => handleFormChange('description', event.target.value)}
                                    rows={4}
                                    className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                                />
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm font-medium text-gray-300">Minimum Investment</span>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={formData.minInvestment}
                                    onChange={(event) => handleFormChange('minInvestment', event.target.value)}
                                    className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                                />
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm font-medium text-gray-300">Maximum Investment</span>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={formData.maxInvestment}
                                    onChange={(event) => handleFormChange('maxInvestment', event.target.value)}
                                    className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                                />
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm font-medium text-gray-300">Daily Return (decimal)</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="1"
                                    step="0.0001"
                                    value={formData.dailyReturn}
                                    onChange={(event) => handleFormChange('dailyReturn', event.target.value)}
                                    className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                                />
                                <p className="text-xs text-gray-500">Example: `0.015` means 1.5% daily.</p>
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm font-medium text-gray-300">Duration (days)</span>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={formData.duration}
                                    onChange={(event) => handleFormChange('duration', event.target.value)}
                                    className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                                />
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm font-medium text-gray-300">Total Capacity</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.totalCapacity}
                                    onChange={(event) => handleFormChange('totalCapacity', event.target.value)}
                                    className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                                />
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm font-medium text-gray-300">Start Date</span>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(event) => handleFormChange('startDate', event.target.value)}
                                    className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                                />
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm font-medium text-gray-300">End Date</span>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(event) => handleFormChange('endDate', event.target.value)}
                                    className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                                />
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm font-medium text-gray-300">Image URL</span>
                                <input
                                    value={formData.imageUrl}
                                    onChange={(event) => handleFormChange('imageUrl', event.target.value)}
                                    className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                                />
                            </label>

                            {editingOperation && (
                                <label className="space-y-2">
                                    <span className="text-sm font-medium text-gray-300">Status</span>
                                    <select
                                        value={formData.status}
                                        onChange={(event) => handleFormChange('status', event.target.value)}
                                        className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                                    >
                                        <option value="DRAFT">Draft</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="PAUSED">Paused</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                </label>
                            )}

                            <label className="space-y-2 md:col-span-2">
                                <span className="text-sm font-medium text-gray-300">Features</span>
                                <input
                                    value={formData.features}
                                    onChange={(event) => handleFormChange('features', event.target.value)}
                                    placeholder="Comma-separated highlights"
                                    className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                                />
                            </label>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-gold-500/20 bg-gold-500/5 p-4 text-sm text-gray-300 md:flex-row md:items-start">
                            <AlertTriangle className="mt-0.5 h-5 w-5 text-gold-400" />
                            <p>
                                Active operations cannot be deleted while investors still hold active positions. Use status changes for controlled rollouts, pauses, and retirements.
                            </p>
                        </div>

                        <div className="mt-6 flex flex-wrap justify-end gap-3">
                            <button
                                onClick={closeEditor}
                                className="rounded-lg border border-gold-500/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {editingOperation ? 'Save Changes' : 'Create Operation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MiningManagement
