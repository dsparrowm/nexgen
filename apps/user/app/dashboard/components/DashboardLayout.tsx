"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
    LayoutDashboard,
    Pickaxe,
    TrendingUp,
    History,
    Settings,
    HelpCircle,
    Bell,
    User,
    Menu,
    X,
    LogOut,
    ChevronDown,
    ArrowDownLeft,
    ArrowUpRight
} from 'lucide-react'
import { confirmLogout } from '../../../utils/auth'
import { DashboardSidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem } from '../../../lib/sidebar'
import NexgenLogo from '../../../utils/NexgenLogo'
import { useDashboardData } from '@/hooks/useDashboardData'

interface DashboardLayoutProps {
    children: React.ReactNode
    activeSection?: string
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, activeSection = 'dashboard' }) => {
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const { data } = useDashboardData()

    const user = data?.user
    const displayName = user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.username || 'User'
    const userEmail = user?.email || 'user@example.com'

    const navigation = [
        { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard', href: '/dashboard' },
        { name: 'Mining', icon: Pickaxe, id: 'mining', href: '/dashboard/mining' },
        { name: 'Investments', icon: TrendingUp, id: 'investments', href: '/dashboard/investments' },
        { name: 'Deposit', icon: ArrowDownLeft, id: 'deposit', href: '/dashboard/deposit' },
        { name: 'Withdrawal', icon: ArrowUpRight, id: 'withdrawal', href: '/dashboard/withdrawal' },
        { name: 'Transactions', icon: History, id: 'transactions', href: '/dashboard/transactions' },
        { name: 'Settings', icon: Settings, id: 'settings', href: '/dashboard/settings' },
        { name: 'Support', icon: HelpCircle, id: 'support', href: '/dashboard/support' },
    ]

    return (
        <div className="flex h-screen bg-gradient-to-br from-dark-900 via-navy-900 to-dark-800">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* User menu backdrop */}
            {userMenuOpen && (
                <div
                    className="fixed inset-0 z-30"
                    onClick={() => setUserMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
        fixed inset-y-0 left-0 z-50 lg:static lg:translate-x-0 transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <DashboardSidebar>
                    <SidebarHeader>
                        <div className="flex items-center justify-between w-full">
                            <NexgenLogo size="md" variant="full" showText={true} dark={true} />
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-navy-700/50"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </SidebarHeader>

                    <SidebarContent>
                        <SidebarMenu>
                            {navigation.map((item) => (
                                <SidebarMenuItem
                                    key={item.id}
                                    href={item.href}
                                    isActive={activeSection === item.id}
                                >
                                    <item.icon className="w-5 h-5 mr-3" />
                                    {item.name}
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>

                        {/* User Profile Section */}
                        <div className="mt-auto px-3 py-4 border-t border-gold-500/20">
                            <button
                                onClick={() => router.push('/dashboard/settings')}
                                className="w-full flex items-center px-3 py-2 rounded-lg bg-navy-800/50 hover:bg-navy-700/50 mb-2 transition-colors text-left"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center mr-3">
                                    <User className="w-4 h-4 text-navy-900" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{displayName}</p>
                                    <p className="text-xs text-gray-400 truncate">View Profile</p>
                                </div>
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="w-full flex items-center px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors group"
                            >
                                <LogOut className="w-4 h-4 mr-3 group-hover:text-red-300" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </SidebarContent>
                </DashboardSidebar>
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
                            <h1 className="text-xl font-semibold text-white capitalize">
                                {activeSection}
                            </h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Notifications */}
                            <button
                                onClick={() => router.push('/dashboard/notifications')}
                                className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-navy-700/50 transition-colors"
                                title="Notifications"
                            >
                                <Bell className="w-5 h-5" />
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                            </button>

                            {/* User Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center space-x-2 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-navy-700/50 transition-colors"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-navy-900" />
                                    </div>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-dark-800 rounded-lg shadow-lg border border-gold-500/20 py-2 z-50">
                                        <div className="px-4 py-2 border-b border-gold-500/10">
                                            <p className="text-sm font-medium text-white truncate">{displayName}</p>
                                            <p className="text-xs text-gray-400 truncate">{userEmail}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setUserMenuOpen(false)
                                                router.push('/dashboard/settings')
                                            }}
                                            className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-navy-700/50 transition-colors"
                                        >
                                            <Settings className="w-4 h-4 mr-3" />
                                            <span>Account Settings</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setUserMenuOpen(false)
                                                confirmLogout()
                                            }}
                                            className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4 mr-3" />
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                )}
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

export default DashboardLayout