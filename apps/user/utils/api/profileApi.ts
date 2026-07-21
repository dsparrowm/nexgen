/**
 * Profile API Utilities
 * Handles all user profile and settings-related API communications
 */

import { getApiBase } from '@/lib/axiosInstance';

const API_BASE_URL = getApiBase(true);

// ==================== TypeScript Interfaces ====================

export type DocumentType =
    | 'PASSPORT'
    | 'DRIVER_LICENSE'
    | 'NATIONAL_ID'
    | 'UTILITY_BILL'
    | 'BANK_STATEMENT'
    | 'SELFIE'
    | 'OTHER';

export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';

export interface User {
    id: string;
    email: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
    phoneNumber: string | null;
    country: string | null;
    state: string | null;
    city: string | null;
    address: string | null;
    zipCode: string | null;
    dateOfBirth: string | null;
    kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';
    balance: number;
    totalInvested: number;
    totalEarnings: number;
    referralCode: string;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface KycDocument {
    id: string;
    userId: string;
    type: DocumentType;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    status: DocumentStatus;
    rejectionReason: string | null;
    uploadedAt: string;
    reviewedAt: string | null;
    reviewedBy: string | null;
}

export interface ProfileUpdatePayload {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    country?: string;
    state?: string;
    city?: string;
    address?: string;
    zipCode?: string;
    dateOfBirth?: string;
}

export interface PasswordChangePayload {
    currentPassword: string;
    newPassword: string;
}

export interface KycUploadPayload {
    type: DocumentType;
    file: File;
}

// ==================== API Functions ====================

/**
 * Get current user profile
 */
export async function getProfile(): Promise<User> {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_BASE_URL}auth/user/profile`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to fetch profile');
    }

    const data = await response.json();
    return data.data.user;
}

/**
 * Update user profile
 */
export async function updateProfile(payload: ProfileUpdatePayload): Promise<User> {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_BASE_URL}user/profile/profile`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (errorData.error?.details && Array.isArray(errorData.error.details)) {
            const validationMessages = errorData.error.details.map((d: any) => d.msg).join(', ');
            throw new Error(validationMessages);
        }

        throw new Error(errorData.error?.message || 'Failed to update profile');
    }

    const data = await response.json();
    return data.data.user;
}

/**
 * Upload profile picture
 */
export async function uploadProfileImage(file: File): Promise<User> {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        throw new Error('Authentication token not found');
    }

    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${API_BASE_URL}user/profile/avatar`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (errorData.error?.details && Array.isArray(errorData.error.details)) {
            const validationMessages = errorData.error.details.map((d: any) => d.msg).join(', ');
            throw new Error(validationMessages);
        }

        throw new Error(errorData.error?.message || 'Failed to upload profile image');
    }

    const data = await response.json();
    return data.data.user;
}

/**
 * Change user password
 */
export async function changePassword(payload: PasswordChangePayload): Promise<void> {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_BASE_URL}user/profile/password`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (errorData.error?.details && Array.isArray(errorData.error.details)) {
            const validationMessages = errorData.error.details.map((d: any) => d.msg).join(', ');
            throw new Error(validationMessages);
        }

        throw new Error(errorData.error?.message || 'Failed to change password');
    }
}

/**
 * Get user's KYC documents
 */
