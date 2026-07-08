'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { apiClient, PlatformAccessControl, PlatformFeatureFlags } from '@/lib/api'
import { useToast } from '@/components/ToastContext'
import {
    AlertTriangle,
    CheckCircle,
    RefreshCw,
    Save,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react'
import {
    Badge,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    IconButton,
    Input,
    SegmentedControl,
    Skeleton,
    WorkspaceHeader,
} from '@/components/ui'
import { cn } from '@/lib/utils'

type GeneralSettings = {
    platformName: string
    platformUrl: string
    supportEmail: string
    maintenanceMode: boolean
    minimumInvestment: number
    maximumInvestment: number
    defaultInterestRate: number
    compoundingFrequency: string
    withdrawalFee: number
    sessionTimeout: number
    maxLoginAttempts: number
    twoFactorRequired: boolean
    passwordMinLength: number
    emailNotifications: boolean
    smsNotifications: boolean
    pushNotifications: boolean
    apiRateLimit: number
    apiKeyExpiration: number
    backupFrequency: string
    retentionPeriod: number
}

type AccessRoleKey = keyof PlatformAccessControl

const defaultGeneralSettings: GeneralSettings = {
    platformName: 'NexGen Investment Platform',
    platformUrl: 'https://nexgen.investment',
    supportEmail: 'support@nexgen.investment',
    maintenanceMode: false,
    minimumInvestment: 100,
    maximumInvestment: 100000,
    defaultInterestRate: 12.5,
    compoundingFrequency: 'monthly',
    withdrawalFee: 2.5,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    twoFactorRequired: false,
    passwordMinLength: 8,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: false,
    apiRateLimit: 1000,
    apiKeyExpiration: 365,
    backupFrequency: 'daily',
    retentionPeriod: 90,
}

const defaultFeatureFlags: PlatformFeatureFlags = {
    enableBroadcastNotifications: true,
    enableReferralGovernance: true,
    enableComplianceQueue: true,
    enableTreasuryApprovals: true,
    enablePlatformAccessControl: true,
    enableAssetDesk: true,
}

const defaultAccessControl: PlatformAccessControl = {
    ADMIN: {
        canManageUsers: true,
        canManageTreasury: true,
        canManageAssets: true,
        canManageMining: true,
        canManageCompliance: true,
        canManageCommunications: true,
        canManageGrowth: true,
        canManageSettings: false,
    },
    SUPER_ADMIN: {
        canManageUsers: true,
        canManageTreasury: true,
        canManageAssets: true,
        canManageMining: true,
        canManageCompliance: true,
        canManageCommunications: true,
        canManageGrowth: true,
        canManageSettings: true,
    },
}

const tabOptions = [
    { value: 'general', label: 'General' },
    { value: 'flags', label: 'Feature Flags' },
    { value: 'access', label: 'Access Control' },
]

const generalFields: Array<{ key: keyof GeneralSettings; label: string; type: 'text' | 'number' | 'checkbox' }> = [
    { key: 'platformName', label: 'Platform name', type: 'text' },
    { key: 'platformUrl', label: 'Platform URL', type: 'text' },
    { key: 'supportEmail', label: 'Support email', type: 'text' },
    { key: 'maintenanceMode', label: 'Maintenance mode', type: 'checkbox' },
    { key: 'minimumInvestment', label: 'Minimum investment', type: 'number' },
    { key: 'maximumInvestment', label: 'Maximum investment', type: 'number' },
    { key: 'defaultInterestRate', label: 'Default interest rate', type: 'number' },
    { key: 'compoundingFrequency', label: 'Compounding frequency', type: 'text' },
    { key: 'withdrawalFee', label: 'Withdrawal fee', type: 'number' },
    { key: 'sessionTimeout', label: 'Session timeout (min)', type: 'number' },
    { key: 'maxLoginAttempts', label: 'Max login attempts', type: 'number' },
    { key: 'twoFactorRequired', label: 'Two-factor required', type: 'checkbox' },
    { key: 'passwordMinLength', label: 'Password min length', type: 'number' },
    { key: 'emailNotifications', label: 'Email notifications', type: 'checkbox' },
    { key: 'smsNotifications', label: 'SMS notifications', type: 'checkbox' },
    { key: 'pushNotifications', label: 'Push notifications', type: 'checkbox' },
    { key: 'apiRateLimit', label: 'API rate limit', type: 'number' },
    { key: 'apiKeyExpiration', label: 'API key expiration (days)', type: 'number' },
    { key: 'backupFrequency', label: 'Backup frequency', type: 'text' },
    { key: 'retentionPeriod', label: 'Retention period (days)', type: 'number' },
]

const featureFlagMeta = [
    {
        key: 'enableBroadcastNotifications',
        title: 'Broadcast notifications',
        description: 'Allow admins to send system-wide announcements and alerts.',
    },
    {
        key: 'enableReferralGovernance',
        title: 'Referral governance',
        description: 'Expose referral oversight and bonus adjustment controls.',
    },
    {
        key: 'enableComplianceQueue',
        title: 'Compliance queue',
        description: 'Keep compliance review and account restriction workflows active.',
    },
    {
        key: 'enableTreasuryApprovals',
        title: 'Treasury approvals',
        description: 'Allow transaction approvals and balance controls.',
    },
    {
        key: 'enablePlatformAccessControl',
        title: 'Platform access control',
        description: 'Persist admin scope and role management rules in the platform config.',
    },
    {
        key: 'enableAssetDesk',
        title: 'Asset desk',
        description: 'Enable admin control over crypto asset positions and valuation tools.',
    },
] as const

const accessFields = [
    { key: 'canManageUsers', label: 'Users' },
    { key: 'canManageTreasury', label: 'Treasury' },
    { key: 'canManageAssets', label: 'Assets' },
    { key: 'canManageMining', label: 'Mining' },
    { key: 'canManageCompliance', label: 'Compliance' },
    { key: 'canManageCommunications', label: 'Communications' },
    { key: 'canManageGrowth', label: 'Growth' },
    { key: 'canManageSettings', label: 'Settings' },
] as const

const SystemSettings = () => {
    const [activeTab, setActiveTab] = useState<'general' | 'flags' | 'access'>('general')
    const [settings, setSettings] = useState<GeneralSettings>(defaultGeneralSettings)
    const [featureFlags, setFeatureFlags] = useState<PlatformFeatureFlags>(defaultFeatureFlags)
    const [accessControl, setAccessControl] = useState<PlatformAccessControl>(defaultAccessControl)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { addToast } = useToast()

    const loadPlatformConfig = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const [settingsResponse, flagsResponse, accessResponse] = await Promise.all([
                apiClient.getSystemSettings(),
                apiClient.getFeatureFlags(),
                apiClient.getAccessControl(),
            ])

            if (settingsResponse.success && settingsResponse.data) {
                const response = settingsResponse.data as Partial<GeneralSettings> & {
                    featureFlags?: PlatformFeatureFlags
                    accessControl?: PlatformAccessControl
                }

                setSettings({
                    ...defaultGeneralSettings,
                    ...response,
                })

                if (response.featureFlags) {
                    setFeatureFlags({
                        ...defaultFeatureFlags,
                        ...response.featureFlags,
                    })
                }

                if (response.accessControl) {
                    setAccessControl({
                        ...defaultAccessControl,
                        ...response.accessControl,
                    })
                }
            } else {
                setError(settingsResponse.error?.message || 'Failed to load system settings')
            }

            if (flagsResponse.success && flagsResponse.data) {
                setFeatureFlags({
                    ...defaultFeatureFlags,
                    ...flagsResponse.data,
                })
            }

            if (accessResponse.success && accessResponse.data) {
                setAccessControl({
                    ...defaultAccessControl,
                    ...accessResponse.data,
                })
            }

            if (!flagsResponse.success) {
                setError(flagsResponse.error?.message || 'Failed to load feature flags')
            }

            if (!accessResponse.success) {
                setError(accessResponse.error?.message || 'Failed to load access control')
            }
        } catch (err) {
            console.error('Error fetching settings:', err)
            setError('An error occurred while loading platform settings')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadPlatformConfig()
    }, [])

    const saveAction = async () => {
        setIsSaving(true)

        try {
            let response

            if (activeTab === 'flags') {
                response = await apiClient.updateFeatureFlags(featureFlags)
            } else if (activeTab === 'access') {
                response = await apiClient.updateAccessControl(accessControl)
            } else {
                response = await apiClient.updateSystemSettings(settings)
            }

            if (response?.success) {
                addToast('success', 'Saved', 'Platform settings updated successfully')
                await loadPlatformConfig()
            } else {
                addToast('error', 'Update Failed', response?.error?.message || 'Unable to save settings')
            }
        } catch (saveError) {
            console.error('Error saving settings:', saveError)
            addToast('error', 'Save Error', 'An error occurred while saving settings')
        } finally {
            setIsSaving(false)
        }
    }

    const updateGeneralField = <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) => {
        setSettings((current) => ({ ...current, [key]: value }))
    }

    const updateFeatureFlag = (key: keyof PlatformFeatureFlags, value: boolean) => {
        setFeatureFlags((current) => ({ ...current, [key]: value }))
    }

    const updateAccessField = (role: AccessRoleKey, key: keyof PlatformAccessControl[AccessRoleKey], value: boolean) => {
        setAccessControl((current) => ({
            ...current,
            [role]: {
                ...current[role],
                [key]: value,
            },
        }))
    }

    const savingLabel = useMemo(() => {
        if (activeTab === 'flags') return 'Save Flags'
        if (activeTab === 'access') return 'Save Access'
        return 'Save Settings'
    }, [activeTab])

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-80" />
                <div className="grid gap-4 md:grid-cols-2">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-20" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <WorkspaceHeader
                title="System Settings"
                description="Configure platform settings, access control, and feature flags."
                action={
                    <div className="flex items-center gap-2">
                        <Button onClick={saveAction} disabled={isSaving}>
                            {isSaving ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {isSaving ? 'Saving...' : savingLabel}
                        </Button>
                        <IconButton onClick={loadPlatformConfig} title="Refresh">
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
                                <p className="text-sm font-medium text-red-700">Error loading settings</p>
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={loadPlatformConfig}>
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            {!error && (
                <>
                    <SegmentedControl
                        options={tabOptions}
                        value={activeTab}
                        onChange={(value) => setActiveTab(value as typeof activeTab)}
                    />

                    {activeTab === 'general' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">General configuration</CardTitle>
                                <CardDescription>
                                    Core platform values, security thresholds, and notification defaults.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {generalFields.map((field) => {
                                        const value = settings[field.key]

                                        if (field.type === 'checkbox') {
                                            const enabled = Boolean(value)
                                            return (
                                                <button
                                                    key={field.key}
                                                    type="button"
                                                    onClick={() => updateGeneralField(field.key, !enabled as never)}
                                                    className={cn(
                                                        'flex items-center justify-between rounded-lg border p-4 text-left transition-colors',
                                                        enabled
                                                            ? 'border-green-200 bg-green-50 text-green-700'
                                                            : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300'
                                                    )}
                                                >
                                                    <span className="text-sm font-medium">{field.label}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs">{enabled ? 'Enabled' : 'Disabled'}</span>
                                                        {enabled ? (
                                                            <ToggleRight className="h-5 w-5" />
                                                        ) : (
                                                            <ToggleLeft className="h-5 w-5" />
                                                        )}
                                                    </div>
                                                </button>
                                            )
                                        }

                                        return (
                                            <Input
                                                key={field.key}
                                                label={field.label}
                                                type={field.type}
                                                value={value as string | number}
                                                onChange={(event) => {
                                                    const nextValue =
                                                        field.type === 'number'
                                                            ? Number(event.target.value)
                                                            : event.target.value
                                                    updateGeneralField(field.key, nextValue as never)
                                                }}
                                            />
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'flags' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Feature flags</CardTitle>
                                <CardDescription>
                                    Switch platform capabilities on and off without changing application code.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 lg:grid-cols-2">
                                    {featureFlagMeta.map((flag) => {
                                        const enabled = featureFlags[flag.key]
                                        return (
                                            <button
                                                key={flag.key}
                                                type="button"
                                                onClick={() => updateFeatureFlag(flag.key, !enabled)}
                                                className={cn(
                                                    'rounded-xl border p-5 text-left transition-colors',
                                                    enabled
                                                        ? 'border-green-200 bg-green-50'
                                                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-zinc-900">{flag.title}</h4>
                                                        <p className="mt-1 text-sm text-zinc-500">{flag.description}</p>
                                                    </div>
                                                    <Badge variant={enabled ? 'success' : 'neutral'}>
                                                        {enabled ? 'Enabled' : 'Disabled'}
                                                    </Badge>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'access' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Access control</CardTitle>
                                <CardDescription>
                                    Define which admin role can manage each part of the platform.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {(Object.keys(accessControl) as AccessRoleKey[]).map((role) => (
                                    <div key={role} className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                                        <div className="mb-4 flex items-center justify-between gap-4">
                                            <div>
                                                <h4 className="text-sm font-semibold text-zinc-900">{role}</h4>
                                                <p className="text-sm text-zinc-500">
                                                    {role === 'SUPER_ADMIN'
                                                        ? 'Full platform access and system administration.'
                                                        : 'Scoped administration for day-to-day operations.'}
                                                </p>
                                            </div>
                                            <Badge variant="gold">
                                                {role === 'SUPER_ADMIN' ? 'Elevated' : 'Scoped'}
                                            </Badge>
                                        </div>

                                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                            {accessFields.map((field) => {
                                                const enabled = accessControl[role][field.key]
                                                return (
                                                    <button
                                                        key={field.key}
                                                        type="button"
                                                        onClick={() => updateAccessField(role, field.key, !enabled)}
                                                        className={cn(
                                                            'flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors',
                                                            enabled
                                                                ? 'border-green-200 bg-green-50 text-green-700'
                                                                : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                                                        )}
                                                    >
                                                        <span className="text-sm font-medium">{field.label}</span>
                                                        {enabled ? (
                                                            <CheckCircle className="h-4 w-4" />
                                                        ) : (
                                                            <ToggleLeft className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="flex items-start gap-3 p-4">
                            <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                            <div>
                                <h4 className="text-sm font-semibold text-green-700">Backend integration complete</h4>
                                <p className="text-xs text-green-600">
                                    Platform settings, feature flags, and access control are backed by the admin API and
                                    persisted in the database.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}

export default SystemSettings
