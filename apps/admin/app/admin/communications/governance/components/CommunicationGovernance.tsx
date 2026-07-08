'use client'

import React, { useEffect, useState } from 'react'
import { apiClient, CommunicationPolicy } from '@/lib/api'
import { useToast } from '@/components/ToastContext'
import { AlertTriangle, CheckCircle, RefreshCw, Save, ToggleLeft, ToggleRight } from 'lucide-react'
import {
    Button,
    Card,
    CardContent,
    IconButton,
    Select,
    Skeleton,
    WorkspaceHeader,
} from '@/components/ui'
import { cn } from '@/lib/utils'

const defaultPolicy: CommunicationPolicy = {
    allowScheduledBroadcasts: true,
    requireTemplateApproval: true,
    allowSuppressionList: true,
    defaultChannel: 'email',
}

const CommunicationGovernance = () => {
    const [policy, setPolicy] = useState<CommunicationPolicy>(defaultPolicy)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { addToast } = useToast()

    const loadPolicy = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await apiClient.getCommunicationPolicy()
            if (response.success && response.data) {
                setPolicy({ ...defaultPolicy, ...response.data })
            } else {
                setError(response.error?.message || 'Failed to load communication policy')
            }
        } catch (err) {
            console.error('Error loading communication policy:', err)
            setError('An error occurred while loading communication governance')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadPolicy()
    }, [])

    const savePolicy = async () => {
        setIsSaving(true)
        try {
            const response = await apiClient.updateCommunicationPolicy(policy)
            if (response.success) {
                addToast('success', 'Saved', 'Communication governance updated successfully')
                await loadPolicy()
            } else {
                addToast('error', 'Save Failed', response.error?.message || 'Unable to save communication policy')
            }
        } catch (err) {
            console.error('Error saving communication policy:', err)
            addToast('error', 'Save Error', 'An error occurred while saving communication governance')
        } finally {
            setIsSaving(false)
        }
    }

    const communicationItems = [
        {
            key: 'allowScheduledBroadcasts',
            title: 'Scheduled broadcasts',
            description: 'Let admins queue announcements for a later send time.',
        },
        {
            key: 'requireTemplateApproval',
            title: 'Template approval',
            description: 'Require review before a message template can be used.',
        },
        {
            key: 'allowSuppressionList',
            title: 'Suppression list',
            description: 'Keep a central list of users who should not receive outbound messages.',
        },
    ] as const

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-16 w-full" />
                <div className="grid gap-4 md:grid-cols-2">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <WorkspaceHeader
                title="Communication Governance"
                description="Control how broadcasts are scheduled, approved, and targeted."
                action={
                    <div className="flex items-center gap-2">
                        <Button onClick={savePolicy} disabled={isSaving}>
                            {isSaving ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {isSaving ? 'Saving...' : 'Save policy'}
                        </Button>
                        <IconButton onClick={loadPolicy} title="Refresh">
                            <RefreshCw className="h-4 w-4" />
                        </IconButton>
                    </div>
                }
            />

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <div>
                                <p className="text-sm font-medium text-red-700">Error loading governance</p>
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={loadPolicy}>
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            {!error && (
                <>
                    <div className="grid gap-4 md:grid-cols-2">
                        {communicationItems.map((item) => {
                            const enabled = policy[item.key]
                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setPolicy((current) => ({ ...current, [item.key]: !enabled }))}
                                    className={cn(
                                        'rounded-xl border p-5 text-left transition-colors',
                                        enabled
                                            ? 'border-green-200 bg-green-50'
                                            : 'border-zinc-200 bg-white hover:border-zinc-300'
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-sm font-semibold text-zinc-900">{item.title}</h3>
                                            <p className="mt-1 text-sm text-zinc-500">{item.description}</p>
                                        </div>
                                        {enabled ? (
                                            <ToggleRight className="h-5 w-5 shrink-0 text-green-600" />
                                        ) : (
                                            <ToggleLeft className="h-5 w-5 shrink-0 text-zinc-400" />
                                        )}
                                    </div>
                                </button>
                            )
                        })}

                        <Card>
                            <CardContent className="p-5">
                                <Select
                                    label="Default broadcast channel"
                                    value={policy.defaultChannel}
                                    onChange={(event) =>
                                        setPolicy((current) => ({
                                            ...current,
                                            defaultChannel: event.target.value as CommunicationPolicy['defaultChannel'],
                                        }))
                                    }
                                >
                                    <option value="email">Email</option>
                                    <option value="sms">SMS</option>
                                    <option value="in-app">In-app</option>
                                </Select>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="flex items-start gap-3 p-4">
                            <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                            <p className="text-sm text-green-700">
                                Governance settings persist in the backend so outbound messaging can be controlled from
                                the admin dashboard.
                            </p>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}

export default CommunicationGovernance
