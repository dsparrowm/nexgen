'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { apiClient, PlatformAccessControl, PlatformFeatureFlags } from '@/lib/api'
import { useToast } from '@/components/ToastContext'
import {
    AlertTriangle,
    CheckCircle,
    DollarSign,
    Loader2,
    RefreshCw,
    Save,
    Server,
    Settings,
    Shield,
    SlidersHorizontal,
    ToggleLeft,
    ToggleRight,
    Bell,
} from 'lucide-react'

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

const tabConfig = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'flags', name: 'Feature Flags', icon: SlidersHorizontal },
    { id: 'access', name: 'Access Control', icon: Shield },
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
        } catch (error) {
            console.error('Error saving settings:', error)
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
        if (activeTab === 'flags') {
            return 'Save Flags'
        }
        if (activeTab === 'access') {
            return 'Save Access'
        }
        return 'Save Settings'
    }, [activeTab])

    return (
        <div className="space-y-6">
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-purple-500" />
                        <p className="text-gray-400">Loading system settings...</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                        <div>
                            <h3 className="font-semibold text-red-400">Error Loading Settings</h3>
                            <p className="mt-1 text-sm text-red-300">{error}</p>
                        </div>
                        <button
                            onClick={loadPlatformConfig}
                            className="ml-auto rounded-lg bg-red-500/20 px-4 py-2 text-red-400 transition-colors hover:bg-red-500/30"
                        >
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
                        transition={{ duration: 0.6 }}
                        className="rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-6"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="mb-2 text-2xl font-bold text-white">System Settings</h2>
                                <p className="text-gray-300">Configure platform settings, access control, and feature flags.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={saveAction}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:from-green-600 hover:to-green-700 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700"
                                >
                                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                    <span>{isSaving ? 'Saving...' : savingLabel}</span>
                                </button>
                                <button
                                    onClick={loadPlatformConfig}
                                    className="rounded-xl p-3 text-gray-400 transition-colors hover:bg-navy-700/50 hover:text-white"
                                >
                                    <RefreshCw className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.6 }}
                        className="overflow-hidden rounded-xl border border-gold-500/20 bg-dark-800/50 backdrop-blur-sm"
                    >
                        <div className="flex overflow-x-auto">
                            {tabConfig.map((tab) => {
                                const Icon = tab.icon
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                        className={`flex items-center gap-2 border-b-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                                            activeTab === tab.id
                                                ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                                                : 'border-transparent text-gray-400 hover:bg-navy-800/50 hover:text-white'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{tab.name}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </motion.div>

                    {activeTab === 'general' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="space-y-6 rounded-xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm"
                        >
                            <div>
                                <h3 className="text-xl font-semibold text-white">General configuration</h3>
                                <p className="mt-1 text-sm text-gray-400">Core platform values, security thresholds, and notification defaults.</p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {generalFields.map((field) => {
                                    const value = settings[field.key]

                                    return (
                                        <label key={field.key} className="rounded-xl border border-gold-500/10 bg-navy-900/40 p-4">
                                            <span className="mb-2 block text-sm font-medium text-white">{field.label}</span>
                                            {field.type === 'checkbox' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => updateGeneralField(field.key, !Boolean(value) as never)}
                                                    className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                                                        Boolean(value)
                                                            ? 'border-green-500/30 bg-green-500/10 text-green-300'
                                                            : 'border-gray-700 bg-dark-900/60 text-gray-300 hover:border-gray-600'
                                                    }`}
                                                >
                                                    <span>{Boolean(value) ? 'Enabled' : 'Disabled'}</span>
                                                    {Boolean(value) ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                                                </button>
                                            ) : (
                                                <input
                                                    type={field.type}
                                                    value={value as string | number}
                                                    onChange={(event) => {
                                                        const nextValue = field.type === 'number' ? Number(event.target.value) : event.target.value
                                                        updateGeneralField(field.key, nextValue as never)
                                                    }}
                                                    className="w-full rounded-lg border border-gray-700 bg-dark-900/60 px-4 py-3 text-white outline-none transition-colors placeholder:text-gray-500 focus:border-gold-500/40"
                                                />
                                            )}
                                        </label>
                                    )
                                })}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'flags' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="space-y-6 rounded-xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm"
                        >
                            <div>
                                <h3 className="text-xl font-semibold text-white">Feature flags</h3>
                                <p className="mt-1 text-sm text-gray-400">Switch platform capabilities on and off without changing application code.</p>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                                {featureFlagMeta.map((flag) => {
                                    const enabled = featureFlags[flag.key]
                                    return (
                                        <button
                                            key={flag.key}
                                            type="button"
                                            onClick={() => updateFeatureFlag(flag.key, !enabled)}
                                            className={`rounded-2xl border p-5 text-left transition-all ${
                                                enabled
                                                    ? 'border-green-500/30 bg-green-500/10'
                                                    : 'border-gray-700 bg-navy-900/40 hover:border-gold-500/20'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h4 className="text-base font-semibold text-white">{flag.title}</h4>
                                                    <p className="mt-1 text-sm leading-6 text-gray-400">{flag.description}</p>
                                                </div>
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${enabled ? 'bg-green-500/20 text-green-300' : 'bg-gray-700/70 text-gray-300'}`}>
                                                    {enabled ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'access' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="space-y-6 rounded-xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm"
                        >
                            <div>
                                <h3 className="text-xl font-semibold text-white">Access control</h3>
                                <p className="mt-1 text-sm text-gray-400">Define which admin role can manage each part of the platform.</p>
                            </div>

                            <div className="space-y-6">
                                {(Object.keys(accessControl) as AccessRoleKey[]).map((role) => (
                                    <div key={role} className="rounded-2xl border border-gray-700 bg-navy-900/40 p-5">
                                        <div className="mb-4 flex items-center justify-between gap-4">
                                            <div>
                                                <h4 className="text-lg font-semibold text-white">{role}</h4>
                                                <p className="text-sm text-gray-400">
                                                    {role === 'SUPER_ADMIN'
                                                        ? 'Full platform access and system administration.'
                                                        : 'Scoped administration for day-to-day operations.'}
                                                </p>
                                            </div>
                                            <span className="rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-300">
                                                {role === 'SUPER_ADMIN' ? 'Elevated' : 'Scoped'}
                                            </span>
                                        </div>

                                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                            {accessFields.map((field) => {
                                                const enabled = accessControl[role][field.key]
                                                return (
                                                    <button
                                                        key={field.key}
                                                        type="button"
                                                        onClick={() => updateAccessField(role, field.key, !enabled)}
                                                        className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                                                            enabled
                                                                ? 'border-green-500/30 bg-green-500/10 text-green-300'
                                                                : 'border-gray-700 bg-dark-900/60 text-gray-300 hover:border-gold-500/20'
                                                        }`}
                                                    >
                                                        <span className="text-sm font-medium">{field.label}</span>
                                                        {enabled ? <CheckCircle className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="rounded-xl border border-green-500/20 bg-green-500/10 p-4"
                    >
                        <div className="flex items-start gap-3">
                            <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
                            <div>
                                <h4 className="mb-1 text-sm font-semibold text-green-400">Backend Integration Complete</h4>
                                <p className="text-xs text-gray-400">
                                    Platform settings, feature flags, and access control are now backed by the admin API and persisted in the database.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    )
}

export default SystemSettings
