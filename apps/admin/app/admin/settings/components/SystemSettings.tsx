'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api'
import { useToast } from '@/components/ToastContext'
import {
    Settings,
    Server,
    Shield,
    Bell,
    DollarSign,
    FileText,
    Save,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    Loader2
} from 'lucide-react'

const SystemSettings = () => {
    const [activeTab, setActiveTab] = useState('general')
    const [settings, setSettings] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { addToast } = useToast()

    // Fetch system settings
    const fetchSettings = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await apiClient.getSystemSettings()

            if (response.success && response.data) {
                setSettings(response.data)
            } else {
                setError(response.error?.message || 'Failed to load system settings')
            }
        } catch (err) {
            console.error('Error fetching settings:', err)
            setError('An error occurred while loading system settings')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchSettings()
    }, [])

    // Handle saving settings
    const handleSaveSettings = async () => {
        setIsSaving(true)

        try {
            const response = await apiClient.updateSystemSettings(settings)

            if (response.success) {
                addToast('success', 'System settings updated successfully')
            } else {
                addToast('error', 'Update Failed', response.error?.message || 'Failed to update settings')
            }
        } catch (error) {
            console.error('Error saving settings:', error)
            addToast('error', 'Save Error', 'An error occurred while saving settings')
        } finally {
            setIsSaving(false)
        }
    }

    const tabs = [
        { id: 'general', name: 'General', icon: Settings },
        { id: 'investment', name: 'Investment', icon: DollarSign },
        { id: 'security', name: 'Security', icon: Shield },
        { id: 'notifications', name: 'Notifications', icon: Bell },
        { id: 'api', name: 'API & Integrations', icon: Server },
        { id: 'payments', name: 'Payment Settings', icon: FileText }
    ]

    return (
        <div className="space-y-6">
            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
                        <p className="text-gray-400">Loading system settings...</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        <div>
                            <h3 className="text-red-400 font-semibold">Error Loading Settings</h3>
                            <p className="text-red-300 text-sm mt-1">{error}</p>
                        </div>
                        <button
                            onClick={fetchSettings}
                            className="ml-auto px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            {!isLoading && !error && settings && (
                <>
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl p-6 border border-purple-500/20"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">System Settings</h2>
                                <p className="text-gray-300">Configure platform settings and preferences</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={isSaving}
                                    className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Save className="w-5 h-5" />
                                    )}
                                    <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                                </button>
                                <button
                                    onClick={fetchSettings}
                                    className="p-3 text-gray-400 hover:text-white hover:bg-navy-700/50 rounded-xl transition-colors"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Tabs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.6 }}
                        className="bg-dark-800/50 backdrop-blur-sm rounded-xl border border-gold-500/20 overflow-hidden"
                    >
                        <div className="flex overflow-x-auto">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
                                                ? 'border-gold-500 text-gold-400 bg-gold-500/10'
                                                : 'border-transparent text-gray-400 hover:text-white hover:bg-navy-800/50'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{tab.name}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </motion.div>

                    {/* Tab Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="bg-dark-800/50 backdrop-blur-sm rounded-xl border border-gold-500/20 p-6"
                    >
                        <div className="text-center py-12">
                            <Settings className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-400 mb-2">Settings Panel</h3>
                            <p className="text-gray-500">System settings configuration is currently under development.</p>
                            <p className="text-gray-600 text-sm mt-2">Backend integration completed - UI components coming soon.</p>
                        </div>
                    </motion.div>

                    {/* Status Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="bg-green-500/10 border border-green-500/20 rounded-xl p-4"
                    >
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-semibold text-green-400 mb-1">Backend Integration Complete</h4>
                                <p className="text-xs text-gray-400">
                                    System settings are now connected to the backend API with real-time data fetching and updates.
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