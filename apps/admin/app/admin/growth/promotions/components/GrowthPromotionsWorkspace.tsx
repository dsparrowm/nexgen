'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiClient, GrowthPromotions } from '@/lib/api'
import { useToast } from '@/components/ToastContext'
import { AlertTriangle, CheckCircle, Loader2, RefreshCw, Save, Trophy, Gift, ToggleLeft, ToggleRight } from 'lucide-react'

const defaultPromotions: GrowthPromotions = {
    referralBonusAmount: 25,
    welcomeBonusAmount: 10,
    leaderboardEnabled: true,
    promotionCampaignsEnabled: true,
    autoApproveReferralBonuses: false,
}

const GrowthPromotionsWorkspace = () => {
    const [promotions, setPromotions] = useState<GrowthPromotions>(defaultPromotions)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { addToast } = useToast()

    const loadPromotions = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await apiClient.getGrowthPromotions()
            if (response.success && response.data) {
                setPromotions({ ...defaultPromotions, ...response.data })
            } else {
                setError(response.error?.message || 'Failed to load growth promotions')
            }
        } catch (err) {
            console.error('Error loading growth promotions:', err)
            setError('An error occurred while loading growth promotions')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadPromotions()
    }, [])

    const savePromotions = async () => {
        setIsSaving(true)
        try {
            const response = await apiClient.updateGrowthPromotions(promotions)
            if (response.success) {
                addToast('success', 'Saved', 'Growth promotions updated successfully')
                await loadPromotions()
            } else {
                addToast('error', 'Save Failed', response.error?.message || 'Unable to save growth promotions')
            }
        } catch (err) {
            console.error('Error saving growth promotions:', err)
            addToast('error', 'Save Error', 'An error occurred while saving growth promotions')
        } finally {
            setIsSaving(false)
        }
    }

    const promotionToggles = [
        {
            key: 'leaderboardEnabled',
            title: 'Leaderboard visibility',
            description: 'Expose referral leaderboard rankings in the admin dashboard.',
            icon: Trophy,
        },
        {
            key: 'promotionCampaignsEnabled',
            title: 'Promotion campaigns',
            description: 'Allow active campaign toggles and bonus rule changes.',
            icon: Gift,
        },
        {
            key: 'autoApproveReferralBonuses',
            title: 'Auto-approve bonuses',
            description: 'Automatically process referral bonus payouts when conditions are met.',
            icon: CheckCircle,
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
                            <h3 className="font-semibold text-red-400">Error Loading Promotions</h3>
                            <p className="mt-1 text-sm text-red-300">{error}</p>
                        </div>
                        <button onClick={loadPromotions} className="ml-auto rounded-lg bg-red-500/20 px-4 py-2 text-red-400 transition-colors hover:bg-red-500/30">
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
                                    Growth
                                </div>
                                <h2 className="mt-4 text-2xl font-bold text-white">Promotion controls</h2>
                                <p className="mt-2 text-gray-300">Manage referral bonuses, welcome bonuses, and leaderboard visibility.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={savePromotions}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-green-600 hover:to-green-700 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700"
                                >
                                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                    <span>{isSaving ? 'Saving...' : 'Save Promotions'}</span>
                                </button>
                                <button onClick={loadPromotions} className="rounded-xl p-3 text-gray-400 transition-colors hover:bg-navy-700/50 hover:text-white">
                                    <RefreshCw className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="rounded-2xl border border-gray-700 bg-navy-900/40 p-5">
                            <span className="mb-2 block text-sm font-medium text-white">Referral bonus amount</span>
                            <input
                                type="number"
                                value={promotions.referralBonusAmount}
                                onChange={(event) =>
                                    setPromotions((current) => ({
                                        ...current,
                                        referralBonusAmount: Number(event.target.value),
                                    }))
                                }
                                className="w-full rounded-lg border border-gray-700 bg-dark-900/60 px-4 py-3 text-white outline-none focus:border-gold-500/40"
                            />
                        </label>

                        <label className="rounded-2xl border border-gray-700 bg-navy-900/40 p-5">
                            <span className="mb-2 block text-sm font-medium text-white">Welcome bonus amount</span>
                            <input
                                type="number"
                                value={promotions.welcomeBonusAmount}
                                onChange={(event) =>
                                    setPromotions((current) => ({
                                        ...current,
                                        welcomeBonusAmount: Number(event.target.value),
                                    }))
                                }
                                className="w-full rounded-lg border border-gray-700 bg-dark-900/60 px-4 py-3 text-white outline-none focus:border-gold-500/40"
                            />
                        </label>

                        {promotionToggles.map((item) => {
                            const enabled = promotions[item.key]
                            const Icon = item.icon
                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setPromotions((current) => ({ ...current, [item.key]: !enabled }))}
                                    className={`rounded-2xl border p-5 text-left transition-all ${
                                        enabled ? 'border-green-500/30 bg-green-500/10' : 'border-gray-700 bg-navy-900/40 hover:border-gold-500/20'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-2xl bg-gold-500/10 p-3 text-gold-300">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                                                <p className="mt-1 text-sm leading-6 text-gray-400">{item.description}</p>
                                            </div>
                                        </div>
                                        {enabled ? <ToggleRight className="h-5 w-5 text-green-300" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
                            <p className="text-sm text-gray-300">
                                Promotion settings now persist in the backend, so growth controls can be managed from the admin dashboard.
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default GrowthPromotionsWorkspace
