'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { apiClient, MiningOperationRecord } from '@/lib/api'
import { useToast } from '@/components/ToastContext'
import {
    Badge,
    Button,
    Card,
    CardContent,
    EmptyState,
    IconButton,
    Input,
    Pagination,
    SearchInput,
    Select,
    Skeleton,
    StatCard,
    WorkspaceHeader,
    WorkspaceToolbar,
    WorkspaceToolbarActions,
    WorkspaceToolbarFilters,
    type BadgeVariant,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import {
    Activity,
    AlertTriangle,
    DollarSign,
    Loader2,
    Pickaxe,
    Plus,
    RefreshCw,
    Save,
    Trash2,
    Users,
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

const getStatusBadgeVariant = (status: string): BadgeVariant => {
    switch (status) {
        case 'ACTIVE':
            return 'success'
        case 'PAUSED':
            return 'warning'
        case 'COMPLETED':
            return 'gold'
        case 'CANCELLED':
            return 'error'
        default:
            return 'neutral'
    }
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
    const totalActiveInvestments = operations.reduce(
        (sum, operation) => sum + Number(operation.activeInvestments || 0),
        0
    )

    const handlePageChange = (page: number) => {
        void fetchOperations(page)
    }

    if (isLoading && operations.length === 0) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-16 w-full" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>
                <Skeleton className="h-12 w-full" />
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <WorkspaceHeader
                title="Mining Operations"
                description="Create, update, pause, or retire the plans users can invest in."
                action={
                    <div className="flex flex-wrap items-center gap-2">
                        <IconButton
                            onClick={() => fetchOperations(pagination.page, true)}
                            disabled={isRefreshing}
                            title="Refresh"
                        >
                            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                        </IconButton>
                        <Button onClick={openCreateModal}>
                            <Plus className="h-4 w-4" />
                            New operation
                        </Button>
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
                        <Button variant="ghost" size="sm" onClick={() => fetchOperations(pagination.page)}>
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Visible Operations"
                    value={String(pagination.total)}
                    description="Across current filters"
                    icon={Pickaxe}
                />
                <StatCard
                    title="Active on Page"
                    value={String(operations.filter((operation) => operation.status === 'ACTIVE').length)}
                    description="Currently selling"
                    icon={Activity}
                />
                <StatCard
                    title="Invested Value"
                    value={formatCurrency(totalInvested)}
                    description="Current page total"
                    icon={DollarSign}
                />
                <StatCard
                    title="Active Investments"
                    value={String(totalActiveInvestments)}
                    description="Linked investor positions"
                    icon={Users}
                />
            </div>

            <WorkspaceToolbar>
                <WorkspaceToolbarFilters>
                    <SearchInput
                        placeholder="Search by operation name or description"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        containerClassName="w-full sm:w-72"
                    />
                    <Select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value)
                            setPagination((current) => ({ ...current, page: 1 }))
                        }}
                        className="w-full sm:w-40"
                    >
                        <option value="all">All statuses</option>
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </Select>
                </WorkspaceToolbarFilters>

                <WorkspaceToolbarActions>
                    <IconButton
                        onClick={() => fetchOperations(pagination.page, true)}
                        disabled={isRefreshing}
                        title="Refresh"
                    >
                        <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                    </IconButton>
                </WorkspaceToolbarActions>
            </WorkspaceToolbar>

            {isRefreshing ? (
                <div className="flex items-center justify-center py-16">
                    <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
            ) : operations.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={Pickaxe}
                        title="No mining operations found"
                        description="Try adjusting your search or filters, or create a new operation."
                        actionLabel="New operation"
                        onAction={openCreateModal}
                    />
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {operations.map((operation) => (
                        <Card key={operation.id} className="card-hover">
                            <CardContent className="p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-base font-semibold text-zinc-900">{operation.name}</h2>
                                            <Badge variant={getStatusBadgeVariant(operation.status)}>
                                                {operation.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-zinc-500">
                                            {operation.description ||
                                                'No description has been added for this operation yet.'}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <Button variant="secondary" size="sm" onClick={() => openEditModal(operation)}>
                                            Edit
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDelete(operation)}
                                            disabled={isDeletingId === operation.id}
                                        >
                                            {isDeletingId === operation.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                            Delete
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                                            Investment Range
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-zinc-900">
                                            {formatCurrency(operation.minInvestment)} –{' '}
                                            {formatCurrency(operation.maxInvestment)}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                                            Daily Return
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-zinc-900">
                                            {formatPercent(operation.dailyReturn)}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                                            Capacity
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-zinc-900">
                                            {formatCurrency(operation.currentCapacity)} /{' '}
                                            {formatCurrency(operation.totalCapacity)}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                                            Investor Demand
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-zinc-900">
                                            {operation.activeInvestments || 0} active investments
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
                                    <span>Risk: {operation.riskLevel}</span>
                                    <span>Duration: {operation.duration} days</span>
                                    <span>Starts: {new Date(operation.startDate).toLocaleDateString('en-US')}</span>
                                    {operation.endDate && (
                                        <span>Ends: {new Date(operation.endDate).toLocaleDateString('en-US')}</span>
                                    )}
                                </div>

                                {operation.features && operation.features.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {operation.features.map((feature) => (
                                            <Badge key={`${operation.id}-${feature}`} variant="gold">
                                                {feature}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {pagination.pages > 1 && (
                <Card>
                    <Pagination
                        page={pagination.page}
                        pages={pagination.pages}
                        total={pagination.total}
                        limit={pagination.limit}
                        onPageChange={handlePageChange}
                        className="border-t-0"
                    />
                </Card>
            )}

            {isEditorOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm">
                    <Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto shadow-card-hover">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-zinc-900">
                                        {editingOperation ? 'Edit Mining Operation' : 'Create Mining Operation'}
                                    </h2>
                                    <p className="mt-1 text-sm text-zinc-500">
                                        {editingOperation
                                            ? 'Update plan details, availability, and lifecycle state.'
                                            : 'New operations start as draft and can be activated after review.'}
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
                                <Input
                                    label="Operation Name"
                                    value={formData.name}
                                    onChange={(e) => handleFormChange('name', e.target.value)}
                                />

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-zinc-700">Risk Level</label>
                                    <Select
                                        value={formData.riskLevel}
                                        onChange={(e) => handleFormChange('riskLevel', e.target.value)}
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                    </Select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium text-zinc-700">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleFormChange('description', e.target.value)}
                                        rows={4}
                                        className="flex w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                                    />
                                </div>

                                <Input
                                    label="Minimum Investment"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={formData.minInvestment}
                                    onChange={(e) => handleFormChange('minInvestment', e.target.value)}
                                />

                                <Input
                                    label="Maximum Investment"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={formData.maxInvestment}
                                    onChange={(e) => handleFormChange('maxInvestment', e.target.value)}
                                />

                                <div>
                                    <Input
                                        label="Daily Return (decimal)"
                                        type="number"
                                        min="0"
                                        max="1"
                                        step="0.0001"
                                        value={formData.dailyReturn}
                                        onChange={(e) => handleFormChange('dailyReturn', e.target.value)}
                                    />
                                    <p className="mt-1 text-xs text-zinc-400">Example: 0.015 means 1.5% daily.</p>
                                </div>

                                <Input
                                    label="Duration (days)"
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={formData.duration}
                                    onChange={(e) => handleFormChange('duration', e.target.value)}
                                />

                                <Input
                                    label="Total Capacity"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.totalCapacity}
                                    onChange={(e) => handleFormChange('totalCapacity', e.target.value)}
                                />

                                <Input
                                    label="Start Date"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => handleFormChange('startDate', e.target.value)}
                                />

                                <Input
                                    label="End Date"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => handleFormChange('endDate', e.target.value)}
                                />

                                <Input
                                    label="Image URL"
                                    value={formData.imageUrl}
                                    onChange={(e) => handleFormChange('imageUrl', e.target.value)}
                                />

                                {editingOperation && (
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-zinc-700">Status</label>
                                        <Select
                                            value={formData.status}
                                            onChange={(e) => handleFormChange('status', e.target.value)}
                                        >
                                            <option value="DRAFT">Draft</option>
                                            <option value="ACTIVE">Active</option>
                                            <option value="PAUSED">Paused</option>
                                            <option value="COMPLETED">Completed</option>
                                            <option value="CANCELLED">Cancelled</option>
                                        </Select>
                                    </div>
                                )}

                                <div className="md:col-span-2">
                                    <Input
                                        label="Features"
                                        value={formData.features}
                                        onChange={(e) => handleFormChange('features', e.target.value)}
                                        placeholder="Comma-separated highlights"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                <p>
                                    Active operations cannot be deleted while investors still hold active positions. Use
                                    status changes for controlled rollouts, pauses, and retirements.
                                </p>
                            </div>

                            <div className="mt-6 flex flex-wrap justify-end gap-3">
                                <Button variant="secondary" onClick={closeEditor}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    {editingOperation ? 'Save Changes' : 'Create Operation'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}

export default MiningManagement
