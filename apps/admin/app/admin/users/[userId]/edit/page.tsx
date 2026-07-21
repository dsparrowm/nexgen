'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { adminRoutes } from '@/lib/adminRoutes'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminLayout from '../../../components/AdminLayout'
import {
    ArrowLeft,
    Save,
    User,
    Phone,
    Shield,
    CheckCircle,
    AlertCircle,
    Loader,
    Camera,
} from 'lucide-react'
import {
    Avatar,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    IconButton,
    Input,
    Select,
    Skeleton,
    WorkspaceHeader,
} from '@/components/ui'

interface UserData {
    id: string
    email: string
    username: string
    firstName: string | null
    lastName: string | null
    profileImage?: string | null
    role: string
    isActive: boolean
    isVerified: boolean
    isEmailVerified: boolean
    kycStatus: string
    balance: number
    phoneNumber: string | null
    country: string | null
    state: string | null
    city: string | null
    address: string | null
    zipCode: string | null
}

interface FormData {
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    country: string
    state: string
    city: string
    address: string
    zipCode: string
    role: string
    isActive: boolean
    isVerified: boolean
    kycStatus: string
    balance: string
}

const EditUserPage = () => {
    const router = useRouter()
    const params = useParams()
    const userId = params?.userId as string
    const avatarInputRef = useRef<HTMLInputElement>(null)

    const [user, setUser] = useState<UserData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        country: '',
        state: '',
        city: '',
        address: '',
        zipCode: '',
        role: 'USER',
        isActive: true,
        isVerified: false,
        kycStatus: 'PENDING',
        balance: '0',
    })

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
                const userData = response.data.user
                setUser(userData)

                setFormData({
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    email: userData.email || '',
                    phoneNumber: userData.phoneNumber || '',
                    country: userData.country || '',
                    state: userData.state || '',
                    city: userData.city || '',
                    address: userData.address || '',
                    zipCode: userData.zipCode || '',
                    role: userData.role || 'USER',
                    isActive: userData.isActive ?? true,
                    isVerified: userData.isVerified ?? false,
                    kycStatus: userData.kycStatus || 'PENDING',
                    balance: userData.balance?.toString() || '0',
                })
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked
            setFormData((prev) => ({ ...prev, [name]: checked }))
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }))
        }
    }

    const getDisplayName = () => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName} ${user.lastName}`
        }
        return user?.username || 'User'
    }

    const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            setError('Profile image must be less than 2MB')
            return
        }

        if (!file.type.startsWith('image/')) {
            setError('Only image files are allowed for profile pictures')
            return
        }

        setIsUploadingAvatar(true)
        setError(null)
        setSuccessMessage(null)

        try {
            const response = await apiClient.uploadUserAvatar(userId, file)

            if (response.success && response.data?.user) {
                setUser((prev) =>
                    prev
                        ? { ...prev, profileImage: response.data!.user.profileImage }
                        : prev
                )
                setSuccessMessage('Profile picture updated successfully!')
            } else {
                setError(response.error?.message || 'Failed to upload profile picture')
            }
        } catch (err) {
            console.error('Error uploading avatar:', err)
            setError('An error occurred while uploading the profile picture')
        } finally {
            setIsUploadingAvatar(false)
            if (avatarInputRef.current) {
                avatarInputRef.current.value = ''
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setError(null)
        setSuccessMessage(null)

        try {
            const updateData: Record<string, unknown> = {
                firstName: formData.firstName || null,
                lastName: formData.lastName || null,
                phoneNumber: formData.phoneNumber || null,
                country: formData.country || null,
                state: formData.state || null,
                city: formData.city || null,
                address: formData.address || null,
                zipCode: formData.zipCode || null,
                role: formData.role,
                isActive: formData.isActive,
                isVerified: formData.isVerified,
                kycStatus: formData.kycStatus,
                balance: parseFloat(formData.balance) || 0,
            }

            const response = await apiClient.updateUser(userId, updateData)

            if (response.success) {
                setSuccessMessage('User updated successfully!')

                setTimeout(() => {
                    router.push(adminRoutes.customerDetails(userId))
                }, 1500)
            } else {
                setError(response.error?.message || 'Failed to update user')
            }
        } catch (err) {
            console.error('Error updating user:', err)
            setError('An error occurred while updating the user')
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        router.push(adminRoutes.customerDetails(userId))
    }

    if (isLoading) {
        return (
            <ProtectedRoute>
                <AdminLayout>
                    <div className="space-y-6">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                </AdminLayout>
            </ProtectedRoute>
        )
    }

    if (error && !user) {
        return (
            <ProtectedRoute>
                <AdminLayout>
                    <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
                        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
                        <p className="mb-2 text-lg font-semibold text-zinc-900">Error loading user</p>
                        <p className="mb-6 text-sm text-zinc-500">{error}</p>
                        <Button onClick={() => router.push(adminRoutes.customers)}>Back to users</Button>
                    </div>
                </AdminLayout>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    <div className="flex items-start gap-3">
                        <IconButton onClick={handleCancel} title="Back to user details" className="mt-0.5">
                            <ArrowLeft className="h-4 w-4" />
                        </IconButton>
                        <WorkspaceHeader title="Edit user" description="Update customer account information." />
                    </div>

                    {successMessage && (
                        <Card className="border-green-200 bg-green-50">
                            <CardContent className="flex items-center gap-3 p-4">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <p className="text-sm text-green-700">{successMessage}</p>
                            </CardContent>
                        </Card>
                    )}

                    {error && (
                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="flex items-center gap-3 p-4">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                <p className="text-sm text-red-700">{error}</p>
                            </CardContent>
                        </Card>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <User className="h-4 w-4 text-gold-600" />
                                    Personal information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Avatar
                                            name={getDisplayName()}
                                            src={user?.profileImage}
                                            size="lg"
                                            className="h-16 w-16 text-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => avatarInputRef.current?.click()}
                                            disabled={isUploadingAvatar}
                                            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 text-white shadow-sm transition-colors hover:bg-gold-600 disabled:opacity-50"
                                            aria-label="Upload profile picture"
                                        >
                                            {isUploadingAvatar ? (
                                                <Loader className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Camera className="h-3.5 w-3.5" />
                                            )}
                                        </button>
                                        <input
                                            ref={avatarInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/jpg"
                                            onChange={handleAvatarSelect}
                                            className="hidden"
                                        />
                                    </div>
                                    <div>
                                        <p className="font-medium text-zinc-900">{getDisplayName()}</p>
                                        <p className="text-sm text-zinc-500">
                                            {isUploadingAvatar
                                                ? 'Uploading profile picture...'
                                                : 'JPG, PNG or WebP · max 2MB'}
                                        </p>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="mt-1 px-0"
                                            onClick={() => avatarInputRef.current?.click()}
                                            disabled={isUploadingAvatar}
                                        >
                                            Change photo
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Input
                                    label="First name"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    placeholder="Enter first name"
                                />
                                <Input
                                    label="Last name"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    placeholder="Enter last name"
                                />
                                <div>
                                    <Input label="Username" value={user?.username || ''} disabled />
                                    <p className="mt-1 text-xs text-zinc-400">Username cannot be changed</p>
                                </div>
                                <div>
                                    <Input label="Email address" value={user?.email || ''} disabled />
                                    <p className="mt-1 text-xs text-zinc-400">Email cannot be changed</p>
                                </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Phone className="h-4 w-4 text-gold-600" />
                                    Contact information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Input
                                    label="Phone number"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    placeholder="Enter phone number"
                                />
                                <Input
                                    label="Country"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleInputChange}
                                    placeholder="Enter country"
                                />
                                <Input
                                    label="State / province"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    placeholder="Enter state or province"
                                />
                                <Input
                                    label="City"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    placeholder="Enter city"
                                />
                                <Input
                                    label="Address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="Enter address"
                                />
                                <Input
                                    label="ZIP / postal code"
                                    name="zipCode"
                                    value={formData.zipCode}
                                    onChange={handleInputChange}
                                    placeholder="Enter ZIP or postal code"
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Shield className="h-4 w-4 text-gold-600" />
                                    Account settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Select label="Role" name="role" value={formData.role} onChange={handleInputChange}>
                                    <option value="USER">User</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="SUPER_ADMIN">Super Admin</option>
                                </Select>
                                <Select
                                    label="KYC status"
                                    name="kycStatus"
                                    value={formData.kycStatus}
                                    onChange={handleInputChange}
                                >
                                    <option value="PENDING">Pending</option>
                                    <option value="VERIFIED">Verified</option>
                                    <option value="REJECTED">Rejected</option>
                                </Select>
                                <Input
                                    label="Balance ($)"
                                    type="number"
                                    name="balance"
                                    value={formData.balance}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                />
                                <div className="flex flex-col justify-center gap-3">
                                    <label className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={formData.isActive}
                                            onChange={handleInputChange}
                                            className="rounded border-zinc-300 text-gold-500 focus:ring-gold-500"
                                        />
                                        <span className="text-sm font-medium text-zinc-700">Account active</span>
                                    </label>
                                    <label className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            name="isVerified"
                                            checked={formData.isVerified}
                                            onChange={handleInputChange}
                                            className="rounded border-zinc-300 text-gold-500 focus:ring-gold-500"
                                        />
                                        <span className="text-sm font-medium text-zinc-700">Account verified</span>
                                    </label>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="secondary" onClick={handleCancel} disabled={isSaving}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader className="h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Save changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </AdminLayout>
        </ProtectedRoute>
    )
}

export default EditUserPage
