'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { usePermission } from '@/components/ProtectedRoute'
import { useToast } from '@/components/ToastContext'
import { NexgenLogo } from '@/components/NexgenLogo'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { adminRoutes, getAdminBreadcrumbs, getAdminRouteMeta } from '@/lib/adminRoutes'
import { cn } from '@/lib/utils'
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
    Pickaxe,
    BadgeCheck,
    Wallet,
    CandlestickChart,
    Megaphone,
    TrendingUp,
    Settings,
    Shield,
    ArrowLeftRight,
    type LucideIcon,
} from 'lucide-react'

interface AdminLayoutProps {
    children: React.ReactNode
}

interface NavItem {
    name: string
    description: string
    icon: LucideIcon
    href: string
    exact?: boolean
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [supportUnreadCount, setSupportUnreadCount] = useState(0)
    const pathname = usePathname()
    const { admin, logout } = useAuth()
    const { canManageSettings, isSuperAdmin } = usePermission()
    const { addToast } = useToast()
    const routeMeta = getAdminRouteMeta(pathname)
    const breadcrumbs = getAdminBreadcrumbs(pathname)
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
            const gain = context.createGain()

            oscillator.type = 'sine'
            oscillator.frequency.setValueAtTime(880, context.currentTime)
            gain.gain.setValueAtTime(0.0001, context.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.3, context.currentTime + 0.02)
            gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.3)

            oscillator.connect(gain)
            gain.connect(context.destination)
            oscillator.start()
            oscillator.stop(context.currentTime + 0.32)
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

    const navigationSections: Array<{ label: string; items: NavItem[] }> = [
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

    const restrictedItems: NavItem[] = [
        {
            name: 'System Settings',
            description: 'Platform configuration',
            icon: Settings,
            href: adminRoutes.platformSettings,
        },
        {
            name: 'Security & Audit',
            description: 'Admin security controls',
            icon: Shield,
            href: adminRoutes.platformSecurity,
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

    const adminName = [admin?.firstName, admin?.lastName].filter(Boolean).join(' ') || 'Admin'

    const renderNavItem = (item: NavItem) => {
        const active = isActive(item.href, item.exact)
        const showBadge = item.href === adminRoutes.communications && supportUnreadCount > 0

        return (
            <Link
                key={item.name}
                href={item.href}
                title={item.description}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                    'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                    active
                        ? 'border-l-2 border-gold-500 bg-amber-50 pl-2 text-zinc-900'
                        : 'border-l-2 border-transparent text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                )}
            >
                <item.icon
                    className={cn(
                        'h-4 w-4 shrink-0',
                        active ? 'text-gold-600' : 'text-zinc-400 group-hover:text-zinc-600'
                    )}
                />
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                {showBadge && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-semibold text-white">
                        {supportUnreadCount > 99 ? '99+' : supportUnreadCount}
                    </span>
                )}
            </Link>
        )
    }

    return (
        <div className="flex h-screen bg-zinc-50">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-zinc-900/20 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4">
                    <NexgenLogo size="sm" />
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 lg:hidden"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
                    {navigationSections.map((section) => (
                        <div key={section.label}>
                            <div className="mb-1.5 flex items-center justify-between px-2">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                                    {section.label}
                                </p>
                                {section.label === 'Engagement' && supportUnreadCount > 0 && (
                                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                                        {supportUnreadCount}
                                    </span>
                                )}
                            </div>
                            <div className="space-y-0.5">
                                {section.items.map(renderNavItem)}
                            </div>
                        </div>
                    ))}

                    {canManageSettings() && (
                        <div>
                            <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                                Restricted
                            </p>
                            <div className="space-y-0.5">
                                {restrictedItems
                                    .filter((item) => item.href !== adminRoutes.platformSecurity || isSuperAdmin())
                                    .map(renderNavItem)}
                            </div>
                        </div>
                    )}
                </nav>

                <div className="border-t border-zinc-200 p-3">
                    <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
                        <Avatar name={adminName} size="md" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-zinc-900">{adminName}</p>
                            <p className="truncate text-xs text-zinc-500">
                                {admin?.role === 'SUPER_ADMIN' ? 'Super Administrator' : 'Administrator'}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur-sm lg:px-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 lg:hidden"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            <PageHeader
                                title={routeMeta.title}
                                description={routeMeta.description}
                                breadcrumbs={breadcrumbs}
                            />
                        </div>

                        <Link
                            href={adminRoutes.communications}
                            className="relative shrink-0 rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                            title="Notifications"
                        >
                            <Bell className="h-5 w-5" />
                            {supportUnreadCount > 0 && (
                                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                                    {supportUnreadCount > 99 ? '99+' : supportUnreadCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </header>

                <main className="flex-1 overflow-auto">
                    <div className="mx-auto max-w-7xl animate-fade-in p-4 lg:p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default AdminLayout
