'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { useToast } from '@/components/ToastContext'
import {
    Users,
    Plus,
    Edit,
    Trash2,
    UserCheck,
    UserX,
    DollarSign,
    Shield,
    Eye,
    Download,
    RefreshCw,
    AlertTriangle,
} from 'lucide-react'
import {
    Avatar,
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

interface User {
    id: string
    email: string
    username: string
    firstName: string | null
    lastName: string | null
    profileImage?: string | null
    role: string
    isActive: boolean
    isVerified: boolean
    kycStatus: string
    balance: number
    totalInvested: number
    totalEarnings: number
    createdAt: string
    updatedAt: string
    _count: {
        investments: number
        transactions: number
        kycDocuments: number
    }
}

interface PaginationInfo {
    page: number
    limit: number
    total: number
    pages: number
}

const UserManagement = () => {
    const router = useRouter()
    const { addToast } = useToast()
    const [users, setUsers] = useState<User[]>([])
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
    })
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [kycFilter, setKycFilter] = useState('all')
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        kycVerified: 0,
        totalBalance: 0,
    })

    const fetchUsers = async (showRefreshIndicator = false) => {
        if (showRefreshIndicator) {
            setIsRefreshing(true)
        } else {
            setIsLoading(true)
        }
        setError(null)

        try {
            const params: Record<string, string | number | boolean> = {
                page: pagination.page,
                limit: pagination.limit,
            }

            if (searchTerm) params.search = searchTerm
            if (statusFilter !== 'all') params.isActive = statusFilter === 'active'
            if (kycFilter !== 'all') params.kycStatus = kycFilter.toUpperCase()

            const response = await apiClient.getUsers(params)

            if (response.success && response.data) {
                setUsers(response.data.users)
                setPagination(response.data.pagination)
                setStats({
                    totalUsers: response.data.pagination.total,
                    activeUsers: response.data.users.filter((u: User) => u.isActive).length,
                    kycVerified: response.data.users.filter((u: User) => u.kycStatus === 'VERIFIED').length,
                    totalBalance: response.data.users.reduce(
                        (sum: number, user: User) => sum + Number(user.balance),
                        0
                    ),
                })
            } else {
                setError(response.error?.message || 'Failed to load users')
            }
        } catch (err) {
            console.error('Error fetching users:', err)
            setError('An error occurred while loading users')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [pagination.page, pagination.limit])

    useEffect(() => {
        const debounce = setTimeout(() => {
            if (pagination.page === 1) {
                fetchUsers()
            } else {
                setPagination((prev) => ({ ...prev, page: 1 }))
            }
        }, 500)

        return () => clearTimeout(debounce)
    }, [searchTerm, statusFilter, kycFilter])

    const getUserDisplayName = (user: User) => {
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`
        }
        return user.username
    }

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })

    const getKycBadgeVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
        switch (status) {
            case 'VERIFIED':
                return 'success'
            case 'REJECTED':
                return 'error'
            case 'PENDING':
                return 'warning'
            default:
                return 'neutral'
        }
    }

    const handleUserAction = async (action: string, userId: string) => {
        try {
            switch (action) {
                case 'edit':
                    router.push(`/admin/customers/${userId}/edit`)
                    break
                case 'view':
                    router.push(`/admin/customers/${userId}`)
                    break
                case 'delete':
                    await handleDeleteUser(userId)
                    break
                case 'suspend':
                    await handleToggleUserStatus(userId, false)
                    break
                case 'activate':
                    await handleToggleUserStatus(userId, true)
                    break
                default:
                    break
            }
        } catch (actionError) {
            console.error('Error handling user action:', actionError)
        }
    }

    const handleDeleteUser = async (userId: string) => {
        const user = users.find((u) => u.id === userId)
        if (!user) return

        const confirmed = window.confirm(
            `Are you sure you want to permanently delete ${getUserDisplayName(user)}?\n\nThis action cannot be undone.`
        )
        if (!confirmed) return

        try {
            const response = await apiClient.deleteUser(userId)
            if (response.success) {
                setUsers(users.filter((u) => u.id !== userId))
                setSelectedUsers(selectedUsers.filter((id) => id !== userId))
                addToast('success', 'User permanently deleted successfully')
                await fetchUsers(true)
            } else {
                addToast('error', 'Failed to delete user', response.error?.message)
            }
        } catch (deleteError) {
            console.error('Delete user error:', deleteError)
            addToast('error', 'An error occurred while deleting the user')
        }
    }

    const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
        const user = users.find((u) => u.id === userId)
        if (!user) return

        const action = isActive ? 'activate' : 'suspend'
        const confirmed = window.confirm(`Are you sure you want to ${action} ${getUserDisplayName(user)}?`)
        if (!confirmed) return

        try {
            const response = await apiClient.updateUser(userId, { isActive })
            if (response.success) {
                setUsers(users.map((u) => (u.id === userId ? { ...u, isActive } : u)))
                addToast('success', `User ${action}d successfully`)
            } else {
                addToast('error', `Failed to ${action} user`, response.error?.message)
            }
        } catch (toggleError) {
            console.error('Toggle user status error:', toggleError)
            addToast('error', `An error occurred while ${action}ing the user`)
        }
    }

    const handleBulkAction = async (action: string) => {
        if (selectedUsers.length === 0) return

        const confirmed = window.confirm(
            `Are you sure you want to ${action === 'delete' ? 'permanently delete' : action} ${selectedUsers.length} selected user(s)?`
        )
        if (!confirmed) return

        try {
            let successCount = 0
            let failCount = 0

            for (const userId of selectedUsers) {
                try {
                    let response
                    switch (action) {
                        case 'delete':
                            response = await apiClient.deleteUser(userId)
                            break
                        case 'activate':
                            response = await apiClient.updateUser(userId, { isActive: true })
                            break
                        case 'suspend':
                            response = await apiClient.updateUser(userId, { isActive: false })
                            break
                        default:
                            continue
                    }
                    if (response.success) successCount++
                    else failCount++
                } catch {
                    failCount++
                }
            }

            await fetchUsers(true)
            setSelectedUsers([])

            if (failCount === 0) {
                addToast('success', `Successfully processed ${successCount} user(s)`)
            } else {
                addToast('warning', `Completed: ${successCount} succeeded, ${failCount} failed`)
            }
        } catch (bulkError) {
            console.error('Bulk action error:', bulkError)
            addToast('error', 'An error occurred during bulk operation')
        }
    }

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        )
    }

    const selectAllUsers = () => {
        setSelectedUsers(selectedUsers.length === users.length ? [] : users.map((user) => user.id))
    }

    const handlePageChange = (newPage: number) => {
        setPagination((prev) => ({ ...prev, page: newPage }))
    }

    if (isLoading && users.length === 0) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-16 w-full" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
                title="User Management"
                description="Manage customer accounts, access, and verification state."
                action={
                    <Button onClick={() => router.push('/admin/customers/add')}>
                        <Plus className="h-4 w-4" />
                        Add user
                    </Button>
                }
            />

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => fetchUsers()}>
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Total Users" value={String(stats.totalUsers)} icon={Users} />
                <StatCard title="Active Users" value={String(stats.activeUsers)} icon={UserCheck} />
                <StatCard title="KYC Verified" value={String(stats.kycVerified)} icon={Shield} />
                <StatCard
                    title="Total Balance"
                    value={`$${stats.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={DollarSign}
                />
            </div>

            <WorkspaceToolbar>
                <WorkspaceToolbarFilters>
                    <SearchInput
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        containerClassName="w-full sm:w-64"
                    />
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full sm:w-40"
                    >
                        <option value="all">All status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </Select>
                    <Select
                        value={kycFilter}
                        onChange={(e) => setKycFilter(e.target.value)}
                        className="w-full sm:w-40"
                    >
                        <option value="all">All KYC</option>
                        <option value="verified">Verified</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                    </Select>
                </WorkspaceToolbarFilters>

                <WorkspaceToolbarActions>
                    {selectedUsers.length > 0 && (
                        <>
                            <span className="text-sm text-zinc-500">{selectedUsers.length} selected</span>
                            <Button variant="secondary" size="sm" onClick={() => handleBulkAction('activate')}>
                                Activate
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => handleBulkAction('suspend')}>
                                Suspend
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleBulkAction('delete')}>
                                Delete
                            </Button>
                        </>
                    )}
                    <IconButton onClick={() => fetchUsers(true)} disabled={isRefreshing} title="Refresh">
                        <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                    </IconButton>
                    <IconButton title="Export">
                        <Download className="h-4 w-4" />
                    </IconButton>
                </WorkspaceToolbarActions>
            </WorkspaceToolbar>

            <DataTable>
                {isRefreshing ? (
                    <div className="flex items-center justify-center py-16">
                        <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
                    </div>
                ) : users.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="No users found"
                        description="Try adjusting your search or filters."
                    />
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.length === users.length && users.length > 0}
                                            onChange={selectAllUsers}
                                            className="rounded border-zinc-300 text-gold-500 focus:ring-gold-500"
                                        />
                                    </TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>KYC</TableHead>
                                    <TableHead>Balance</TableHead>
                                    <TableHead>Invested</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => toggleUserSelection(user.id)}
                                                className="rounded border-zinc-300 text-gold-500 focus:ring-gold-500"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar name={getUserDisplayName(user)} src={user.profileImage} size="md" />
                                                <div>
                                                    <p className="font-medium text-zinc-900">
                                                        {getUserDisplayName(user)}
                                                    </p>
                                                    <p className="text-xs text-zinc-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.isActive ? 'success' : 'neutral'}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getKycBadgeVariant(user.kycStatus)}>
                                                {user.kycStatus.charAt(0) + user.kycStatus.slice(1).toLowerCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium text-zinc-900">
                                            ${Number(user.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="font-medium text-zinc-900">
                                            ${Number(user.totalInvested).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-zinc-500">{formatDate(user.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-1">
                                                <IconButton onClick={() => handleUserAction('view', user.id)} title="View">
                                                    <Eye className="h-4 w-4" />
                                                </IconButton>
                                                <IconButton onClick={() => handleUserAction('edit', user.id)} title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </IconButton>
                                                <IconButton
                                                    onClick={() =>
                                                        handleUserAction(user.isActive ? 'suspend' : 'activate', user.id)
                                                    }
                                                    title={user.isActive ? 'Suspend' : 'Activate'}
                                                >
                                                    {user.isActive ? (
                                                        <UserX className="h-4 w-4" />
                                                    ) : (
                                                        <UserCheck className="h-4 w-4" />
                                                    )}
                                                </IconButton>
                                                <IconButton
                                                    onClick={() => handleUserAction('delete', user.id)}
                                                    title="Delete"
                                                    className="hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </IconButton>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Pagination
                            page={pagination.page}
                            pages={pagination.pages}
                            total={pagination.total}
                            limit={pagination.limit}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </DataTable>
        </div>
    )
}

export default UserManagement
