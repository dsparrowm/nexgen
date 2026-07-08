'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
    BadgeCheck,
    CheckCircle2,
    ExternalLink,
    FileText,
    RefreshCw,
    User,
    XCircle,
} from 'lucide-react'
import { apiClient, type AdminKycDocument, type KycDocumentStatus } from '@/lib/api'
import { adminRoutes } from '@/lib/adminRoutes'
import { useToast } from '@/components/ToastContext'
import {
    Badge,
    Button,
    Card,
    CardContent,
    EmptyState,
    SearchInput,
    SegmentedControl,
    Select,
    Skeleton,
    StatCard,
    WorkspaceHeader,
    WorkspaceToolbar,
    WorkspaceToolbarFilters,
    type BadgeVariant,
} from '@/components/ui'
import { cn } from '@/lib/utils'

type StatusFilter = KycDocumentStatus | 'ALL'

const STATUS_SEGMENTS: Array<{ value: StatusFilter; label: string }> = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'UNDER_REVIEW', label: 'In review' },
    { value: 'ALL', label: 'All' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
]

const DOCUMENT_TYPES = [
    { value: 'ALL', label: 'All document types' },
    { value: 'NATIONAL_ID', label: 'National ID' },
    { value: 'PASSPORT', label: 'Passport' },
    { value: 'DRIVERS_LICENSE', label: "Driver's license" },
    { value: 'UTILITY_BILL', label: 'Utility bill' },
    { value: 'OTHER', label: 'Other' },
]

type KycStats = {
    documents?: {
        pending?: number
        approved?: number
        rejected?: number
        total?: number
    }
    users?: {
        underReview?: number
    }
}

function formatDocumentType(type: string) {
    return DOCUMENT_TYPES.find((item) => item.value === type)?.label || type.replace(/_/g, ' ')
}

function formatRelativeTime(value?: string | null) {
    if (!value) return 'Unknown'
    const diff = Date.now() - new Date(value).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
}

function getStatusVariant(status: string): BadgeVariant {
    switch (status) {
        case 'APPROVED':
            return 'success'
        case 'REJECTED':
            return 'error'
        case 'PENDING':
            return 'warning'
        default:
            return 'neutral'
    }
}

function getUserLabel(document: AdminKycDocument) {
    const fullName = [document.user?.firstName, document.user?.lastName].filter(Boolean).join(' ')
    return fullName || document.user?.username || document.user?.email || 'Unknown user'
}

