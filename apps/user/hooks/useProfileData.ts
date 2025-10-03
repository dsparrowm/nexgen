/**
 * Profile Data Hook
 * Manages user profile and KYC document state
 */

import { useState, useEffect, useCallback } from 'react';
import {
    getProfile,
    updateProfile,
    changePassword,
    getKycDocuments,
    uploadKycDocument,
    type User,
    type KycDocument,
    type ProfileUpdatePayload,
    type PasswordChangePayload,
    type KycUploadPayload,
} from '../utils/api/profileApi';

interface UseProfileDataReturn {
    // Profile state
    user: User | null;
    profileLoading: boolean;
    profileError: string | null;

    // KYC documents state
    kycDocuments: KycDocument[];
    kycLoading: boolean;
    kycError: string | null;

    // Action states
    updating: boolean;
    updateError: string | null;
    changingPassword: boolean;
    passwordError: string | null;
    uploading: boolean;
    uploadError: string | null;
    uploadProgress: number;

    // Actions
    updateUserProfile: (payload: ProfileUpdatePayload) => Promise<void>;
    changeUserPassword: (payload: PasswordChangePayload) => Promise<void>;
    uploadKycDoc: (payload: KycUploadPayload) => Promise<void>;
    refetchProfile: () => Promise<void>;
    refetchKycDocuments: () => Promise<void>;
    clearErrors: () => void;
}

export function useProfileData(): UseProfileDataReturn {
    // Profile state
    const [user, setUser] = useState<User | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    // KYC documents state
    const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
    const [kycLoading, setKycLoading] = useState(false);
    const [kycError, setKycError] = useState<string | null>(null);

    // Action states
    const [updating, setUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    /**
     * Fetch user profile
     */
    const fetchProfile = useCallback(async () => {
        setProfileLoading(true);
        setProfileError(null);

        try {
            const profileData = await getProfile();
            setUser(profileData);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch profile';
            setProfileError(errorMessage);
            console.error('Profile fetch error:', error);
        } finally {
            setProfileLoading(false);
        }
    }, []);

    /**
     * Fetch KYC documents
     */
    const fetchKycDocuments = useCallback(async () => {
        setKycLoading(true);
        setKycError(null);

        try {
            const documents = await getKycDocuments();
            setKycDocuments(documents);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch KYC documents';
            setKycError(errorMessage);
            console.error('KYC documents fetch error:', error);
        } finally {
            setKycLoading(false);
        }
    }, []);

    /**
     * Update user profile
     */
    const updateUserProfile = useCallback(async (payload: ProfileUpdatePayload) => {
        setUpdating(true);
        setUpdateError(null);

        try {
            const updatedUser = await updateProfile(payload);
            setUser(updatedUser);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
            setUpdateError(errorMessage);
            throw error;
        } finally {
            setUpdating(false);
        }
    }, []);

    /**
     * Change user password
     */
    const changeUserPassword = useCallback(async (payload: PasswordChangePayload) => {
        setChangingPassword(true);
        setPasswordError(null);

        try {
            await changePassword(payload);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
            setPasswordError(errorMessage);
            throw error;
        } finally {
            setChangingPassword(false);
        }
    }, []);

    /**
     * Upload KYC document
     */
    const uploadKycDoc = useCallback(async (payload: KycUploadPayload) => {
        setUploading(true);
        setUploadError(null);
        setUploadProgress(0);

        try {
            // Simulate upload progress (since we can't track actual FormData upload progress easily)
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            const document = await uploadKycDocument(payload);

            clearInterval(progressInterval);
            setUploadProgress(100);

            // Add new document to list
            setKycDocuments((prev) => [document, ...prev]);

            // Update user's KYC status if needed
            if (user) {
                setUser({ ...user, kycStatus: 'PENDING' });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to upload document';
            setUploadError(errorMessage);
            throw error;
        } finally {
            setUploading(false);
            setTimeout(() => setUploadProgress(0), 1000);
        }
    }, [user]);

    /**
     * Refetch profile
     */
    const refetchProfile = useCallback(async () => {
        await fetchProfile();
    }, [fetchProfile]);

    /**
     * Refetch KYC documents
     */
    const refetchKycDocuments = useCallback(async () => {
        await fetchKycDocuments();
    }, [fetchKycDocuments]);

    /**
     * Clear all errors
     */
    const clearErrors = useCallback(() => {
        setProfileError(null);
        setKycError(null);
        setUpdateError(null);
        setPasswordError(null);
        setUploadError(null);
    }, []);

    /**
     * Initial data fetch on mount
     */
    useEffect(() => {
        fetchProfile();
        fetchKycDocuments();
    }, [fetchProfile, fetchKycDocuments]);

    return {
        // Profile state
        user,
        profileLoading,
        profileError,

        // KYC documents state
        kycDocuments,
        kycLoading,
        kycError,

        // Action states
        updating,
        updateError,
        changingPassword,
        passwordError,
        uploading,
        uploadError,
        uploadProgress,

        // Actions
        updateUserProfile,
        changeUserPassword,
        uploadKycDoc,
        refetchProfile,
        refetchKycDocuments,
        clearErrors,
    };
}
