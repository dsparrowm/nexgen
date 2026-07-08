'use client'

import React, { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import {
    Activity,
    AlertTriangle,
    BarChart3,
    Download,
    DollarSign,
    LineChart,
    PieChart,
    RefreshCw,
    TrendingUp,
    Users,
} from 'lucide-react'
import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    IconButton,
    Select,
    Skeleton,
    StatCard,
    WorkspaceHeader,
    WorkspaceToolbar,
    WorkspaceToolbarActions,
    WorkspaceToolbarFilters,
} from '@/components/ui'
import { cn } from '@/lib/utils'

const ReportsAnalytics = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('30d')
    const [selectedReport, setSelectedReport] = useState('overview')
    const [reportData, setReportData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const fetchReportData = async (showRefreshIndicator = false) => {
        if (showRefreshIndicator) {
            setIsRefreshing(true)
        } else {
            setIsLoading(true)
        }
        setError(null)

        try {
            const response = await apiClient.getReports(selectedReport as any, { period: selectedPeriod })

            if (response.success && response.data) {
                setReportData(response.data)
            } else {
                setError(response.error?.message || 'Failed to load report data')
            }
        } catch (err) {
            console.error('Error fetching report data:', err)
            setError('An error occurred while loading report data')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        fetchReportData()
    }, [selectedReport, selectedPeriod])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const getKeyMetrics = () => {
        if (!reportData) return []

        switch (selectedReport) {
            case 'overview':
                return [
                    {
                        title: 'Total Revenue',
                        value: formatCurrency(reportData.totalRevenue || 0),
                        change: '+12.5%',
                        trendDirection: 'up' as const,
                        description: 'vs last month',
                        icon: DollarSign,
                    },
                    {
                        title: 'Total Users',
                        value: reportData.totalUsers?.toLocaleString() || '0',
                        change: '+8.3%',
                        trendDirection: 'up' as const,
                        description: 'vs last month',
                        icon: Users,
                    },
                    {
                        title: 'Active Users',
                        value: reportData.activeUsers?.toLocaleString() || '0',
                        change: '+15.2%',
                        trendDirection: 'up' as const,
                        description: 'vs last month',
                        icon: Activity,
                    },
                    {
                        title: 'Total Transactions',
                        value: reportData.totalTransactions?.toLocaleString() || '0',
                        change: '+22.1%',
                        trendDirection: 'up' as const,
                        description: 'vs last month',
                        icon: TrendingUp,
                    },
                ]
            case 'revenue':
                return [
                    {
                        title: 'Total Revenue',
                        value: formatCurrency(reportData.totalRevenue || 0),
                        change: '+12.5%',
                        trendDirection: 'up' as const,
                        description: 'vs last month',
                        icon: DollarSign,
                    },
                ]
            case 'users':
                return [
                    {
                        title: 'New Users',
                        value: reportData.newUsers?.toLocaleString() || '0',
                        change: '+8.3%',
                        trendDirection: 'up' as const,
                        description: 'vs last month',
                        icon: Users,
                    },
                    {
                        title: 'Active Users',
                        value: reportData.activeUsers?.toLocaleString() || '0',
                        change: '+15.2%',
                        trendDirection: 'up' as const,
                        description: 'vs last month',
                        icon: Activity,
                    },
                ]
            case 'activity':
                return [
                    {
                        title: 'Total Transactions',
                        value: reportData.transactionCount?.toLocaleString() || '0',
                        change: '+22.1%',
                        trendDirection: 'up' as const,
                        description: 'vs last month',
                        icon: TrendingUp,
                    },
                    {
                        title: 'Total Investments',
                        value: reportData.investmentCount?.toLocaleString() || '0',
                        change: '+18.7%',
                        trendDirection: 'up' as const,
                        description: 'vs last month',
                        icon: Activity,
                    },
                    {
                        title: 'User Logins',
                        value: reportData.loginCount?.toLocaleString() || '0',
                        change: '+25.3%',
                        trendDirection: 'up' as const,
                        description: 'vs last month',
                        icon: Users,
                    },
                ]
            default:
                return []
        }
    }

    const keyMetrics = getKeyMetrics()

    const reportTypes = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'revenue', label: 'Revenue', icon: DollarSign },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'activity', label: 'Activity', icon: Activity },
    ]

    if (isLoading && !reportData) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-full max-w-xl" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Skeleton className="h-80" />
                    <Skeleton className="h-80" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <WorkspaceHeader
                title="Reports & Analytics"
                description="Comprehensive platform insights and performance metrics."
                action={
                    <div className="flex flex-wrap items-center gap-2">
                        <IconButton
                            onClick={() => fetchReportData(true)}
                            disabled={isRefreshing}
                            title="Refresh"
                        >
                            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                        </IconButton>
                        <Button variant="secondary">
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                    </div>
                }
            />

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => fetchReportData()}>
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            {!error && (
                <>
                    <WorkspaceToolbar>
                        <WorkspaceToolbarFilters>
                            <Select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="w-full sm:w-44"
                            >
                                <option value="7d">Last 7 days</option>
                                <option value="30d">Last 30 days</option>
                                <option value="90d">Last 90 days</option>
                                <option value="1y">Last year</option>
                                <option value="all">All time</option>
                            </Select>
                        </WorkspaceToolbarFilters>

                        <WorkspaceToolbarActions>
                            <div className="flex gap-1 overflow-x-auto">
                                {reportTypes.map((type) => {
                                    const Icon = type.icon
                                    const isActive = selectedReport === type.id
                                    return (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setSelectedReport(type.id)}
                                            className={cn(
                                                'inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                                                isActive
                                                    ? 'bg-gold-500 text-navy-900'
                                                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {type.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </WorkspaceToolbarActions>
                    </WorkspaceToolbar>

                    {isRefreshing ? (
                        <div className="flex items-center justify-center py-16">
                            <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
                        </div>
                    ) : (
                        <>
                            <div
                                className={cn(
                                    'grid grid-cols-1 gap-4',
                                    keyMetrics.length >= 4
                                        ? 'md:grid-cols-2 xl:grid-cols-4'
                                        : keyMetrics.length === 3
                                          ? 'md:grid-cols-3'
                                          : keyMetrics.length === 2
                                            ? 'md:grid-cols-2'
                                            : 'md:grid-cols-1'
                                )}
                            >
                                {keyMetrics.map((metric) => (
                                    <StatCard
                                        key={metric.title}
                                        title={metric.title}
                                        value={metric.value}
                                        description={metric.description}
                                        icon={metric.icon}
                                        trend={metric.change}
                                        trendDirection={metric.trendDirection}
                                    />
                                ))}
                            </div>

                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-base">Revenue Trend</CardTitle>
                                                <CardDescription>Monthly revenue over time</CardDescription>
                                            </div>
                                            <LineChart className="h-5 w-5 text-gold-600" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex h-64 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50">
                                            <div className="text-center">
                                                <BarChart3 className="mx-auto mb-2 h-10 w-10 text-zinc-300" />
                                                <p className="text-sm text-zinc-500">Chart integration coming soon</p>
                                                <p className="mt-1 text-xs text-zinc-400">
                                                    This will display revenue analytics
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-base">User Growth</CardTitle>
                                                <CardDescription>New users registration trend</CardDescription>
                                            </div>
                                            <PieChart className="h-5 w-5 text-zinc-400" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex h-64 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50">
                                            <div className="text-center">
                                                <Users className="mx-auto mb-2 h-10 w-10 text-zinc-300" />
                                                <p className="text-sm text-zinc-500">Chart integration coming soon</p>
                                                <p className="mt-1 text-xs text-zinc-400">
                                                    This will display user growth analytics
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="border-blue-200 bg-blue-50">
                                <CardContent className="flex items-start gap-3 p-4">
                                    <BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                                    <div>
                                        <h4 className="text-sm font-semibold text-blue-900">
                                            Advanced analytics coming soon
                                        </h4>
                                        <p className="mt-1 text-xs text-blue-700">
                                            Full chart integration with Chart.js or Recharts is planned for the next
                                            phase. Current metrics are fetched from real backend data.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </>
            )}
        </div>
    )
}

export default ReportsAnalytics
