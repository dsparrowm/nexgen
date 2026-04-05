'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiClient, CommunicationPolicy } from '@/lib/api'
import { useToast } from '@/components/ToastContext'
import { AlertTriangle, CheckCircle, Loader2, RefreshCw, Save, Settings, Shield, ToggleLeft, ToggleRight } from 'lucide-react'

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

    return (
        <div className="space-y-6">
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
            )}

            {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                        <div>
                            <h3 className="font-semibold text-red-400">Error Loading Governance</h3>
                            <p className="mt-1 text-sm text-red-300">{error}</p>
                        </div>
                        <button onClick={loadPolicy} className="ml-auto rounded-lg bg-red-500/20 px-4 py-2 text-red-400 transition-colors hover:bg-red-500/30">
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {!isLoading && !error && (
                <>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="inline-flex rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">
                                    Communications
                                </div>
                                <h2 className="mt-4 text-2xl font-bold text-white">Outbound messaging governance</h2>
                                <p className="mt-2 text-gray-300">Control how broadcasts are scheduled, approved, and targeted.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={savePolicy}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-green-600 hover:to-green-700 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700"
                                >
                                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                    <span>{isSaving ? 'Saving...' : 'Save Policy'}</span>
                                </button>
                                <button onClick={loadPolicy} className="rounded-xl p-3 text-gray-400 transition-colors hover:bg-navy-700/50 hover:text-white">
                                    <RefreshCw className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {communicationItems.map((item) => {
                            const enabled = policy[item.key]
                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setPolicy((current) => ({ ...current, [item.key]: !enabled }))}
                                    className={`rounded-2xl border p-5 text-left transition-all ${
                                        enabled ? 'border-green-500/30 bg-green-500/10' : 'border-gray-700 bg-navy-900/40 hover:border-gold-500/20'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-base font-semibold text-white">{item.title}</h3>
                                            <p className="mt-1 text-sm leading-6 text-gray-400">{item.description}</p>
                                        </div>
                                        {enabled ? <ToggleRight className="h-5 w-5 text-green-300" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                                    </div>
                                </button>
                            )
                        })}

                        <label className="rounded-2xl border border-gray-700 bg-navy-900/40 p-5">
                            <span className="mb-2 block text-sm font-medium text-white">Default broadcast channel</span>
                            <select
                                value={policy.defaultChannel}
                                onChange={(event) =>
                                    setPolicy((current) => ({
                                        ...current,
                                        defaultChannel: event.target.value as CommunicationPolicy['defaultChannel'],
                                    }))
                                }
                                className="w-full rounded-lg border border-gray-700 bg-dark-900/60 px-4 py-3 text-white outline-none focus:border-gold-500/40"
                            >
                                <option value="email">Email</option>
                                <option value="sms">SMS</option>
                                <option value="in-app">In-app</option>
                            </select>
                        </label>
                    </div>

                    <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
                            <p className="text-sm text-gray-300">
                                Governance settings now persist in the backend so outbound messaging can be controlled from the admin dashboard.
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default CommunicationGovernance
