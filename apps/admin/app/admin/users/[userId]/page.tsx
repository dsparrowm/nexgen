'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { adminRoutes } from '@/lib/adminRoutes'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../../components/AdminLayout'
import { useToast } from '@/components/ToastContext'
import {
    ArrowLeft,
    Mail,
    Phone,
    Calendar,
    DollarSign,
    TrendingUp,
    Shield,
    User,
    Edit,
    Ban,
    CheckCircle,
    AlertTriangle,
    CreditCard,
    Activity,
} from 'lucide-react'
import {
    Avatar,
    Badge,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    IconButton,
    Skeleton,
    StatCard,
    WorkspaceHeader,
    type BadgeVariant,
} from '@/components/ui'

interface UserDetails {
    id: string
    email: string
    username: string
    firstName: string | null
    lastName: string | null
    role: string
    isActive: boolean
    isVerified: boolean
    isEmailVerified: boolean
    kycStatus: string
    balance: number
    totalInvested: number
    totalEarnings: number
    referralCode: string
    phoneNumber: string | null
    country: string | null
    createdAt: string
    updatedAt: string
    _count: {
        investments: number
        transactions: number
        kycDocuments: number
        referrals: number
    }
}

function getKycBadgeVariant(status: string): BadgeVariant {
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

function formatCurrency(value: number) {
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 py-2">
            <p className="text-sm text-zinc-500">{label}</p>
            <div className="text-sm font-medium text-zinc-900">{value}</div>
        </div>
    )
}

const UserDetailsPage = () => {
    const router = useRouter()
    const params = useParams()
    const userId = params?.userId as string
    const { addToast } = useToast()

    const [user, setUser] = useState<UserDetails | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (userId) {
            fetchUserDetails()
        }
    }, [userId])

    const fetchUserDetails = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await apiClient.getUserById(userId)

            if (response.success && response.data) {
                setUser(response.data.user)
            } else {
                setError(response.error?.message || 'Failed to load user details')
            }
        } catch (err) {
            console.error('Error fetching user details:', err)
            setError('An error occurred while loading user details')
        } finally {
            setIsLoading(false)
        }
    }

    const getUserDisplayName = () => {
        if (!user) return 'User'
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`
        }
        return user.username
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const handleToggleStatus = async () => {
        if (!user) return

        const newStatus = !user.isActive
        const action = newStatus ? 'activate' : 'suspend'

        if (!window.confirm(`Are you sure you want to ${action} this user?`)) return

        try {
            const response = await apiClient.updateUser(userId, { isActive: newStatus })

            if (response.success) {
                setUser({ ...user, isActive: newStatus })
                addToast('success', `User ${action}d successfully`)
            } else {
                addToast('error', `Failed to ${action} user`, response.error?.message)
            }
        } catch (toggleError) {
            console.error('Toggle status error:', toggleError)
            addToast('error', `An error occurred while ${action}ing the user`)
        }
    }

    if (isLoading) {
        return (
            <ProtectedRoute>
                <AdminLayout>
                    <div className="space-y-6">
                        <Skeleton className="h-16 w-full" />
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-28" />
                            ))}
                        </div>
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <Skeleton className="h-64" />
                            <Skeleton className="h-64" />
                        </div>
                    </div>
                </AdminLayout>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                            <IconButton
                                onClick={() => router.push(adminRoutes.customers)}
                                title="Back to users"
                                className="mt-0.5"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </IconButton>
                            <WorkspaceHeader
                                title="User details"
                                description="View and manage customer account information."
                            />
                        </div>
                        {user && (
                            <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                                <Button
                                    variant="secondary"
                                    onClick={() => router.push(adminRoutes.customerEdit(userId))}
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit user
                                </Button>
                                <Button
                                    variant={user.isActive ? 'secondary' : 'primary'}
                                    onClick={handleToggleStatus}
                                >
                                    {user.isActive ? (
                                        <Ban className="h-4 w-4" />
                                    ) : (
                                        <CheckCircle className="h-4 w-4" />
                                    )}
                                    {user.isActive ? 'Suspend' : 'Activate'}
                                </Button>
                            </div>
                        )}
                    </div>

                    {error && !user && (
                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="flex items-center gap-3 p-4">
                                <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-red-700">Error loading user</p>
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => fetchUserDetails()}>
                                    Retry
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {user && (
                        <>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                        <Avatar name={getUserDisplayName()} size="lg" className="h-16 w-16 text-lg" />
                                        <div className="min-w-0 flex-1">
                                            <h2 className="text-xl font-semibold text-zinc-900">{getUserDisplayName()}</h2>
                                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Mail className="h-4 w-4" />
                                                    {user.email}
                                                </span>
                                                {user.phoneNumber && (
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <Phone className="h-4 w-4" />
                                                        {user.phoneNumber}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                <Badge variant={user.isActive ? 'success' : 'neutral'}>
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                                <Badge variant={getKycBadgeVariant(user.kycStatus)}>
                                                    KYC: {user.kycStatus.charAt(0) + user.kycStatus.slice(1).toLowerCase()}
                                                </Badge>
                                                <Badge variant="gold">{user.role}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <StatCard
                                    title="Current balance"
                                    value={formatCurrency(user.balance)}
                                    icon={DollarSign}
                                />
                                <StatCard
                                    title="Total invested"
                                    value={formatCurrency(user.totalInvested)}
                                    icon={TrendingUp}
                                />
                                <StatCard
                                    title="Total earnings"
                                    value={formatCurrency(user.totalEarnings)}
                                    icon={CreditCard}
                                />
                                <StatCard
                                    title="Active investments"
                                    value={String(user._count.investments)}
                                    icon={Activity}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <User className="h-4 w-4 text-gold-600" />
                                            Account information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="divide-y divide-zinc-100 pt-2">
                                        <InfoRow label="Username" value={user.username} />
                                        <InfoRow label="Email" value={user.email} />
                                        <InfoRow label="Role" value={user.role} />
                                        <InfoRow label="Referral code" value={<span className="font-mono">{user.referralCode}</span>} />
                                        {user.country && <InfoRow label="Country" value={user.country} />}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Shield className="h-4 w-4 text-gold-600" />
                                            Account status
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="divide-y divide-zinc-100 pt-2">
                                        <InfoRow
                                            label="Account active"
                                            value={
                                                <Badge variant={user.isActive ? 'success' : 'neutral'}>
                                                    {user.isActive ? 'Yes' : 'No'}
                                                </Badge>
                                            }
                                        />
                                        <InfoRow
                                            label="Email verified"
                                            value={
                                                <Badge variant={user.isEmailVerified ? 'success' : 'warning'}>
                                                    {user.isEmailVerified ? 'Yes' : 'No'}
                                                </Badge>
                                            }
                                        />
                                        <InfoRow label="KYC status" value={user.kycStatus} />
                                        <InfoRow label="KYC documents" value={user._count.kycDocuments} />
                                        <InfoRow label="Total transactions" value={user._count.transactions} />
                                        <InfoRow label="Referrals" value={user._count.referrals} />
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Calendar className="h-4 w-4 text-gold-600" />
                                        Timeline
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                                Member since
                                            </p>
                                            <p className="mt-1 text-sm font-medium text-zinc-900">{formatDate(user.createdAt)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                                Last updated
                                            </p>
                                            <p className="mt-1 text-sm font-medium text-zinc-900">{formatDate(user.updatedAt)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default UserDetailsPage
