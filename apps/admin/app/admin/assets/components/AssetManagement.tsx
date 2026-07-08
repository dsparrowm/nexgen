'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiClient, type AdminAssetDashboard, type AdminAssetPosition } from '@/lib/api'
import { adminRoutes } from '@/lib/adminRoutes'
import { useToast } from '@/components/ToastContext'
import {
    Badge,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    DataTable,
    EmptyState,
    IconButton,
    Input,
    Pagination,
    SearchInput,
    Select,
    Skeleton,
    StatCard,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    WorkspaceHeader,
    WorkspaceToolbar,
    WorkspaceToolbarActions,
    WorkspaceToolbarFilters,
    type BadgeVariant,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import {
    AlertTriangle,
    BadgeCheck,
    CandlestickChart,
    CircleDollarSign,
    Edit3,
    ExternalLink,
    RefreshCw,
    Save,
    TrendingUp,
    Users,
    X,
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

const getStatusBadgeVariant = (status: string): BadgeVariant => {
    switch (status) {
        case 'ACTIVE':
            return 'success'
        case 'CLOSED':
            return 'neutral'
        default:
            return 'neutral'
    }
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
    const pagination = dashboard?.pagination

    const activePositionsValue = positions.reduce((sum, position) => sum + Number(position.currentValue || 0), 0)

    const handlePageChange = (page: number) => {
        loadDashboard(page)
    }

    if (loading && !dashboard) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-16 w-full" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <WorkspaceHeader
                title="Asset Management"
                description="Review user asset positions, inspect the supported catalog, and apply audited manual overrides."
                action={
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={adminRoutes.customers}>
                            <Button variant="secondary">
                                <Users className="h-4 w-4" />
                                Customer 360
                            </Button>
                        </Link>
                        <IconButton onClick={() => loadDashboard(currentPage, true)} disabled={refreshing} title="Refresh">
                            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
                        </IconButton>
                    </div>
                }
            />

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => loadDashboard(currentPage)}>
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Supported Assets"
                    value={String(summary?.supportedAssets ?? 0)}
                    description="Catalog level assets"
                    icon={CandlestickChart}
                />
                <StatCard
                    title="Total Positions"
                    value={String(summary?.totalPositions ?? 0)}
                    description="All tracked holdings"
                    icon={Users}
                />
                <StatCard
                    title="Active Positions"
                    value={String(summary?.activePositions ?? 0)}
                    description="Currently open"
                    icon={BadgeCheck}
                />
                <StatCard
                    title="Net PnL"
                    value={formatCurrency(summary?.totalPnL ?? 0)}
                    description="Across filtered positions"
                    icon={TrendingUp}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Supported Assets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {catalog.map((asset) => (
                                <div
                                    key={asset.symbol}
                                    className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-zinc-900">{asset.name}</p>
                                            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                                                {asset.symbol}
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-gold-50 p-2 text-gold-700">
                                            <CircleDollarSign className="h-4 w-4" />
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm text-zinc-600">{asset.description}</p>
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <p className="text-zinc-400">Network</p>
                                            <p className="font-medium text-zinc-700">{asset.network}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-400">Ref Price</p>
                                            <p className="font-medium text-zinc-700">
                                                {formatCurrency(asset.referencePrice)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-400">Min Buy</p>
                                            <p className="font-medium text-zinc-700">
                                                {formatCurrency(asset.minInvestment)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-400">Precision</p>
                                            <p className="font-medium text-zinc-700">{asset.precision}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Asset Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Total Invested</p>
                            <p className="mt-1 text-2xl font-semibold text-zinc-900">
                                {formatCurrency(summary?.totalInvested ?? 0)}
                            </p>
                        </div>
                        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Current Value</p>
                            <p className="mt-1 text-2xl font-semibold text-zinc-900">
                                {formatCurrency(summary?.currentValue ?? 0)}
                            </p>
                        </div>
                        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                                Visible Positions Value
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-zinc-900">
                                {formatCurrency(activePositionsValue)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <WorkspaceToolbar>
                <WorkspaceToolbarFilters>
                    <SearchInput
                        placeholder="Search by user, email, or symbol"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        containerClassName="w-full sm:w-72"
                    />
                    <Select
                        value={symbolFilter}
                        onChange={(e) => setSymbolFilter(e.target.value)}
                        className="w-full sm:w-40"
                    >
                        <option value="all">All assets</option>
                        {catalog.map((asset) => (
                            <option key={asset.symbol} value={asset.symbol}>
                                {asset.symbol}
                            </option>
                        ))}
                    </Select>
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full sm:w-40"
                    >
                        <option value="all">All statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="CLOSED">Closed</option>
                    </Select>
                </WorkspaceToolbarFilters>

                <WorkspaceToolbarActions>
                    <IconButton onClick={() => loadDashboard(currentPage, true)} disabled={refreshing} title="Refresh">
                        <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
                    </IconButton>
                </WorkspaceToolbarActions>
            </WorkspaceToolbar>

            <DataTable>
                {refreshing ? (
                    <div className="flex items-center justify-center py-16">
                        <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
                    </div>
                ) : positions.length === 0 ? (
                    <EmptyState
                        icon={CandlestickChart}
                        title="No asset positions found"
                        description="Try adjusting your search or filters."
                    />
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Asset</TableHead>
                                    <TableHead>Invested</TableHead>
                                    <TableHead>Current Value</TableHead>
                                    <TableHead>PnL</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {positions.map((position) => (
                                    <TableRow key={position.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-zinc-900">
                                                    {position.user?.username || position.user?.email || 'Unknown user'}
                                                </p>
                                                <p className="text-xs text-zinc-500">
                                                    {position.user?.email || 'No email'}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-zinc-900">{position.name}</p>
                                                <p className="text-xs text-zinc-500">{position.symbol}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-zinc-900">
                                            {formatCurrency(position.amountInvested)}
                                        </TableCell>
                                        <TableCell className="font-medium text-zinc-900">
                                            {formatCurrency(position.currentValue)}
                                        </TableCell>
                                        <TableCell
                                            className={cn(
                                                'font-medium',
                                                Number(position.profitLoss) >= 0 ? 'text-green-600' : 'text-red-600'
                                            )}
                                        >
                                            {formatCurrency(position.profitLoss)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(position.status)}>
                                                {position.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-1">
                                                <IconButton onClick={() => openEditor(position)} title="Adjust position">
                                                    <Edit3 className="h-4 w-4" />
                                                </IconButton>
                                                <Link
                                                    href={`${adminRoutes.customers}/${position.user?.id || ''}`}
                                                    title="View user"
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {pagination && (
                            <Pagination
                                page={pagination.page}
                                pages={pagination.pages}
                                total={pagination.total}
                                limit={pagination.limit}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </>
                )}
            </DataTable>

            {editingPosition && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm">
                    <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto shadow-card-hover">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-zinc-900">Adjust Asset Position</h2>
                                    <p className="mt-1 text-sm text-zinc-500">
                                        Manual overrides are audited. Update the numbers only when you have a clear
                                        correction reason.
                                    </p>
                                </div>
                                <button
                                    onClick={closeEditor}
                                    className="text-zinc-400 hover:text-zinc-600"
                                    type="button"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-zinc-700">Status</label>
                                    <Select
                                        value={formState.status}
                                        onChange={(e) =>
                                            setFormState((current) => ({
                                                ...current,
                                                status: e.target.value as 'ACTIVE' | 'CLOSED',
                                            }))
                                        }
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="CLOSED">Closed</option>
                                    </Select>
                                </div>
                                <Input
                                    label="Reason"
                                    value={formState.reason}
                                    onChange={(e) =>
                                        setFormState((current) => ({ ...current, reason: e.target.value }))
                                    }
                                    placeholder="Manual correction reason"
                                />

                                {editableFields.map((field) => (
                                    <Input
                                        key={field.key}
                                        label={field.label}
                                        type="number"
                                        step="0.00000001"
                                        value={formState[field.key]}
                                        onChange={(e) =>
                                            setFormState((current) => ({
                                                ...current,
                                                [field.key]: e.target.value,
                                            }))
                                        }
                                    />
                                ))}

                                <div className="md:col-span-2">
                                    <Input
                                        label="Last Valuation At"
                                        type="datetime-local"
                                        value={formState.lastValuationAt}
                                        onChange={(e) =>
                                            setFormState((current) => ({
                                                ...current,
                                                lastValuationAt: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap justify-end gap-3">
                                <Button variant="secondary" onClick={closeEditor}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    Save Override
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}

export default AssetManagement
