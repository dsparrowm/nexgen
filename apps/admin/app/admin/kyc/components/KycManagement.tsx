'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { apiClient, type AdminKycDocument, type KycDocumentStatus } from '@/lib/api'
import { useToast } from '@/components/ToastContext'
import { BadgeCheck, ExternalLink, FileText, RefreshCw, ShieldAlert } from 'lucide-react'

const STATUS_OPTIONS: Array<KycDocumentStatus | 'ALL'> = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW']
const TYPE_OPTIONS = ['ALL', 'NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE', 'UTILITY_BILL', 'OTHER']

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

const KycManagement: React.FC = () => {
    const { addToast } = useToast()
    const [documents, setDocuments] = useState<AdminKycDocument[]>([])
    const [stats, setStats] = useState<KycStats | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<KycDocumentStatus | 'ALL'>('PENDING')
    const [typeFilter, setTypeFilter] = useState('ALL')
    const [isLoading, setIsLoading] = useState(true)
    const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

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

    const handleReview = async (documentId: string, action: 'approve' | 'reject') => {
        const rejectionReason = action === 'reject'
            ? window.prompt('Enter a rejection reason (10+ characters).')
            : undefined

        if (action === 'reject' && (!rejectionReason || rejectionReason.trim().length < 10)) {
            addToast('error', 'Review cancelled', 'A rejection reason with at least 10 characters is required.')
            return
        }

        setActiveDocumentId(documentId)

        try {
            const response = await apiClient.reviewKycDocument(
                documentId,
                action,
                rejectionReason?.trim()
            )

            if (!response.success) {
                throw new Error(response.error?.message || `Failed to ${action} document`)
            }

            addToast('success', `Document ${action}d`, response.message)
            await loadData()
        } catch (reviewError) {
            console.error('Error reviewing document:', reviewError)
            addToast(
                'error',
                'Review failed',
                reviewError instanceof Error ? reviewError.message : 'Failed to review document'
            )
        } finally {
            setActiveDocumentId(null)
        }
    }

    const filteredDocuments = documents.filter((document) => {
        if (!searchTerm.trim()) return true

        const value = [
            document.user?.email,
            document.user?.username,
            document.user?.firstName,
            document.user?.lastName,
            document.fileName,
            document.type,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

        return value.includes(searchTerm.trim().toLowerCase())
    })

    const formatDate = (value?: string | null) => {
        if (!value) return 'N/A'
        return new Date(value).toLocaleString()
    }

    const getUserLabel = (document: AdminKycDocument) => {
        const fullName = [document.user?.firstName, document.user?.lastName].filter(Boolean).join(' ')
        return fullName || document.user?.username || document.user?.email || 'Unknown user'
    }

    const statCards = stats ? [
        {
            label: 'Pending Documents',
            value: stats.documents?.pending ?? 0,
            tone: 'text-yellow-300 border-yellow-500/20 bg-yellow-500/10',
        },
        {
            label: 'Approved Documents',
            value: stats.documents?.approved ?? 0,
            tone: 'text-green-300 border-green-500/20 bg-green-500/10',
        },
        {
            label: 'Rejected Documents',
            value: stats.documents?.rejected ?? 0,
            tone: 'text-red-300 border-red-500/20 bg-red-500/10',
        },
        {
            label: 'Users Under Review',
            value: stats.users?.underReview ?? 0,
            tone: 'text-blue-300 border-blue-500/20 bg-blue-500/10',
        },
    ] : []

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">KYC Review</h1>
                    <p className="mt-2 text-gray-400">Approve or reject submitted identity documents without leaving the admin workspace.</p>
                </div>
                <button
                    onClick={() => void loadData()}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center rounded-lg border border-gold-500/20 bg-dark-800/70 px-4 py-2 text-sm font-medium text-white transition hover:border-gold-400/40 hover:bg-dark-700 disabled:opacity-50"
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh queue
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {statCards.map((card) => (
                    <div key={card.label} className={`rounded-2xl border p-5 ${card.tone}`}>
                        <p className="text-sm uppercase tracking-[0.2em] text-gray-300">{card.label}</p>
                        <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid gap-4 rounded-2xl border border-gold-500/20 bg-dark-800/60 p-4 lg:grid-cols-[minmax(0,1fr),180px,180px]">
                <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by user, email, filename, or document type"
                    className="rounded-xl border border-white/10 bg-dark-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-gold-400/50"
                />
                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as KycDocumentStatus | 'ALL')}
                    className="rounded-xl border border-white/10 bg-dark-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-gold-400/50"
                >
                    {STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
                <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    className="rounded-xl border border-white/10 bg-dark-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-gold-400/50"
                >
                    {TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            </div>

            {error && !isLoading && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                    {error}
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-gold-500/20 bg-dark-800/60">
                <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <BadgeCheck className="h-5 w-5 text-gold-400" />
                        <div>
                            <h2 className="text-lg font-semibold text-white">Document queue</h2>
                            <p className="text-sm text-gray-400">{filteredDocuments.length} items visible</p>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center px-6 py-16 text-sm text-gray-400">Loading KYC queue...</div>
                ) : filteredDocuments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                        <ShieldAlert className="h-8 w-8 text-gray-500" />
                        <p className="text-sm text-gray-400">No documents match the current filters.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-dark-900/40">
                                <tr className="text-left text-xs uppercase tracking-[0.2em] text-gray-400">
                                    <th className="px-5 py-4">User</th>
                                    <th className="px-5 py-4">Document</th>
                                    <th className="px-5 py-4">Submitted</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4">Review</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredDocuments.map((document) => {
                                    const isBusy = activeDocumentId === document.id
                                    return (
                                        <tr key={document.id} className="align-top">
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-white">{getUserLabel(document)}</p>
                                                <p className="mt-1 text-sm text-gray-400">{document.user?.email || 'No email available'}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-start gap-3">
                                                    <FileText className="mt-0.5 h-4 w-4 text-gold-400" />
                                                    <div>
                                                        <p className="font-medium text-white">{document.type.replace(/_/g, ' ')}</p>
                                                        <p className="mt-1 text-sm text-gray-400">{document.fileName}</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => window.open(document.filePath, '_blank', 'noopener,noreferrer')}
                                                            className="mt-2 inline-flex items-center text-xs text-gold-300 transition hover:text-gold-200"
                                                        >
                                                            Open file
                                                            <ExternalLink className="ml-1 h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-300">
                                                <p>{formatDate(document.uploadedAt)}</p>
                                                {document.reviewedAt && (
                                                    <p className="mt-1 text-xs text-gray-500">Reviewed {formatDate(document.reviewedAt)}</p>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-white">
                                                    {document.status}
                                                </span>
                                                {document.rejectionReason && (
                                                    <p className="mt-2 max-w-xs text-xs text-red-300">{document.rejectionReason}</p>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                {document.status === 'PENDING' ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            disabled={isBusy}
                                                            onClick={() => void handleReview(document.id, 'approve')}
                                                            className="rounded-lg bg-green-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-600 disabled:opacity-50"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={isBusy}
                                                            onClick={() => void handleReview(document.id, 'reject')}
                                                            className="rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-500">Already reviewed</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default KycManagement
