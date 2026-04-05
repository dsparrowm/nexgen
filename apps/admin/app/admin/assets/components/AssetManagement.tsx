'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { apiClient, type AdminAssetDashboard, type AdminAssetPosition } from '@/lib/api'
import { adminRoutes } from '@/lib/adminRoutes'
import { useToast } from '@/components/ToastContext'
import {
    CandlestickChart,
    Loader2,
    RefreshCw,
    Search,
    TrendingUp,
    Users,
    BadgeCheck,
    Edit3,
    X,
    Save,
    CircleDollarSign,
} from 'lucide-react'

interface PositionFormState {
    status: 'ACTIVE' | 'CLOSED'
    amountInvested: string
    unitsHeld: string
    averageEntryPrice: string
    currentPrice: string
    currentValue: string
    profitLoss: string
    lastValuationAt: string
    reason: string
}

const initialFormState: PositionFormState = {
    status: 'ACTIVE',
    amountInvested: '',
    unitsHeld: '',
    averageEntryPrice: '',
    currentPrice: '',
    currentValue: '',
    profitLoss: '',
    lastValuationAt: '',
    reason: '',
}

type EditableFieldKey =
    | 'amountInvested'
    | 'unitsHeld'
    | 'averageEntryPrice'
    | 'currentPrice'
    | 'currentValue'
    | 'profitLoss'

interface EditableField {
    key: EditableFieldKey
    label: string
}

const editableFields: EditableField[] = [
    { key: 'amountInvested', label: 'Amount Invested' },
    { key: 'unitsHeld', label: 'Units Held' },
    { key: 'averageEntryPrice', label: 'Average Entry Price' },
    { key: 'currentPrice', label: 'Current Price' },
    { key: 'currentValue', label: 'Current Value' },
    { key: 'profitLoss', label: 'Profit / Loss' },
]

const formatCurrency = (value: number | string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0))

const formatDateTime = (value: string | null) => {
    if (!value) return 'N/A'
    return new Date(value).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}