export async function getKycDocuments(): Promise<KycDocument[]> {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_BASE_URL}user/profile/kyc/documents`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to fetch KYC documents');
    }

    const data = await response.json();
    return data.data.documents;
}

/**
 * Upload KYC document
 */
export async function uploadKycDocument(payload: KycUploadPayload): Promise<KycDocument> {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        throw new Error('Authentication token not found');
    }

    const formData = new FormData();
    formData.append('document', payload.file);
    formData.append('type', payload.type);

    const response = await fetch(`${API_BASE_URL}user/profile/kyc/upload`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (errorData.error?.details && Array.isArray(errorData.error.details)) {
            const validationMessages = errorData.error.details.map((d: any) => d.msg).join(', ');
            throw new Error(validationMessages);
        }

        throw new Error(errorData.error?.message || 'Failed to upload KYC document');
    }

    const data = await response.json();
    return data.data.document;
}

// ==================== Helper Functions ====================

/**
 * Get KYC status color
 */
export function getKycStatusColor(status: User['kycStatus']): string {
    switch (status) {
        case 'APPROVED':
            return 'text-green-500';
        case 'PENDING':
        case 'UNDER_REVIEW':
            return 'text-yellow-500';
        case 'REJECTED':
            return 'text-red-500';
        default:
            return 'text-gray-500';
    }
}

/**
 * Get KYC status badge color
 */
export function getKycStatusBadgeColor(status: User['kycStatus']): string {
    switch (status) {
        case 'APPROVED':
            return 'bg-green-500/20 text-green-500';
        case 'PENDING':
        case 'UNDER_REVIEW':
            return 'bg-yellow-500/20 text-yellow-500';
        case 'REJECTED':
            return 'bg-red-500/20 text-red-500';
        default:
            return 'bg-gray-500/20 text-gray-500';
    }
}

/**
 * Get document status color
 */
export function getDocumentStatusColor(status: KycDocument['status']): string {
    switch (status) {
        case 'APPROVED':
            return 'text-green-500';
        case 'PENDING':
        case 'UNDER_REVIEW':
            return 'text-yellow-500';
        case 'REJECTED':
            return 'text-red-500';
        default:
            return 'text-gray-500';
    }
}

/**
 * Get document status badge color
 */
export function getDocumentStatusBadgeColor(status: KycDocument['status']): string {
    switch (status) {
        case 'APPROVED':
            return 'bg-green-500/20 text-green-500';
        case 'PENDING':
        case 'UNDER_REVIEW':
            return 'bg-yellow-500/20 text-yellow-500';
        case 'REJECTED':
            return 'bg-red-500/20 text-red-500';
        default:
            return 'bg-gray-500/20 text-gray-500';
    }
}

/**
 * Format document type for display
 */
export function formatDocumentType(type: DocumentType): string {
    switch (type) {
        case 'NATIONAL_ID':
            return 'National ID';
        case 'PASSPORT':
            return 'Passport';
        case 'DRIVER_LICENSE':
            return "Driver's License";
        case 'UTILITY_BILL':
            return 'Utility Bill';
        case 'BANK_STATEMENT':
            return 'Bank Statement';
        case 'SELFIE':
            return 'Selfie';
        case 'OTHER':
            return 'Other Document';
        default:
            return type;
    }
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
    isValid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    feedback: string[];
} {
    const feedback: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    let score = 0;

    if (password.length >= 8) {
        score++;
    } else {
        feedback.push('Password must be at least 8 characters long');
    }

    if (/[A-Z]/.test(password)) {
        score++;
    } else {
        feedback.push('Include at least one uppercase letter');
    }

    if (/[a-z]/.test(password)) {
        score++;
    } else {
        feedback.push('Include at least one lowercase letter');
    }

    if (/\d/.test(password)) {
        score++;
    } else {
        feedback.push('Include at least one number');
    }

    if (/[@$!%*?&#]/.test(password)) {
        score++;
    } else {
        feedback.push('Include at least one special character (@$!%*?&#)');
    }

    if (score >= 5) {
        strength = 'strong';
    } else if (score >= 4) {
        strength = 'medium';
    } else {
        strength = 'weak';
    }

    const isValid = score >= 5;

    return { isValid, strength, feedback };
}

/**
 * Get full name from user object
 */
export function getFullName(user: User): string {
    if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
        return user.firstName;
    }
    return user.username;
}

/**
 * Get initials for avatar fallback
 */
export function getInitials(user: User): string {
    const name = getFullName(user);
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
}

/**
 * Check if profile is complete
 */
export function isProfileComplete(user: User): boolean {
    return !!(
        user.firstName &&
        user.lastName &&
        user.phoneNumber &&
        user.country &&
        user.city &&
        user.address
    );
}

/**
 * Get profile completion percentage
 */
export function getProfileCompletionPercentage(user: User): number {
    const fields = [
        user.firstName,
        user.lastName,
        user.phoneNumber,
        user.country,
        user.state,
        user.city,
        user.address,
        user.zipCode,
        user.dateOfBirth,
        user.profileImage,
    ];

    const completedFields = fields.filter((field) => field !== null && field !== '').length;
    return Math.round((completedFields / fields.length) * 100);
}
