'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { usePermission } from '@/components/ProtectedRoute'
import { useToast } from '@/components/ToastContext'
import { adminRoutes, getAdminRouteMeta } from '@/lib/adminRoutes'
import { apiClient, type SupportConversationSummary } from '@/lib/api'
import { createSupportSocket } from '@/lib/supportSocket'
import {
    LayoutDashboard,
    Users,
    Bell,
    LogOut,
    Menu,
    X,
    Activity,
    DollarSign,
    MessageCircle,
    Pickaxe,
    BadgeCheck,
    HandCoins,
    Wallet,
    CandlestickChart,
    Megaphone,
    TrendingUp,
    Settings,
    Shield,
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
    const [supportUnreadCount, setSupportUnreadCount] = useState(0)
    const pathname = usePathname()
    const { admin, logout } = useAuth()
    const { canManageSettings, isSuperAdmin } = usePermission()
    const { addToast } = useToast()
    const routeMeta = getAdminRouteMeta(pathname)
    const supportUnreadIdsRef = useRef<Set<string>>(new Set())
    const supportSocketRef = useRef<any>(null)
    const supportUnreadLoadedRef = useRef(false)
    const isSupportWorkspaceRef = useRef(false)

    useEffect(() => {
        isSupportWorkspaceRef.current = Boolean(
            pathname?.startsWith(adminRoutes.communicationsSupport) ||
            pathname?.startsWith('/admin/support')
        )
    }, [pathname])

    const syncSupportUnreadState = useCallback((conversations: SupportConversationSummary[]) => {
        const nextUnreadIds = new Set(
            conversations
                .filter((conversation) => Number(conversation.unreadCount || 0) > 0)
                .map((conversation) => conversation.id)
        )

        supportUnreadIdsRef.current = nextUnreadIds
        setSupportUnreadCount(nextUnreadIds.size)
    }, [])

    const playSupportNotificationSound = useCallback(() => {
        if (typeof window === 'undefined') {
            return
        }

        const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioContextCtor) {
            return
        }

        try {
            const context = new AudioContextCtor()
            const oscillator = context.createOscillator()
            const overtone = context.createOscillator()
            const sub = context.createOscillator()
            const gain = context.createGain()

            oscillator.type = 'square'
            oscillator.frequency.setValueAtTime(1200, context.currentTime)
            oscillator.frequency.exponentialRampToValueAtTime(900, context.currentTime + 0.12)
            overtone.type = 'sawtooth'
            overtone.frequency.setValueAtTime(1800, context.currentTime)
            overtone.frequency.exponentialRampToValueAtTime(1400, context.currentTime + 0.12)
            sub.type = 'triangle'
            sub.frequency.setValueAtTime(600, context.currentTime)
            sub.frequency.exponentialRampToValueAtTime(480, context.currentTime + 0.12)

            gain.gain.setValueAtTime(0.0001, context.currentTime)
            gain.gain.exponentialRampToValueAtTime(1, context.currentTime + 0.01)
            gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.5)

            oscillator.connect(gain)
            overtone.connect(gain)
            sub.connect(gain)
            gain.connect(context.destination)
            oscillator.start()
            overtone.start()
            sub.start()
            oscillator.stop(context.currentTime + 0.52)
            overtone.stop(context.currentTime + 0.52)
            sub.stop(context.currentTime + 0.52)
            oscillator.onended = () => {
                void context.close()
            }
        } catch (error) {
            console.warn('Support notification sound failed:', error)
        }
    }, [])

    useEffect(() => {
        let mounted = true
        let socket: any = null

        const handleSupportConversationUpdate = (payload: any) => {
            const summary: SupportConversationSummary | undefined = payload?.summary || payload?.data?.summary
            if (!summary?.id) {
                return
            }

            const hasUnread = Number(summary.unreadCount || 0) > 0
            const wasUnread = supportUnreadIdsRef.current.has(summary.id)

            if (hasUnread) {
                supportUnreadIdsRef.current.add(summary.id)
            } else {
                supportUnreadIdsRef.current.delete(summary.id)
            }

            setSupportUnreadCount(supportUnreadIdsRef.current.size)

            const isInboundCustomerMessage =
                payload?.reason === 'message_created' &&
                hasUnread &&
                summary.lastMessageSenderType !== 'ADMIN'

            if (isInboundCustomerMessage) {
                if (!isSupportWorkspaceRef.current) {
                    const customerLabel = summary.customerName || 'A customer'
                    addToast(
                        'info',
                        'New support message',
                        `${customerLabel}: ${summary.lastMessage || 'You have a new support message.'}`,
                        6500
                    )
                }

                if (!wasUnread || !isSupportWorkspaceRef.current) {
                    playSupportNotificationSound()
                }
            }
        }

        const loadSupportUnreadState = async () => {
            try {
                const response = await apiClient.getSupportConversations({ status: 'ALL', limit: 200 })
                if (!mounted || !response.success || !response.data) {
                    return
                }

                syncSupportUnreadState(response.data.conversations || [])
                supportUnreadLoadedRef.current = true
            } catch (error) {
                console.error('Failed to load support unread state:', error)
            }
        }

        const connectSocket = async () => {
            if (!admin?.id) {
                return
            }

            const token = apiClient.getAccessToken()
            if (!token) {
                return
            }

            try {
                socket = await createSupportSocket({ token, type: 'admin' })
                if (!mounted || !socket) {
                    socket?.disconnect?.()
                    return
                }

                supportSocketRef.current = socket

                socket.on('support:conversation-updated', handleSupportConversationUpdate)
                socket.on('connect', () => {
                    if (!supportUnreadLoadedRef.current) {
                        void loadSupportUnreadState()
                    }
                })
                socket.connect?.()
            } catch (error) {
                console.error('Failed to connect admin support notifications socket:', error)
            }
        }

        void loadSupportUnreadState()
        void connectSocket()

        return () => {
            mounted = false
            socket?.off?.('support:conversation-updated', handleSupportConversationUpdate)
            socket?.disconnect?.()
            if (supportSocketRef.current === socket) {
                supportSocketRef.current = null
            }
        }
    }, [admin?.id, addToast, playSupportNotificationSound, syncSupportUnreadState])

    const navigationSections = [
        {
            label: 'Operations',
            items: [
                {
                    name: 'Operations Center',
                    description: 'Platform health and queues',
                    icon: LayoutDashboard,
                    href: adminRoutes.operations,
                    exact: true,
                },
                {
                    name: 'Customers',
                    description: 'Accounts and customer state',
                    icon: Users,
                    href: adminRoutes.customers,
                },
                {
                    name: 'Compliance',
                    description: 'KYC and verification workflows',
                    icon: BadgeCheck,
                    href: '/admin/compliance',
                },
            ],
        },
        {
            label: 'Finance',
            items: [
                {
                    name: 'Treasury',
                    description: 'Ledger, credits, payouts',
                    icon: Wallet,
                    href: adminRoutes.treasury,
                },
                {
                    name: 'Transactions',
                    description: 'Approve deposits and withdrawals',
                    icon: ArrowLeftRight,
                    href: adminRoutes.transactions,
                },
                {
                    name: 'Assets Desk',
                    description: 'Crypto portfolio controls',
                    icon: CandlestickChart,
                    href: adminRoutes.assets,
                },
                {
                    name: 'Mining Desk',
                    description: 'Plans, capacity, lifecycle',
                    icon: Pickaxe,
                    href: adminRoutes.miningDesk,
                },
            ],
        },
        {
            label: 'Engagement',
            items: [
                {
                    name: 'Communications',
                    description: 'Support and announcements',
                    icon: Megaphone,
                    href: adminRoutes.communications,
                },
                {
                    name: 'Growth',
                    description: 'Referrals and promotions',
                    icon: TrendingUp,
                    href: adminRoutes.growth,
                },
            ],
        },
        {
            label: 'Intelligence',
            items: [
                {
                    name: 'Analytics',
                    description: 'Reports and business metrics',
                    icon: Activity,
                    href: adminRoutes.analytics,
                },
                {
                    name: 'Platform',
                    description: 'Settings and security',
                    icon: Settings,
                    href: adminRoutes.platform,
                },
            ],
        },
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
        <>
            <style jsx global>{`
                @keyframes admin-support-bell-shake {
                    0%, 100% { transform: rotate(0deg) scale(1); }
                    10% { transform: rotate(-12deg) scale(1.04); }
                    20% { transform: rotate(10deg) scale(1.04); }
                    30% { transform: rotate(-16deg) scale(1.05); }
                    40% { transform: rotate(14deg) scale(1.05); }
                    50% { transform: rotate(-10deg) scale(1.03); }
                    60% { transform: rotate(8deg) scale(1.03); }
                    70% { transform: rotate(-5deg) scale(1.02); }
                    80% { transform: rotate(3deg) scale(1.02); }
                    90% { transform: rotate(-2deg) scale(1.01); }
                }
            `}</style>
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
                        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
                            {navigationSections.map((section) => (
                                <div key={section.label}>
                                    <div className="mb-3 flex items-center justify-between gap-3 px-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500">
                                            {section.label}
                                        </p>
                                        {section.label === 'Engagement' && supportUnreadCount > 0 ? (
                                            <span className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-100 shadow-[0_0_0_1px_rgba(239,68,68,0.2),0_0_18px_rgba(239,68,68,0.18)]">
                                                Inbox {supportUnreadCount > 99 ? '99+' : supportUnreadCount}
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="space-y-2">
                                        {section.items.map((item) => {
                                            const active = isActive(item.href, item.exact)
                                            return (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    onClick={() => setSidebarOpen(false)}
                                                    className={`
                                                        group flex items-start justify-between gap-3 rounded-xl border px-3 py-3 transition-all duration-200
                                                        ${active
                                                            ? 'border-gold-500/30 bg-gradient-to-r from-gold-500/20 to-gold-600/10 text-gold-300'
                                                            : 'border-transparent text-gray-300 hover:border-gold-500/10 hover:bg-navy-700/50 hover:text-white'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex min-w-0 items-start">
                                                        <item.icon className={`mr-3 mt-0.5 h-5 w-5 shrink-0 ${active ? 'text-gold-400' : 'text-gray-400 group-hover:text-white'}`} />
                                                        <span className="min-w-0">
                                                            <span className="block text-sm font-medium">{item.name}</span>
                                                            <span className="mt-0.5 block text-xs text-gray-500 group-hover:text-gray-300">
                                                                {item.description}
                                                            </span>
                                                        </span>
                                                    </div>
                                                    {item.href === adminRoutes.communications && supportUnreadCount > 0 ? (
                                                        <span className="relative inline-flex shrink-0 items-center">
                                                            <span className="absolute inset-[-6px] rounded-full bg-red-500/55 animate-ping" />
                                                            <span className="relative inline-flex items-center rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_0_0_1px_rgba(220,38,38,0.6),0_0_22px_rgba(239,68,68,0.42)]">
                                                                {supportUnreadCount > 99 ? '99+' : supportUnreadCount}
                                                            </span>
                                                        </span>
                                                    ) : null}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}

                            {canManageSettings() && (
                                <div>
                                    <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500">
                                        Restricted
                                    </p>
                                    <div className="space-y-2">
                                        <Link
                                            href={adminRoutes.platformSettings}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`
                                                group flex items-start rounded-xl border px-3 py-3 transition-all duration-200
                                                ${isActive(adminRoutes.platformSettings) || isActive('/admin/settings')
                                                    ? 'border-gold-500/30 bg-gradient-to-r from-gold-500/20 to-gold-600/10 text-gold-300'
                                                    : 'border-transparent text-gray-300 hover:border-gold-500/10 hover:bg-navy-700/50 hover:text-white'
                                                }
                                            `}
                                        >
                                            <Settings className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-gray-400 group-hover:text-white" />
                                            <span className="min-w-0">
                                                <span className="block text-sm font-medium">System Settings</span>
                                                <span className="mt-0.5 block text-xs text-gray-500 group-hover:text-gray-300">
                                                    Platform configuration
                                                </span>
                                            </span>
                                        </Link>

                                        {isSuperAdmin() && (
                                            <Link
                                                href={adminRoutes.platformSecurity}
                                                onClick={() => setSidebarOpen(false)}
                                                className={`
                                                    group flex items-start rounded-xl border px-3 py-3 transition-all duration-200
                                                    ${isActive(adminRoutes.platformSecurity) || isActive('/admin/security')
                                                        ? 'border-gold-500/30 bg-gradient-to-r from-gold-500/20 to-gold-600/10 text-gold-300'
                                                        : 'border-transparent text-gray-300 hover:border-gold-500/10 hover:bg-navy-700/50 hover:text-white'
                                                    }
                                                `}
                                            >
                                                <Shield className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-gray-400 group-hover:text-white" />
                                                <span className="min-w-0">
                                                    <span className="block text-sm font-medium">Security & Audit</span>
                                                    <span className="mt-0.5 block text-xs text-gray-500 group-hover:text-gray-300">
                                                        Admin security controls
                                                    </span>
                                                </span>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}
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
                                        {routeMeta.title}
                                    </h1>
                                    <p className="text-sm text-gray-400">
                                        {routeMeta.description}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                {/* Notifications */}
                                <Link
                                    href={adminRoutes.communications}
                                    className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-navy-700/50 transition-colors"
                                >
                                    <Bell
                                        className="w-5 h-5"
                                        style={supportUnreadCount > 0 ? { animation: 'admin-support-bell-shake 1.15s ease-in-out infinite' } : undefined}
                                    />
                                    {supportUnreadCount > 0 ? (
                                        <span className="absolute -top-1 -right-1 inline-flex min-w-4 items-center justify-center">
                                            <span className="absolute inset-[-6px] rounded-full bg-red-500/55 animate-ping" />
                                            <span className="relative inline-flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-[0_0_0_1px_rgba(220,38,38,0.6),0_0_22px_rgba(239,68,68,0.42)]">
                                                {supportUnreadCount > 99 ? '99+' : supportUnreadCount}
                                            </span>
                                        </span>
                                    ) : null}
                                </Link>

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
        </>
    )
}

export default AdminLayout
