'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { usePermission } from '@/components/ProtectedRoute'
import {
    LayoutDashboard,
    Users,
    CreditCard,
    Settings,
    BarChart3,
    Shield,
    Bell,
    LogOut,
    Menu,
    X,
    Activity,
    DollarSign,
    ArrowLeftRight
} from 'lucide-react'

// Inline NexgenLogo component
type LogoSize = 'sm' | 'md' | 'lg';

const NexgenLogo = ({ size = "md" }: { size?: LogoSize }) => {
    const sizeClasses: Record<LogoSize, string> = {
        sm: "w-6 h-6",
        md: "w-8 h-8",
        lg: "w-10 h-10"
    }

    return (
        <div className="flex items-center space-x-2">
            <div className={`${sizeClasses[size]} bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center`}>
                <span className="font-bold text-navy-900 text-sm">N</span>
            </div>
            <span className="font-display text-lg font-bold text-white">NexGen Admin</span>
        </div>
    )
}

interface AdminLayoutProps {
    children: React.ReactNode
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const pathname = usePathname()
    const { admin, logout } = useAuth()
    const { canManageSettings, isSuperAdmin } = usePermission()

    const navigation = [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/admin', exact: true },
        { name: 'User Management', icon: Users, href: '/admin/users' },
        { name: 'Transaction Management', icon: ArrowLeftRight, href: '/admin/transactions' },
        { name: 'Credit Management', icon: CreditCard, href: '/admin/credits' },
        { name: 'Reports & Analytics', icon: BarChart3, href: '/admin/reports' },
        ...(canManageSettings() ? [{ name: 'System Settings', icon: Settings, href: '/admin/settings' }] : []),
        ...(isSuperAdmin() ? [{ name: 'Security & Audit', icon: Shield, href: '/admin/security' }] : []),
    ]

    const handleLogout = async () => {
        try {
            await logout()
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    const isActive = (href: string, exact = false) => {
        if (exact) {
            return pathname === href
        }
        return pathname?.startsWith(href)
    }

    return (
        <div className="flex h-screen bg-gradient-to-br from-dark-900 via-navy-900 to-dark-800">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-dark-800/95 backdrop-blur-xl border-r border-gold-500/20 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gold-500/20">
                        <NexgenLogo size="md" />
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-navy-700/50"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2">
                        {navigation.map((item) => {
                            const active = isActive(item.href, item.exact)
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                                        group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200
                                        ${active
                                            ? 'bg-gradient-to-r from-gold-500/20 to-gold-600/10 text-gold-300 border border-gold-500/30'
                                            : 'text-gray-300 hover:text-white hover:bg-navy-700/50'
                                        }
                                    `}
                                >
                                    <item.icon className={`mr-3 h-5 w-5 ${active ? 'text-gold-400' : 'text-gray-400 group-hover:text-white'}`} />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Admin Profile */}
                    <div className="px-4 py-4 border-t border-gold-500/20">
                        <div className="flex items-center px-3 py-2 rounded-lg bg-navy-800/50 mb-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center mr-3">
                                <Shield className="w-4 h-4 text-navy-900" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {admin?.firstName} {admin?.lastName}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                    {admin?.role === 'SUPER_ADMIN' ? 'Super Administrator' : 'Administrator'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors group"
                        >
                            <LogOut className="w-4 h-4 mr-3 group-hover:text-red-300" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="bg-dark-800/50 backdrop-blur-sm border-b border-gold-500/20 px-4 lg:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-navy-700/50"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-xl font-semibold text-white">
                                    Admin Dashboard
                                </h1>
                                <p className="text-sm text-gray-400">
                                    Manage your investment platform
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Notifications */}
                            <button className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-navy-700/50 transition-colors">
                                <Bell className="w-5 h-5" />
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                            </button>

                            {/* Quick Stats */}
                            <div className="hidden md:flex items-center space-x-4 px-4 py-2 bg-navy-800/50 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <Users className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm text-white">12,847</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <DollarSign className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-white">$47.2M</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Activity className="w-4 h-4 text-gold-500" />
                                    <span className="text-sm text-white">98.5%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main content area */}
                <main className="flex-1 overflow-auto p-4 lg:p-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    )
}

export default AdminLayout