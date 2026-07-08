'use client'

import React, { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import { useToast } from '@/components/ToastContext'
import {
    Shield,
    Activity,
    UserCheck,
    AlertTriangle,
    CheckCircle,
    Clock,
    Download,
    RefreshCw,
} from 'lucide-react'
import {
    Badge,
    Button,
    Card,
    CardContent,
    DataTable,
    EmptyState,
    IconButton,
    Pagination,
    SearchInput,
    Select,
    Skeleton,
    StatCard,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    WorkspaceHeader,
    WorkspaceToolbar,
    WorkspaceToolbarActions,
    WorkspaceToolbarFilters,
} from '@/components/ui'
import { cn } from '@/lib/utils'

interface AuditLog {
    id: string
    action: string
    admin: string
    resource: string
    ipAddress: string
    timestamp: string
    status: string
    details: string
}

const SecurityAudit = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedFilter, setSelectedFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [securityMetrics, setSecurityMetrics] = useState({
        loginAttempts: 0,
        failedLogins: 0,
        activeSessions: 0,
        blockedIPs: 0,
    })
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
    const [totalLogs, setTotalLogs] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [isLoadingMetrics, setIsLoadingMetrics] = useState(true)
    const [isLoadingLogs, setIsLoadingLogs] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const { addToast } = useToast()

    const fetchSecurityMetrics = async () => {
        try {
            setIsLoadingMetrics(true)
            const response = await apiClient.getSecurityMetrics()
            if (response.success) {
                setSecurityMetrics(response.data)
            } else {
                addToast('error', 'Failed to load security metrics')
            }
        } catch (err) {
            addToast('error', 'Failed to load security metrics')
            console.error('Error fetching security metrics:', err)
        } finally {
            setIsLoadingMetrics(false)
        }
    }

    const fetchAuditLogs = async (showRefresh = false) => {
        try {
            if (showRefresh) setIsRefreshing(true)
            else setIsLoadingLogs(true)

            const params = {
                page: currentPage,
                limit: 20,
                search: searchTerm || undefined,
                action: selectedFilter !== 'all' ? selectedFilter : undefined,
            }

            const response = await apiClient.getAuditLogs(params)
            if (response.success) {
                setAuditLogs(response.data.logs)
                setTotalLogs(response.data.pagination.total)
                setTotalPages(response.data.pagination.totalPages)
            } else {
                addToast('error', 'Failed to load audit logs')
            }
        } catch (error) {
            addToast('error', 'Failed to load audit logs')
            console.error('Error fetching audit logs:', error)
        } finally {
            setIsLoadingLogs(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        fetchSecurityMetrics()
    }, [])

    useEffect(() => {
        fetchAuditLogs()
    }, [currentPage, searchTerm, selectedFilter])

    const formatRelativeTime = (date: Date): string => {
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
        return `${days} day${days > 1 ? 's' : ''} ago`
    }

    const getActionBadgeVariant = (action: string): 'success' | 'warning' | 'error' | 'neutral' | 'gold' => {
        if (action.includes('FAILED')) return 'error'
        if (action.includes('LOGIN')) return 'neutral'
        if (action.includes('CREDIT')) return 'success'
        if (action.includes('USER')) return 'warning'
        if (action.includes('SETTINGS')) return 'gold'
        return 'neutral'
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'success':
                return (
                    <Badge variant="success">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Success
                    </Badge>
                )
            case 'failure':
                return (
                    <Badge variant="error">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Failed
                    </Badge>
                )
            default:
                return (
                    <Badge variant="warning">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                    </Badge>
                )
        }
    }

    if (isLoadingMetrics && isLoadingLogs && auditLogs.length === 0) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-16 w-full" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <WorkspaceHeader
                title="Security & Audit"
                description="Monitor system security and audit administrative actions."
                action={
                    <Button variant="secondary">
                        <Download className="h-4 w-4" />
                        Export logs
                    </Button>
                }
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Login Attempts"
                    value={isLoadingMetrics ? '...' : String(securityMetrics.loginAttempts)}
                    description="Last 24 hours"
                    icon={UserCheck}
                />
                <StatCard
                    title="Failed Logins"
                    value={isLoadingMetrics ? '...' : String(securityMetrics.failedLogins)}
                    description="Requires attention"
                    icon={AlertTriangle}
                    iconClassName="bg-amber-50"
                />
                <StatCard
                    title="Active Sessions"
                    value={isLoadingMetrics ? '...' : String(securityMetrics.activeSessions)}
                    description="Currently online"
                    icon={Activity}
                />
                <StatCard
                    title="Blocked IPs"
                    value={isLoadingMetrics ? '...' : String(securityMetrics.blockedIPs)}
                    description="Suspicious activity"
                    icon={Shield}
                    iconClassName="bg-red-50"
                />
            </div>

            <WorkspaceToolbar>
                <WorkspaceToolbarFilters>
                    <SearchInput
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setCurrentPage(1)
                        }}
                        containerClassName="w-full sm:w-64"
                    />
                    <Select
                        value={selectedFilter}
                        onChange={(e) => {
                            setSelectedFilter(e.target.value)
                            setCurrentPage(1)
                        }}
                        className="w-full sm:w-40"
                    >
                        <option value="all">All actions</option>
                        <option value="login">Login events</option>
                        <option value="user">User actions</option>
                        <option value="credit">Credit actions</option>
                        <option value="settings">Settings changes</option>
                    </Select>
                </WorkspaceToolbarFilters>

                <WorkspaceToolbarActions>
                    <IconButton
                        onClick={() => fetchAuditLogs(true)}
                        disabled={isRefreshing}
                        title="Refresh"
                    >
                        <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                    </IconButton>
                </WorkspaceToolbarActions>
            </WorkspaceToolbar>

            <DataTable>
                {isRefreshing || isLoadingLogs ? (
                    <div className="flex items-center justify-center py-16">
                        <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
                    </div>
                ) : auditLogs.length === 0 ? (
                    <EmptyState
                        icon={Shield}
                        title="No audit logs found"
                        description="Try adjusting your search or filters."
                    />
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Admin</TableHead>
                                    <TableHead>IP Address</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {auditLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            <div className="flex items-center text-sm text-zinc-500">
                                                <Clock className="mr-2 h-4 w-4" />
                                                {formatRelativeTime(new Date(log.timestamp))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getActionBadgeVariant(log.action)}>
                                                {log.action.replace(/_/g, ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium text-zinc-900">{log.admin}</TableCell>
                                        <TableCell className="font-mono text-sm text-zinc-500">{log.ipAddress}</TableCell>
                                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                                        <TableCell className="max-w-xs truncate text-sm text-zinc-500">
                                            {log.details}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Pagination
                            page={currentPage}
                            pages={totalPages}
                            total={totalLogs}
                            limit={20}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}
            </DataTable>

            <Card className="border-green-200 bg-green-50">
                <CardContent className="flex items-start gap-3 p-4">
                    <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                    <div>
                        <h4 className="text-sm font-semibold text-green-700">Backend integration complete</h4>
                        <p className="text-xs text-green-600">
                            Security metrics and audit logs are fetched from the backend with real-time data, filtering,
                            and pagination support.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default SecurityAudit
