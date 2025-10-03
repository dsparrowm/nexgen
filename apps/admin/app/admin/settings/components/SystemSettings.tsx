'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Settings,
    Server,
    Shield,
    Mail,
    Bell,
    DollarSign,
    Percent,
    Globe,
    Database,
    Key,
    Users,
    FileText,
    Save,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    Info,
    Eye,
    EyeOff
} from 'lucide-react'

const SystemSettings = () => {
    const [activeTab, setActiveTab] = useState('general')
    const [showApiKey, setShowApiKey] = useState(false)
    const [settings, setSettings] = useState({
        // General Settings
        platformName: 'NexGen Investment Platform',
        platformUrl: 'https://nexgen.investment',
        supportEmail: 'support@nexgen.investment',
        maintenanceMode: false,

        // Investment Settings
        minimumInvestment: 100,
        maximumInvestment: 100000,
        defaultInterestRate: 12.5,
        compoundingFrequency: 'monthly',
        withdrawalFee: 2.5,

        // Security Settings
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        twoFactorRequired: true,
        passwordMinLength: 8,

        // Notification Settings
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        adminNotifications: true,

        // API Settings
        apiKey: 'sk_live_xxxxxxxxxxxxxxxxxxxx',
        apiRateLimit: 1000,
        webhookUrl: 'https://api.nexgen.investment/webhook',

        // Payment Settings
        paymentGateway: 'stripe',
        autoWithdrawal: true,
        withdrawalLimit: 10000,
        processingFee: 1.0
    })

    const tabs = [
        { id: 'general', name: 'General', icon: Settings },
        { id: 'investment', name: 'Investment', icon: DollarSign },
        { id: 'security', name: 'Security', icon: Shield },
        { id: 'notifications', name: 'Notifications', icon: Bell },
        { id: 'api', name: 'API & Integrations', icon: Server },
        { id: 'payments', name: 'Payment Settings', icon: FileText }
    ]

    const handleSettingChange = (key: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }))
    }

    const handleSaveSettings = () => {
        // In a real app, this would save to backend
        console.log('Saving settings:', settings)
        // Show success message
    }

    const renderGeneralSettings = () => (
        <div className="space-y-6">
            <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-blue-500" />
                    Platform Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Platform Name</label>
                        <input
                            type="text"
                            value={settings.platformName}
                            onChange={(e) => handleSettingChange('platformName', e.target.value)}
                            className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Platform URL</label>
                        <input
                            type="url"
                            value={settings.platformUrl}
                            onChange={(e) => handleSettingChange('platformUrl', e.target.value)}
                            className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Support Email</label>
                        <input
                            type="email"
                            value={settings.supportEmail}
                            onChange={(e) => handleSettingChange('supportEmail', e.target.value)}
                            className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Maintenance Mode</label>
                        <div className="flex items-center space-x-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.maintenanceMode}
                                    onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                            </label>
                            <span className="text-gray-300">Enable maintenance mode</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderInvestmentSettings = () => (
        <div className="space-y-6">
            <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                    Investment Limits & Rates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Investment ($)</label>
                        <input
                            type="number"
                            value={settings.minimumInvestment}
                            onChange={(e) => handleSettingChange('minimumInvestment', parseFloat(e.target.value))}
                            className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Maximum Investment ($)</label>
                        <input
                            type="number"
                            value={settings.maximumInvestment}
                            onChange={(e) => handleSettingChange('maximumInvestment', parseFloat(e.target.value))}
                            className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Default Interest Rate (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={settings.defaultInterestRate}
                            onChange={(e) => handleSettingChange('defaultInterestRate', parseFloat(e.target.value))}
                            className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Compounding Frequency</label>
                        <select
                            value={settings.compoundingFrequency}
                            onChange={(e) => handleSettingChange('compoundingFrequency', e.target.value)}
                            className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="annually">Annually</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Withdrawal Fee (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={settings.withdrawalFee}
                            onChange={(e) => handleSettingChange('withdrawalFee', parseFloat(e.target.value))}
                            className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>
        </div>
    )

    const renderSecuritySettings = () => (
        <div className="space-y-6">
            <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-red-500" />
                    Security Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Session Timeout (minutes)</label>
                        <input
                            type="number"
                            value={settings.sessionTimeout}
                            onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                            className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Max Login Attempts</label>
                        <input
                            type="number"
                            value={settings.maxLoginAttempts}
                            onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                            className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Password Min Length</label>
                        <input
                            type="number"
                            value={settings.passwordMinLength}
                            onChange={(e) => handleSettingChange('passwordMinLength', parseInt(e.target.value))}
                            className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Two-Factor Authentication</label>
                        <div className="flex items-center space-x-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.twoFactorRequired}
                                    onChange={(e) => handleSettingChange('twoFactorRequired', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                            </label>
                            <span className="text-gray-300">Require 2FA for all users</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderNotificationSettings = () => (
        <div className="space-y-6">
            <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Bell className="w-5 h-5 mr-2 text-yellow-500" />
                    Notification Preferences
                </h3>
                <div className="space-y-4">
                    {[
                        { key: 'emailNotifications', label: 'Email Notifications', description: 'Send notifications via email' },
                        { key: 'smsNotifications', label: 'SMS Notifications', description: 'Send notifications via SMS' },
                        { key: 'pushNotifications', label: 'Push Notifications', description: 'Send browser push notifications' },
                        { key: 'adminNotifications', label: 'Admin Notifications', description: 'Receive admin-specific notifications' }
                    ].map((notification) => (
                        <div key={notification.key} className="flex items-center justify-between p-4 bg-navy-800/30 rounded-xl border border-gold-500/10">
                            <div>
                                <p className="text-white font-medium">{notification.label}</p>
                                <p className="text-gray-400 text-sm">{notification.description}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings[notification.key as keyof typeof settings] as boolean}
                                    onChange={(e) => handleSettingChange(notification.key, e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )

    const renderApiSettings = () => (
        <div className="space-y-6">
            <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Server className="w-5 h-5 mr-2 text-purple-500" />
                    API Configuration
                </h3>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
                        <div className="flex items-center space-x-3">
                            <input
                                type={showApiKey ? 'text' : 'password'}
                                value={settings.apiKey}
                                onChange={(e) => handleSettingChange('apiKey', e.target.value)}
                                className="flex-1 px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <button
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="p-3 text-gray-400 hover:text-white hover:bg-navy-700/50 rounded-xl transition-colors"
                            >
                                {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Rate Limit (requests/hour)</label>
                            <input
                                type="number"
                                value={settings.apiRateLimit}
                                onChange={(e) => handleSettingChange('apiRateLimit', parseInt(e.target.value))}
                                className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Webhook URL</label>
                            <input
                                type="url"
                                value={settings.webhookUrl}
                                onChange={(e) => handleSettingChange('webhookUrl', e.target.value)}
                                className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderPaymentSettings = () => (
        <div className="space-y-6">
            <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-green-500" />
                    Payment Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Payment Gateway</label>
                        <select
                            value={settings.paymentGateway}
                            onChange={(e) => handleSettingChange('paymentGateway', e.target.value)}
                            className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="stripe">Stripe</option>
                            <option value="paypal">PayPal</option>
                            <option value="coinbase">Coinbase</option>
                            <option value="bank">Bank Transfer</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Withdrawal Limit ($)</label>
                        <input
                            type="number"
                            value={settings.withdrawalLimit}
                            onChange={(e) => handleSettingChange('withdrawalLimit', parseFloat(e.target.value))}
                            className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Processing Fee (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={settings.processingFee}
                            onChange={(e) => handleSettingChange('processingFee', parseFloat(e.target.value))}
                            className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Auto Withdrawal</label>
                        <div className="flex items-center space-x-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.autoWithdrawal}
                                    onChange={(e) => handleSettingChange('autoWithdrawal', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                            <span className="text-gray-300">Enable automatic withdrawals</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return renderGeneralSettings()
            case 'investment':
                return renderInvestmentSettings()
            case 'security':
                return renderSecuritySettings()
            case 'notifications':
                return renderNotificationSettings()
            case 'api':
                return renderApiSettings()
            case 'payments':
                return renderPaymentSettings()
            default:
                return renderGeneralSettings()
        }
    }

    return (
        <div className="space-y-6">
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
                            className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg"
                        >
                            <Save className="w-5 h-5" />
                            <span>Save Settings</span>
                        </button>
                        <button className="p-3 text-gray-400 hover:text-white hover:bg-navy-700/50 rounded-xl transition-colors">
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
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-gold-500/20 text-gold-300 border-b-2 border-gold-500'
                                    : 'text-gray-400 hover:text-white hover:bg-navy-700/50'
                                }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            <span>{tab.name}</span>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Tab Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
            >
                {renderTabContent()}
            </motion.div>

            {/* System Status */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                <div className="bg-green-500/10 rounded-xl p-6 border border-green-500/20">
                    <div className="flex items-center space-x-3">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <div>
                            <p className="text-white font-semibold">System Status</p>
                            <p className="text-green-400 text-sm">All systems operational</p>
                        </div>
                    </div>
                </div>
                <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/20">
                    <div className="flex items-center space-x-3">
                        <Database className="w-8 h-8 text-blue-500" />
                        <div>
                            <p className="text-white font-semibold">Database</p>
                            <p className="text-blue-400 text-sm">Connected & healthy</p>
                        </div>
                    </div>
                </div>
                <div className="bg-yellow-500/10 rounded-xl p-6 border border-yellow-500/20">
                    <div className="flex items-center space-x-3">
                        <Info className="w-8 h-8 text-yellow-500" />
                        <div>
                            <p className="text-white font-semibold">Last Update</p>
                            <p className="text-yellow-400 text-sm">2 hours ago</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default SystemSettings