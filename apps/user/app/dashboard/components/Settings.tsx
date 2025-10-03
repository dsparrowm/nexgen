'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, Palette, Save, Shield, Mail } from 'lucide-react'

const Settings = () => {
    const [name, setName] = useState('John Doe')
    const [email, setEmail] = useState('john.doe@example.com')
    const [theme, setTheme] = useState('dark')
    const [notifications, setNotifications] = useState(true)

    const handleSave = () => {
        // Save settings logic would go here
        console.log('Settings saved')
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
        >
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-gold-500/20 to-gold-600/10 border border-gold-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Account Settings</h2>
                        <p className="text-gold-200">Manage your profile and preferences</p>
                    </div>
                    <button
                        onClick={handleSave}
                        className="flex items-center space-x-2 bg-gold-500 hover:bg-gold-600 text-navy-900 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                    </button>
                </div>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Settings */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="bg-dark-800/50 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6"
                >
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-gold-500/20 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-gold-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Profile Information</h3>
                            <p className="text-gray-400 text-sm">Update your personal details</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
                                placeholder="Enter your email"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Preferences */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-dark-800/50 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6"
                >
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-gold-500/20 rounded-lg flex items-center justify-center">
                            <Palette className="w-5 h-5 text-gold-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Preferences</h3>
                            <p className="text-gray-400 text-sm">Customize your experience</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Theme
                            </label>
                            <select
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                                className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/20 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
                            >
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                                <option value="system">System</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-navy-900/30 rounded-lg border border-gold-500/10">
                            <div className="flex items-center space-x-3">
                                <Bell className="w-5 h-5 text-gold-500" />
                                <div>
                                    <span className="text-white font-medium">Email Notifications</span>
                                    <p className="text-gray-400 text-sm">Receive updates via email</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={notifications}
                                    onChange={(e) => setNotifications(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                            </label>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Security & Account Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Security */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="bg-dark-800/50 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6"
                >
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-gold-500/20 rounded-lg flex items-center justify-center">
                            <Shield className="w-5 h-5 text-gold-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Security</h3>
                            <p className="text-gray-400 text-sm">Protect your account</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button className="w-full text-left p-4 bg-navy-900/30 rounded-lg border border-gold-500/10 hover:border-gold-500/30 transition-colors group">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white font-medium">Change Password</p>
                                    <p className="text-gray-400 text-sm">Update your login password</p>
                                </div>
                                <Shield className="w-5 h-5 text-gold-500 group-hover:text-gold-400" />
                            </div>
                        </button>

                        <div className="p-4 bg-navy-900/30 rounded-lg border border-gold-500/10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white font-medium">Two-Factor Authentication</p>
                                    <p className="text-gray-400 text-sm">Add extra security to your account</p>
                                </div>
                                <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                                    Disabled
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Account Status */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="bg-dark-800/50 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6"
                >
                    <h3 className="text-lg font-semibold text-white mb-6">Account Status</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-navy-900/30 rounded-lg border border-gold-500/10">
                            <div>
                                <p className="text-gray-400 text-sm">Member Since</p>
                                <p className="text-white font-medium">January 15, 2024</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-navy-900/30 rounded-lg border border-gold-500/10">
                            <div>
                                <p className="text-gray-400 text-sm">Subscription Plan</p>
                                <p className="text-white font-medium">Premium Plan</p>
                            </div>
                            <span className="px-3 py-1 bg-gold-500/20 text-gold-400 rounded-full text-xs font-medium">
                                Active
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-navy-900/30 rounded-lg border border-gold-500/10">
                            <div>
                                <p className="text-gray-400 text-sm">Account Status</p>
                                <p className="text-white font-medium">Verified</p>
                            </div>
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                                Active
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    )
}

export default Settings;