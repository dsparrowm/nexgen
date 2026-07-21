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
    uploadProfileImage,
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
    uploadingAvatar: boolean;
    avatarError: string | null;

    // Actions
    updateUserProfile: (payload: ProfileUpdatePayload) => Promise<void>;
    changeUserPassword: (payload: PasswordChangePayload) => Promise<void>;
    uploadKycDoc: (payload: KycUploadPayload) => Promise<void>;
    uploadAvatar: (file: File) => Promise<void>;
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
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarError, setAvatarError] = useState<string | null>(null);

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

    const uploadKycDoc = useCallback(async (payload: KycUploadPayload) => {
        setUploading(true);
        setUploadError(null);
        setUploadProgress(0);

        try {
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

            setKycDocuments((prev) => [document, ...prev]);

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

    const uploadAvatar = useCallback(async (file: File) => {
        setUploadingAvatar(true);
        setAvatarError(null);

        try {
            const updatedUser = await uploadProfileImage(file);
            setUser(updatedUser);

            // Keep localStorage user in sync for nav/header consumers
            try {
                const stored = localStorage.getItem('user');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    localStorage.setItem(
                        'user',
                        JSON.stringify({ ...parsed, profileImage: updatedUser.profileImage })
                    );
                }
            } catch {
                // ignore localStorage sync failures
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to upload profile image';
            setAvatarError(errorMessage);
            throw error;
        } finally {
            setUploadingAvatar(false);
        }
    }, []);

    const refetchProfile = useCallback(async () => {
        await fetchProfile();
    }, [fetchProfile]);

    const refetchKycDocuments = useCallback(async () => {
        await fetchKycDocuments();
    }, [fetchKycDocuments]);

    const clearErrors = useCallback(() => {
        setProfileError(null);
        setKycError(null);
        setUpdateError(null);
        setPasswordError(null);
        setUploadError(null);
        setAvatarError(null);
    }, []);

    useEffect(() => {
        fetchProfile();
        fetchKycDocuments();
    }, [fetchProfile, fetchKycDocuments]);

    return {
        user,
        profileLoading,
        profileError,
        kycDocuments,
        kycLoading,
        kycError,
        updating,
        updateError,
        changingPassword,
        passwordError,
        uploading,
        uploadError,
        uploadProgress,
        uploadingAvatar,
        avatarError,
        updateUserProfile,
        changeUserPassword,
        uploadKycDoc,
        uploadAvatar,
        refetchProfile,
        refetchKycDocuments,
        clearErrors,
    };
}