const KycManagement: React.FC = () => {
    const { addToast } = useToast()
    const [documents, setDocuments] = useState<AdminKycDocument[]>([])
    const [stats, setStats] = useState<KycStats | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING')
    const [typeFilter, setTypeFilter] = useState('ALL')
    const [isLoading, setIsLoading] = useState(true)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [rejectTarget, setRejectTarget] = useState<AdminKycDocument | null>(null)
    const [rejectionReason, setRejectionReason] = useState('')

    const loadData = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            const [statsResponse, documentsResponse] = await Promise.all([
                apiClient.getKycStats(),
                apiClient.getKycDocuments({
                    status: statusFilter === 'ALL' ? undefined : statusFilter,
                    type: typeFilter === 'ALL' ? undefined : typeFilter,
                    limit: 100,
                }),
            ])

            if (statsResponse.success) {
                setStats(statsResponse.data)
            }

            if (documentsResponse.success && documentsResponse.data) {
                setDocuments(documentsResponse.data.documents || [])
            } else {
                throw new Error(documentsResponse.error?.message || 'Failed to load KYC documents')
            }
        } catch (loadError) {
            console.error('Error loading KYC data:', loadError)
            const message = loadError instanceof Error ? loadError.message : 'Failed to load KYC data'
            setError(message)
            addToast('error', 'KYC load failed', message)
        } finally {
            setIsLoading(false)
        }
    }, [addToast, statusFilter, typeFilter])

    useEffect(() => {
        void loadData()
    }, [loadData])

    const filteredDocuments = useMemo(() => {
        if (!searchTerm.trim()) return documents

        const query = searchTerm.trim().toLowerCase()
        return documents.filter((document) => {
            const haystack = [
                document.user?.email,
                document.user?.username,
                document.user?.firstName,
                document.user?.lastName,
                document.fileName,
                document.type,
                formatDocumentType(document.type),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()

            return haystack.includes(query)
        })
    }, [documents, searchTerm])

    useEffect(() => {
        if (filteredDocuments.length === 0) {
            setSelectedId(null)
            return
        }

        if (!selectedId || !filteredDocuments.some((doc) => doc.id === selectedId)) {
            const firstActionable =
                filteredDocuments.find((doc) => doc.status === 'PENDING') || filteredDocuments[0]
            setSelectedId(firstActionable?.id ?? null)
        }
    }, [filteredDocuments, selectedId])

    const selectedDocument = filteredDocuments.find((doc) => doc.id === selectedId) ?? null

    const pickNextDocument = (currentId: string, nextDocuments: AdminKycDocument[]) => {
        const index = nextDocuments.findIndex((doc) => doc.id === currentId)
        const nextPending = nextDocuments.find((doc, i) => i > index && doc.status === 'PENDING')
        if (nextPending) return nextPending.id
        const nextAny = nextDocuments[index + 1] || nextDocuments[index - 1]
        return nextAny?.id ?? null
    }

    const handleReview = async (documentId: string, action: 'approve' | 'reject', reason?: string) => {
        setActiveDocumentId(documentId)

        try {
            const response = await apiClient.reviewKycDocument(
                documentId,
                action,
                reason?.trim()
            )

            if (!response.success) {
                throw new Error(response.error?.message || `Failed to ${action} document`)
            }

            addToast('success', `Document ${action}d`, response.message)

            const [statsResponse, documentsResponse] = await Promise.all([
                apiClient.getKycStats(),
                apiClient.getKycDocuments({
                    status: statusFilter === 'ALL' ? undefined : statusFilter,
                    type: typeFilter === 'ALL' ? undefined : typeFilter,
                    limit: 100,
                }),
            ])

            if (statsResponse.success) setStats(statsResponse.data)

            const nextDocuments =
                documentsResponse.success && documentsResponse.data
                    ? documentsResponse.data.documents || []
                    : []

            setDocuments(nextDocuments)
            setSelectedId(pickNextDocument(documentId, nextDocuments))
        } catch (reviewError) {
            console.error('Error reviewing document:', reviewError)
            addToast(
                'error',
                'Review failed',
                reviewError instanceof Error ? reviewError.message : 'Failed to review document'
            )
        } finally {
            setActiveDocumentId(null)
            setRejectTarget(null)
            setRejectionReason('')
        }
    }

    const openRejectDialog = (document: AdminKycDocument) => {
        setRejectTarget(document)
        setRejectionReason('')
    }

    const submitRejection = () => {
        if (!rejectTarget) return
        if (rejectionReason.trim().length < 10) {
            addToast('error', 'Reason required', 'Please provide at least 10 characters.')
            return
        }
        void handleReview(rejectTarget.id, 'reject', rejectionReason)
    }

    const pendingCount = stats?.documents?.pending ?? 0

    if (isLoading && documents.length === 0) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-16 w-full" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>
                <Skeleton className="h-[32rem] w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <WorkspaceHeader
                title="KYC review"
                description="Work through identity submissions one at a time. Select a document, verify it, then approve or reject."
                action={
                    <Button variant="secondary" onClick={() => void loadData()} disabled={isLoading}>
                        <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                        Refresh
                    </Button>
                }
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <button type="button" onClick={() => setStatusFilter('PENDING')} className="text-left">
                    <StatCard
                        title="Pending"
                        value={String(stats?.documents?.pending ?? 0)}
                        description="Needs review"
                        icon={BadgeCheck}
                        className={cn(statusFilter === 'PENDING' && 'ring-2 ring-gold-400')}
                    />
                </button>
                <button type="button" onClick={() => setStatusFilter('APPROVED')} className="text-left">
                    <StatCard
                        title="Approved"
                        value={String(stats?.documents?.approved ?? 0)}
                        icon={CheckCircle2}
                        className={cn(statusFilter === 'APPROVED' && 'ring-2 ring-gold-400')}
                    />
                </button>
                <button type="button" onClick={() => setStatusFilter('REJECTED')} className="text-left">
                    <StatCard
                        title="Rejected"
                        value={String(stats?.documents?.rejected ?? 0)}
                        icon={XCircle}
                        className={cn(statusFilter === 'REJECTED' && 'ring-2 ring-gold-400')}
                    />
                </button>
                <StatCard
                    title="Users in review"
                    value={String(stats?.users?.underReview ?? 0)}
                    description="Account-level KYC state"
                    icon={User}
                />
            </div>

            <WorkspaceToolbar>
                <WorkspaceToolbarFilters className="flex-1 flex-col gap-3 xl:flex-row xl:items-center">
                    <SearchInput
                        placeholder="Search customer or document..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        containerClassName="w-full xl:max-w-sm"
                    />
                    <Select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full sm:w-52"
                    >
                        {DOCUMENT_TYPES.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                    <SegmentedControl
                        options={STATUS_SEGMENTS}
                        value={statusFilter}
                        onChange={(value) => setStatusFilter(value as StatusFilter)}
                        className="w-full overflow-x-auto xl:w-auto"
                    />
                </WorkspaceToolbarFilters>
            </WorkspaceToolbar>

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
                </Card>
            )}

            <div className="grid min-h-[32rem] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
                {/* Queue */}
                <Card className="flex flex-col overflow-hidden">
                    <div className="border-b border-zinc-200 px-4 py-3">
                        <p className="text-sm font-semibold text-zinc-900">Queue</p>
                        <p className="text-xs text-zinc-500">
                            {filteredDocuments.length} document{filteredDocuments.length === 1 ? '' : 's'}
                            {statusFilter === 'PENDING' && pendingCount > 0 ? ` · ${pendingCount} waiting` : ''}
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {filteredDocuments.length === 0 ? (
                            <EmptyState
                                icon={BadgeCheck}
                                title="Queue is clear"
                                description="No documents match your filters."
                                className="py-12"
                            />
                        ) : (
                            <ul className="divide-y divide-zinc-100">
                                {filteredDocuments.map((document) => {
                                    const isSelected = document.id === selectedId
                                    const isBusy = activeDocumentId === document.id

                                    return (
                                        <li key={document.id}>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedId(document.id)}
                                                className={cn(
                                                    'w-full px-4 py-3 text-left transition-colors',
                                                    isSelected
                                                        ? 'bg-amber-50/80 border-l-2 border-l-gold-500'
                                                        : 'hover:bg-zinc-50 border-l-2 border-l-transparent'
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium text-zinc-900">
                                                            {getUserLabel(document)}
                                                        </p>
                                                        <p className="mt-0.5 truncate text-xs text-zinc-500">
                                                            {formatDocumentType(document.type)}
                                                        </p>
                                                    </div>
                                                    <Badge variant={getStatusVariant(document.status)}>
                                                        {document.status.toLowerCase()}
                                                    </Badge>
                                                </div>
                                                <p className="mt-2 text-xs text-zinc-400">
                                                    {formatRelativeTime(document.uploadedAt)}
                                                    {isBusy ? ' · Saving...' : ''}
                                                </p>
                                            </button>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </div>
                </Card>

                {/* Review panel */}
                <Card className="flex flex-col overflow-hidden">
                    {!selectedDocument ? (
                        <EmptyState
                            icon={FileText}
                            title="Select a document"
                            description="Choose an item from the queue to review customer identity details."
                            className="flex-1"
                        />
                    ) : (
                        <>
                            <div className="border-b border-zinc-200 px-6 py-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-lg font-semibold text-zinc-900">
                                                {getUserLabel(selectedDocument)}
                                            </h2>
                                            <Badge variant={getStatusVariant(selectedDocument.status)}>
                                                {selectedDocument.status.toLowerCase()}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 text-sm text-zinc-500">{selectedDocument.user?.email}</p>
                                        <Link
                                            href={adminRoutes.customerDetails(selectedDocument.userId)}
                                            className="mt-2 inline-flex text-sm font-medium text-gold-700 hover:text-gold-600"
                                        >
                                            View customer profile
                                        </Link>
                                    </div>
                                        <a
                                            href={selectedDocument.filePath}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            Open document
                                        </a>
                                </div>
                            </div>

                            <CardContent className="flex flex-1 flex-col gap-6 p-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                            Document
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-zinc-900">
                                            {formatDocumentType(selectedDocument.type)}
                                        </p>
                                        <p className="mt-1 truncate text-xs text-zinc-500">{selectedDocument.fileName}</p>
                                    </div>
                                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                            Submitted
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-zinc-900">
                                            {formatRelativeTime(selectedDocument.uploadedAt)}
                                        </p>
                                        {selectedDocument.reviewedAt && (
                                            <p className="mt-1 text-xs text-zinc-500">
                                                Reviewed {formatRelativeTime(selectedDocument.reviewedAt)}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {selectedDocument.rejectionReason && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                        <p className="text-xs font-medium uppercase tracking-wide text-red-600">
                                            Rejection reason
                                        </p>
                                        <p className="mt-1 text-sm text-red-800">{selectedDocument.rejectionReason}</p>
                                    </div>
                                )}

                                {selectedDocument.status === 'PENDING' ? (
                                    <div className="mt-auto flex flex-col gap-3 border-t border-zinc-200 pt-6 sm:flex-row">
                                        <Button
                                            className="flex-1"
                                            disabled={activeDocumentId === selectedDocument.id}
                                            onClick={() => void handleReview(selectedDocument.id, 'approve')}
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            Approve document
                                        </Button>
                                        <Button
                                            variant="danger"
                                            className="flex-1"
                                            disabled={activeDocumentId === selectedDocument.id}
                                            onClick={() => openRejectDialog(selectedDocument)}
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Reject document
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="mt-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                                        This document has already been reviewed. Select another pending item to
                                        continue.
                                    </div>
                                )}
                            </CardContent>
                        </>
                    )}
                </Card>
            </div>

            {rejectTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-md shadow-card-hover">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-zinc-900">Reject document</h3>
                            <p className="mt-1 text-sm text-zinc-500">
                                Tell {getUserLabel(rejectTarget)} why this submission was rejected. This is stored in
                                the audit log.
                            </p>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={4}
                                placeholder="e.g. Document is blurry and the ID number is not readable."
                                className="mt-4 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                            />
                            <p className="mt-2 text-xs text-zinc-400">Minimum 10 characters.</p>
                            <div className="mt-6 flex justify-end gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setRejectTarget(null)
                                        setRejectionReason('')
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button variant="danger" onClick={submitRejection}>
                                    Confirm rejection
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}

export default KycManagement
