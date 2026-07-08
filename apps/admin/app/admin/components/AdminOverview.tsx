'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'
import {
    Users,
    DollarSign,
    TrendingUp,
    Activity,
    UserPlus,
    CreditCard,
    AlertTriangle,
    CheckCircle,
    Clock,
    Wallet,
    PieChart,
    RefreshCw,
    MessageCircle,
    Pickaxe,
    BadgeCheck,
    HandCoins,
    ArrowRight,
    type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

interface DashboardStats {
    totalUsers: number
    activeUsers: number
    totalInvestments: number
    totalTransactions: number
    pendingKyc: number
    pendingWithdrawals: number | null
    supportTickets: number | null
    recentTransactions: any[]
    changes: {
        users: string
        investments: string
        transactions: string
        uptime: string
    }
    systemUptime: string
}

interface ActionQueueItem {
    title: string
    count: number | null
    href: string
    icon: LucideIcon
    priority: 'high' | 'medium' | 'low'
}

const AdminOverview = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('7d')
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const { admin } = useAuth()

    const fetchDashboardStats = async (showRefreshIndicator = false) => {
        if (showRefreshIndicator) {
            setIsRefreshing(true)
        } else {
            setIsLoading(true)
        }
        setError(null)

        try {
            const response = await apiClient.getDashboardStats()

            if (response.success && response.data) {
                const transformedStats: DashboardStats = {
                    totalUsers: response.data.users?.total || 0,
                    activeUsers: response.data.users?.active || 0,
                    totalInvestments: parseFloat(response.data.investments?.totalAmount || '0'),
                    totalTransactions: response.data.transactions?.total || 0,
                    pendingKyc: response.data.kyc?.pending || 0,
                    pendingWithdrawals: null,
                    supportTickets: null,
                    recentTransactions: response.data.transactions?.recent || [],
                    changes: {
                        users: '+0%',
                        investments: '+0%',
                        transactions: '+0%',
                        uptime: '+0%',
                    },
                    systemUptime: '99.9%',
                }
                setStats(transformedStats)
            } else {
                setError(response.error?.message || 'Failed to load dashboard statistics')
            }
        } catch (err) {
            console.error('Error fetching dashboard stats:', err)
            setError('An error occurred while loading dashboard statistics')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        fetchDashboardStats()
    }, [])

    useEffect(() => {
        const interval = setInterval(() => {
            fetchDashboardStats(true)
        }, 30000)
        return () => clearInterval(interval)
    }, [])

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)

    const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num)

    function formatRelativeTime(date: Date): string {
        const diff = Date.now() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes}m ago`
        if (hours < 24) return `${hours}h ago`
        return `${days}d ago`
    }

    const actionQueue: ActionQueueItem[] = stats
        ? [
              {
                  title: 'Pending KYC',
                  count: stats.pendingKyc,
                  href: '/admin/compliance/kyc',
                  icon: BadgeCheck,
                  priority: 'high',
              },
              {
                  title: 'Withdrawal Approvals',
                  count: stats.pendingWithdrawals,
                  href: '/admin/transactions',
                  icon: Wallet,
                  priority: 'medium',
              },
              {
                  title: 'Support Inbox',
                  count: stats.supportTickets,
                  href: '/admin/communications/support',
                  icon: MessageCircle,
                  priority: 'low',
              },
          ]
        : []

    const quickActions = [
        { title: 'Add User', icon: UserPlus, href: '/admin/customers/add' },
        { title: 'Credit User', icon: CreditCard, href: '/admin/treasury/credits/add' },
        { title: 'Reports', icon: PieChart, href: '/admin/analytics' },
        { title: 'Review KYC', icon: BadgeCheck, href: '/admin/compliance/kyc' },
        { title: 'Mining', icon: Pickaxe, href: '/admin/mining-desk' },
        { title: 'Payouts', icon: HandCoins, href: '/admin/treasury/payouts' },
        { title: 'Customers', icon: Users, href: '/admin/customers' },
        { title: 'Support', icon: MessageCircle, href: '/admin/communications/support' },
    ]

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge variant="success">Completed</Badge>
            case 'pending':
                return <Badge variant="warning">Pending</Badge>
            default:
                return <Badge variant="error">{status}</Badge>
        }
    }

    if (isLoading && !stats) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-16 w-full" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>
            </div>
        )
    }

    if (error && !stats) {
        return (
            <EmptyState
                icon={AlertTriangle}
                title="Error loading dashboard"
                description={error}
                actionLabel="Retry"
                onAction={() => fetchDashboardStats()}
            />
        )
    }

    if (!stats) return null

    const recentActivities = stats.recentTransactions.map((transaction) => ({
        id: transaction.id,
        user: transaction.user?.username || transaction.user?.email || 'Unknown',
        action: transaction.type,
        amount: formatCurrency(transaction.amount),
        time: formatRelativeTime(new Date(transaction.createdAt)),
        status: transaction.status.toLowerCase(),
    }))

    return (
        <div className="space-y-6">
            {/* Welcome + controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-zinc-900">
                        Welcome back, {admin?.firstName || 'Admin'}
                    </h2>
                    <p className="mt-0.5 text-sm text-zinc-500">
                        Here&apos;s what needs your attention today.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchDashboardStats(true)}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                    </Button>
                    <SegmentedControl
                        options={[
                            { value: '24h', label: '24h' },
                            { value: '7d', label: '7d' },
                            { value: '30d', label: '30d' },
                            { value: '90d', label: '90d' },
                        ]}
                        value={selectedPeriod}
                        onChange={setSelectedPeriod}
                    />
                </div>
            </div>

            {/* Action queue */}
            <div>
                <h3 className="mb-3 text-sm font-medium text-zinc-700">Action queue</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {actionQueue.map((item) => (
                        <Link key={item.title} href={item.href}>
                            <Card className="card-hover group">
                                <CardContent className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={cn(
                                                'rounded-lg p-2',
                                                item.priority === 'high' && 'bg-red-50 text-red-600',
                                                item.priority === 'medium' && 'bg-amber-50 text-amber-600',
                                                item.priority === 'low' && 'bg-blue-50 text-blue-600'
                                            )}
                                        >
                                            <item.icon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-900">{item.title}</p>
                                            <p className="text-xs capitalize text-zinc-500">{item.priority} priority</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {item.count !== null ? (
                                            <span className="text-2xl font-semibold text-zinc-900">{item.count}</span>
                                        ) : (
                                            <span className="text-lg text-zinc-300">—</span>
                                        )}
                                        <ArrowRight className="h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* KPI stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Users"
                    value={formatNumber(stats.totalUsers)}
                    description={`${formatNumber(stats.activeUsers)} active`}
                    icon={Users}
                    trend={stats.changes.users}
                    trendDirection={stats.changes.users.startsWith('+') ? 'up' : 'down'}
                />
                <StatCard
                    title="Total Investments"
                    value={formatCurrency(stats.totalInvestments)}
                    icon={DollarSign}
                    trend={stats.changes.investments}
                    trendDirection={stats.changes.investments.startsWith('+') ? 'up' : 'down'}
                />
                <StatCard
                    title="Total Transactions"
                    value={formatNumber(stats.totalTransactions)}
                    icon={TrendingUp}
                    trend={stats.changes.transactions}
                    trendDirection={stats.changes.transactions.startsWith('+') ? 'up' : 'down'}
                />
                <StatCard
                    title="System Uptime"
                    value={stats.systemUptime}
                    description="Platform availability"
                    icon={Activity}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                {/* Quick actions */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Quick actions</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                            {quickActions.map((action) => (
                                <Link
                                    key={action.title}
                                    href={action.href}
                                    className="flex flex-col items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-center transition-colors hover:border-zinc-200 hover:bg-white"
                                >
                                    <action.icon className="h-4 w-4 text-zinc-500" />
                                    <span className="text-xs font-medium text-zinc-700">{action.title}</span>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent activity table */}
                <Card className="lg:col-span-3">
                    <CardHeader className="flex-row items-center justify-between pb-0">
                        <CardTitle>Recent activity</CardTitle>
                        <Link
                            href="/admin/transactions"
                            className="text-xs font-medium text-gold-700 hover:text-gold-600"
                        >
                            View all
                        </Link>
                    </CardHeader>
                    <CardContent className="pt-3">
                        {recentActivities.length === 0 ? (
                            <EmptyState
                                icon={Clock}
                                title="No recent activity"
                                description="Transactions will appear here as they occur."
                            />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-zinc-100 text-left text-xs font-medium text-zinc-500">
                                            <th className="pb-2 pr-4 font-medium">User</th>
                                            <th className="pb-2 pr-4 font-medium">Action</th>
                                            <th className="pb-2 pr-4 font-medium">Amount</th>
                                            <th className="pb-2 pr-4 font-medium">Status</th>
                                            <th className="pb-2 font-medium">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50">
                                        {recentActivities.slice(0, 8).map((activity) => (
                                            <tr key={activity.id} className="group">
                                                <td className="py-2.5 pr-4 font-medium text-zinc-900">
                                                    {activity.user}
                                                </td>
                                                <td className="py-2.5 pr-4 capitalize text-zinc-600">
                                                    {activity.action}
                                                </td>
                                                <td className="py-2.5 pr-4 text-zinc-900">{activity.amount}</td>
                                                <td className="py-2.5 pr-4">{getStatusBadge(activity.status)}</td>
                                                <td className="py-2.5 text-zinc-500">{activity.time}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* System status */}
            <Card>
                <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                        </span>
                        <span className="text-sm font-medium text-zinc-900">All systems operational</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {stats.systemUptime} uptime
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default AdminOverview