const AssetManagement = () => {
    const { addToast } = useToast()
    const [dashboard, setDashboard] = useState<AdminAssetDashboard | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [symbolFilter, setSymbolFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [editingPosition, setEditingPosition] = useState<AdminAssetPosition | null>(null)
    const [formState, setFormState] = useState<PositionFormState>(initialFormState)
    const [saving, setSaving] = useState(false)

    const loadDashboard = async (page = currentPage, showRefreshing = false) => {
        if (showRefreshing) {
            setRefreshing(true)
        } else {
            setLoading(true)
        }

        setError(null)

        try {
            const response = await apiClient.getAssetDashboard({
                page,
                limit: 20,
                search: searchTerm || undefined,
                symbol: symbolFilter !== 'all' ? symbolFilter : undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
            })

            if (!response.success || !response.data) {
                throw new Error(response.error?.message || 'Failed to load asset dashboard')
            }

            setDashboard(response.data)
            setCurrentPage(response.data.pagination.page)
        } catch (loadError) {
            const message = loadError instanceof Error ? loadError.message : 'Failed to load asset dashboard'
            setError(message)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        loadDashboard(1)
    }, [searchTerm, symbolFilter, statusFilter])

    const openEditor = (position: AdminAssetPosition) => {
        setEditingPosition(position)
        setFormState({
            status: position.status,
            amountInvested: String(position.amountInvested ?? ''),
            unitsHeld: String(position.unitsHeld ?? ''),
            averageEntryPrice: String(position.averageEntryPrice ?? ''),
            currentPrice: String(position.currentPrice ?? ''),
            currentValue: String(position.currentValue ?? ''),
            profitLoss: String(position.profitLoss ?? ''),
            lastValuationAt: position.lastValuationAt ? position.lastValuationAt.slice(0, 16) : '',
            reason: '',
        })
    }

    const closeEditor = () => {
        if (saving) return
        setEditingPosition(null)
        setFormState(initialFormState)
    }

    const handleSave = async () => {
        if (!editingPosition) return

        if (!formState.reason.trim()) {
            addToast('error', 'Reason required', 'Please include a short reason for the override.')
            return
        }

        setSaving(true)

        try {
            const response = await apiClient.updateAssetPosition(editingPosition.id, {
                status: formState.status,
                amountInvested: formState.amountInvested ? Number(formState.amountInvested) : undefined,
                unitsHeld: formState.unitsHeld ? Number(formState.unitsHeld) : undefined,
                averageEntryPrice: formState.averageEntryPrice ? Number(formState.averageEntryPrice) : undefined,
                currentPrice: formState.currentPrice ? Number(formState.currentPrice) : undefined,
                currentValue: formState.currentValue ? Number(formState.currentValue) : undefined,
                profitLoss: formState.profitLoss ? Number(formState.profitLoss) : undefined,
                lastValuationAt: formState.lastValuationAt ? new Date(formState.lastValuationAt).toISOString() : null,
                reason: formState.reason,
            })

            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to update asset position')
            }

            addToast('success', 'Asset position updated', response.message || 'The asset override was saved.')
            closeEditor()
            await loadDashboard(currentPage, true)
        } catch (saveError) {
            addToast(
                'error',
                'Update failed',
                saveError instanceof Error ? saveError.message : 'Unable to update the asset position'
            )
        } finally {
            setSaving(false)
        }
    }

    const summary = dashboard?.summary
    const catalog = dashboard?.catalog || []
    const positions = dashboard?.positions || []

    const statCards = [
        {
            label: 'Supported Assets',
            value: summary?.supportedAssets ?? 0,
            helper: 'Catalog level assets',
            icon: CandlestickChart,
        },
        {
            label: 'Total Positions',
            value: summary?.totalPositions ?? 0,
            helper: 'All tracked holdings',
            icon: Users,
        },
        {
            label: 'Active Positions',
            value: summary?.activePositions ?? 0,
            helper: 'Currently open',
            icon: BadgeCheck,
        },
        {
            label: 'Net PnL',
            value: formatCurrency(summary?.totalPnL ?? 0),
            helper: 'Across filtered positions',
            icon: TrendingUp,
        },
    ]

    const activePositionsValue = positions.reduce((sum, position) => sum + Number(position.currentValue || 0), 0)

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">
                            Assets Desk
                        </div>
                        <h1 className="mt-4 text-3xl font-bold text-white">Asset portfolio control is now live</h1>
                        <p className="mt-3 text-sm leading-6 text-gray-300">
                            Admin can review every user asset position, inspect the supported asset catalog, and apply audited manual overrides when a portfolio correction is needed.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            href={adminRoutes.customers}
                            className="inline-flex items-center gap-2 rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-2 text-sm text-white transition-colors hover:bg-navy-800"
                        >
                            <Users className="h-4 w-4" />
                            Customer 360
                        </Link>
                        <button
                            onClick={() => loadDashboard(currentPage, true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400"
                        >
                            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Refresh
                        </button>
                    </div>
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
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">{card.label}</p>
                                <p className="mt-2 text-3xl font-bold text-white">{card.value}</p>
                                <p className="mt-1 text-xs text-gray-500">{card.helper}</p>
                            </div>
                            <div className="rounded-xl bg-gold-500/10 p-3 text-gold-300">
                                <card.icon className="h-5 w-5" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-3xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm">
                    <h2 className="text-xl font-semibold text-white">Supported Assets</h2>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {catalog.map((asset) => (
                            <div key={asset.symbol} className="rounded-2xl border border-gold-500/20 bg-navy-900/50 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-lg font-semibold text-white">{asset.name}</p>
                                        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">{asset.symbol}</p>
                                    </div>
                                    <div className="rounded-xl bg-gold-500/10 p-2 text-gold-300">
                                        <CircleDollarSign className="h-4 w-4" />
                                    </div>
                                </div>
                                <p className="mt-3 text-sm text-gray-300">{asset.description}</p>
                                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-gray-400">
                                    <div>
                                        <p>Network</p>
                                        <p className="text-white">{asset.network}</p>
                                    </div>
                                    <div>
                                        <p>Ref Price</p>
                                        <p className="text-white">{formatCurrency(asset.referencePrice)}</p>
                                    </div>
                                    <div>
                                        <p>Min Buy</p>
                                        <p className="text-white">{formatCurrency(asset.minInvestment)}</p>
                                    </div>
                                    <div>
                                        <p>Precision</p>
                                        <p className="text-white">{asset.precision}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-3xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm">
                    <h2 className="text-xl font-semibold text-white">Asset Summary</h2>
                    <div className="mt-4 grid grid-cols-1 gap-3">
                        <div className="rounded-2xl bg-navy-900/50 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Total Invested</p>
                            <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(summary?.totalInvested ?? 0)}</p>
                        </div>
                        <div className="rounded-2xl bg-navy-900/50 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Current Value</p>
                            <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(summary?.currentValue ?? 0)}</p>
                        </div>
                        <div className="rounded-2xl bg-navy-900/50 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Visible Positions Value</p>
                            <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(activePositionsValue)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search by user, email, or symbol"
                            className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 py-3 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-gold-500/40"
                        />
                    </div>

                    <select
                        value={symbolFilter}
                        onChange={(event) => setSymbolFilter(event.target.value)}
                        className="rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-sm text-white outline-none"
                    >
                        <option value="all">All assets</option>
                        {catalog.map((asset) => (
                            <option key={asset.symbol} value={asset.symbol}>{asset.symbol}</option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        className="rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-sm text-white outline-none"
                    >
                        <option value="all">All statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-gold-500/20 bg-dark-800/50 backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gold-500/10">
                        <thead className="bg-dark-900/40">
                            <tr className="text-left text-xs uppercase tracking-[0.18em] text-gray-400">
                                <th className="px-5 py-4 font-medium">User</th>
                                <th className="px-5 py-4 font-medium">Asset</th>
                                <th className="px-5 py-4 font-medium">Invested</th>
                                <th className="px-5 py-4 font-medium">Current Value</th>
                                <th className="px-5 py-4 font-medium">PnL</th>
                                <th className="px-5 py-4 font-medium">Status</th>
                                <th className="px-5 py-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gold-500/10">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                                        Loading asset positions...
                                    </td>
                                </tr>
                            ) : positions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                                        No asset positions matched the current filters.
                                    </td>
                                </tr>
                            ) : (
                                positions.map((position) => (
                                    <tr key={position.id}>
                                        <td className="px-5 py-4">
                                            <div className="space-y-1">
                                                <p className="font-medium text-white">
                                                    {position.user?.username || position.user?.email || 'Unknown user'}
                                                </p>
                                                <p className="text-sm text-gray-400">{position.user?.email || 'No email'}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div>
                                                <p className="font-medium text-white">{position.name}</p>
                                                <p className="text-sm text-gray-400">{position.symbol}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-white">{formatCurrency(position.amountInvested)}</td>
                                        <td className="px-5 py-4 text-sm text-white">{formatCurrency(position.currentValue)}</td>
                                        <td className={`px-5 py-4 text-sm font-medium ${Number(position.profitLoss) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                            {formatCurrency(position.profitLoss)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-300">
                                                {position.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEditor(position)}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-gold-500/20 bg-navy-900/60 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-navy-800"
                                                >
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                    Adjust
                                                </button>
                                                <Link
                                                    href={`${adminRoutes.customers}/${position.user?.id || ''}`}
                                                    className="rounded-lg border border-gold-500/20 px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-navy-800 hover:text-white"
                                                >
                                                    View User
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-gold-500/10 px-5 py-4 text-sm text-gray-400 md:flex-row md:items-center md:justify-between">
                    <p>
                        Page {dashboard?.pagination.page || 1} of {dashboard?.pagination.pages || 1} with {dashboard?.pagination.total || 0} position{(dashboard?.pagination.total || 0) === 1 ? '' : 's'}
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => loadDashboard(Math.max(1, (dashboard?.pagination.page || 1) - 1))}
                            disabled={(dashboard?.pagination.page || 1) <= 1}
                            className="rounded-lg border border-gold-500/20 px-3 py-2 text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => loadDashboard(Math.min(dashboard?.pagination.pages || 1, (dashboard?.pagination.page || 1) + 1))}
                            disabled={(dashboard?.pagination.page || 1) >= (dashboard?.pagination.pages || 1)}
                            className="rounded-lg border border-gold-500/20 px-3 py-2 text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {editingPosition && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-3xl rounded-3xl border border-gold-500/20 bg-dark-900 p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Adjust Asset Position</h2>
                                <p className="mt-1 text-sm text-gray-400">
                                    Manual overrides are audited. Update the numbers only when you have a clear correction reason.
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
                                <span className="text-sm font-medium text-gray-300">Status</span>
                                <select
                                    value={formState.status}
                                    onChange={(event) => setFormState((current) => ({ ...current, status: event.target.value as 'ACTIVE' | 'CLOSED' }))}
                                    className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="CLOSED">Closed</option>
                                </select>
                            </label>
                            <label className="space-y-2">
                                <span className="text-sm font-medium text-gray-300">Reason</span>
                                <input
                                    value={formState.reason}
                                    onChange={(event) => setFormState((current) => ({ ...current, reason: event.target.value }))}
                                    placeholder="Manual correction reason"
                                    className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                                />
                            </label>

                            {editableFields.map((field) => (
                                <label key={field.key} className="space-y-2">
                                    <span className="text-sm font-medium text-gray-300">{field.label}</span>
                                    <input
                                        type="number"
                                        step="0.00000001"
                                        value={formState[field.key]}
                                        onChange={(event) =>
                                            setFormState((current) => ({
                                                ...current,
                                                [field.key]: event.target.value,
                                            }))
                                        }
                                        className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                                    />
                                </label>
                            ))}

                            <label className="space-y-2 md:col-span-2">
                                <span className="text-sm font-medium text-gray-300">Last Valuation At</span>
                                <input
                                    type="datetime-local"
                                    value={formState.lastValuationAt}
                                    onChange={(event) => setFormState((current) => ({ ...current, lastValuationAt: event.target.value }))}
                                    className="w-full rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-3 text-white outline-none"
                                />
                            </label>
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
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save Override
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AssetManagement
