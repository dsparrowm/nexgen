'use client'

import React, { useEffect, useState } from 'react'
import { apiClient, GrowthPromotions } from '@/lib/api'
import { useToast } from '@/components/ToastContext'
import { AlertTriangle, CheckCircle, RefreshCw, Save, Trophy, Gift, ToggleLeft, ToggleRight } from 'lucide-react'
import {
    Button,
    Card,
    CardContent,
    IconButton,
    Input,
    Skeleton,
    WorkspaceHeader,
} from '@/components/ui'
import { cn } from '@/lib/utils'

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

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-16 w-full" />
                <div className="grid gap-4 md:grid-cols-2">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <WorkspaceHeader
                title="Promotion Controls"
                description="Manage referral bonuses, welcome bonuses, and leaderboard visibility."
                action={
                    <div className="flex items-center gap-2">
                        <Button onClick={savePromotions} disabled={isSaving}>
                            {isSaving ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {isSaving ? 'Saving...' : 'Save promotions'}
                        </Button>
                        <IconButton onClick={loadPromotions} title="Refresh">
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
                                <p className="text-sm font-medium text-red-700">Error loading promotions</p>
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={loadPromotions}>
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            {!error && (
                <>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardContent className="p-5">
                                <Input
                                    label="Referral bonus amount"
                                    type="number"
                                    value={promotions.referralBonusAmount}
                                    onChange={(event) =>
                                        setPromotions((current) => ({
                                            ...current,
                                            referralBonusAmount: Number(event.target.value),
                                        }))
                                    }
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-5">
                                <Input
                                    label="Welcome bonus amount"
                                    type="number"
                                    value={promotions.welcomeBonusAmount}
                                    onChange={(event) =>
                                        setPromotions((current) => ({
                                            ...current,
                                            welcomeBonusAmount: Number(event.target.value),
                                        }))
                                    }
                                />
                            </CardContent>
                        </Card>

                        {promotionToggles.map((item) => {
                            const enabled = promotions[item.key]
                            const Icon = item.icon
                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setPromotions((current) => ({ ...current, [item.key]: !enabled }))}
                                    className={cn(
                                        'rounded-xl border p-5 text-left transition-colors',
                                        enabled
                                            ? 'border-green-200 bg-green-50'
                                            : 'border-zinc-200 bg-white hover:border-zinc-300'
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-lg bg-gold-50 p-2">
                                                <Icon className="h-5 w-5 text-gold-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-zinc-900">{item.title}</h3>
                                                <p className="mt-1 text-sm text-zinc-500">{item.description}</p>
                                            </div>
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
                    </div>

                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="flex items-start gap-3 p-4">
                            <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                            <p className="text-sm text-green-700">
                                Promotion settings persist in the backend, so growth controls can be managed from the
                                admin dashboard.
                            </p>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}

export default GrowthPromotionsWorkspace
