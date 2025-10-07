"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertCircle, Upload, FileText, X, Eye, EyeOff } from "lucide-react";
import { useProfileData } from "../../../hooks/useProfileData";
import {
    getFullName,
    getKycStatusBadgeColor,
    getDocumentStatusBadgeColor,
    formatDocumentType,
    validatePasswordStrength,
    getProfileCompletionPercentage,
    type ProfileUpdatePayload,
    type PasswordChangePayload,
    type KycUploadPayload,
} from "../../../utils/api/profileApi";
import { formatDate } from "../../../utils/formatters";

export default function Settings() {
    const {
        user,
        profileLoading,
        profileError,
        kycDocuments,
        kycLoading,
        updating,
        updateError,
        changingPassword,
        passwordError,
        uploading,
        uploadError,
        uploadProgress,
        updateUserProfile,
        changeUserPassword,
        uploadKycDoc,
        refetchProfile,
        clearErrors,
    } = useProfileData();

    // Profile form state
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [country, setCountry] = useState("");
    const [state, setState] = useState("");
    const [city, setCity] = useState("");
    const [address, setAddress] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");

    // Password change modal state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // KYC upload modal state
    const [showKycModal, setShowKycModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [documentType, setDocumentType] = useState<"NATIONAL_ID" | "PASSPORT" | "DRIVERS_LICENSE" | "UTILITY_BILL">("NATIONAL_ID");
    const [documentNumber, setDocumentNumber] = useState("");

    // Success/error message state
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Initialize form values when user data loads
    useState(() => {
        if (user) {
            setFirstName(user.firstName || "");
            setLastName(user.lastName || "");
            setPhoneNumber(user.phoneNumber || "");
            setCountry(user.country || "");
            setState(user.state || "");
            setCity(user.city || "");
            setAddress(user.address || "");
            setZipCode(user.zipCode || "");
            setDateOfBirth(user.dateOfBirth || "");
        }
    });

    const handleSaveProfile = async () => {
        console.log("handleSaveProfile called");
        try {
            clearErrors();
            const payload: ProfileUpdatePayload = {
                firstName,
                lastName,
                phoneNumber,
                country,
                state,
                city,
                address,
                zipCode,
                dateOfBirth,
            };
            console.log("Payload:", payload);

            await updateUserProfile(payload);
            console.log("updateUserProfile succeeded");
            setSuccessMessage("Profile updated successfully!");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error) {
            console.log("updateUserProfile failed:", error);
            // Extract error message from the caught error
            const message = error instanceof Error ? error.message : updateError || "Failed to update profile";
            console.log("Setting error message:", message);
            setErrorMessage(message);
            setTimeout(() => setErrorMessage(""), 5000);
        }
    };

    const handleChangePassword = async () => {
        try {
            clearErrors();

            // Validation
            if (!currentPassword || !newPassword || !confirmPassword) {
                setErrorMessage("All password fields are required");
                setTimeout(() => setErrorMessage(""), 3000);
                return;
            }

            if (newPassword !== confirmPassword) {
                setErrorMessage("New passwords do not match");
                setTimeout(() => setErrorMessage(""), 3000);
                return;
            }

            const validation = validatePasswordStrength(newPassword);
            if (!validation.isValid) {
                setErrorMessage(validation.feedback.join(". "));
                setTimeout(() => setErrorMessage(""), 3000);
                return;
            }

            const payload: PasswordChangePayload = {
                currentPassword,
                newPassword,
            };

            await changeUserPassword(payload);
            setSuccessMessage("Password changed successfully!");
            setShowPasswordModal(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error) {
            // Extract error message from the caught error
            const message = error instanceof Error ? error.message : passwordError || "Failed to change password";
            setErrorMessage(message);
            setTimeout(() => setErrorMessage(""), 5000); // Give more time to read password errors
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setErrorMessage("File size must be less than 5MB");
                setTimeout(() => setErrorMessage(""), 3000);
                return;
            }

            // Validate file type
            const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
            if (!allowedTypes.includes(file.type)) {
                setErrorMessage("Only images (JPEG, PNG) and PDF files are allowed");
                setTimeout(() => setErrorMessage(""), 3000);
                return;
            }

            setSelectedFile(file);
        }
    };

    const handleUploadKyc = async () => {
        if (!selectedFile) {
            setErrorMessage("Please select a file to upload");
            setTimeout(() => setErrorMessage(""), 3000);
            return;
        }

        try {
            clearErrors();
            const payload: KycUploadPayload = {
                documentType,
                documentNumber: documentNumber || undefined,
                file: selectedFile,
            };

            await uploadKycDoc(payload);
            setSuccessMessage("Document uploaded successfully!");
            setShowKycModal(false);
            setSelectedFile(null);
            setDocumentNumber("");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error) {
            // Extract error message from the caught error
            const message = error instanceof Error ? error.message : uploadError || "Failed to upload document";
            setErrorMessage(message);
            setTimeout(() => setErrorMessage(""), 5000);
        }
    };

    if (profileLoading) {
        return (
            <div className="p-4 md:p-8">
                <div className="max-w-4xl">
                    <div className="h-12 bg-gray-800 rounded-lg animate-pulse mb-8" />
                    <div className="space-y-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-48 bg-gray-800 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (profileError) {
        return (
            <div className="p-4 md:p-8">
                <div className="max-w-4xl">
                    <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-500">
                        <p>{profileError}</p>
                        <button
                            onClick={refetchProfile}
                            className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const passwordStrength = newPassword ? validatePasswordStrength(newPassword) : null;
    const profileCompletion = getProfileCompletionPercentage(user);

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-4xl">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">
                    Settings
                </h1>
                <p className="text-gray-400 mb-8">
                    Manage your account settings and preferences
                </p>

                {/* Success/Error Messages */}
                <AnimatePresence>
                    {successMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-6 bg-green-500/20 border border-green-500 rounded-lg p-4 text-green-500 flex items-center gap-2"
                        >
                            <Check className="w-5 h-5" />
                            {successMessage}
                        </motion.div>
                    )}
                    {errorMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-6 bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-500 flex items-center gap-2"
                        >
                            <AlertCircle className="w-5 h-5" />
                            {errorMessage}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid gap-6">
                    {/* Profile Completion */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-white">Profile Completion</h3>
                            <span className="text-2xl font-bold text-blue-400">{profileCompletion}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${profileCompletion}%` }}
                                transition={{ duration: 1, delay: 0.2 }}
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                            />
                        </div>
                    </motion.div>

                    {/* Profile Information */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-2xl p-6 border border-gray-800"
                    >
                        <h2 className="text-xl font-semibold mb-4 text-white">
                            Profile Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">First Name</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Last Name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={user.email}
                                    disabled
                                    className="w-full bg-gray-900/30 border border-gray-700 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Country</label>
                                <input
                                    type="text"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">State/Province</label>
                                <input
                                    type="text"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">City</label>
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">ZIP/Postal Code</label>
                                <input
                                    type="text"
                                    value={zipCode}
                                    onChange={(e) => setZipCode(e.target.value)}
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm text-gray-400 mb-2">Address</label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Date of Birth</label>
                                <input
                                    type="date"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleSaveProfile}
                            disabled={updating}
                            className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {updating ? "Saving..." : "Save Profile"}
                        </button>
                    </motion.div>

                    {/* Security */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-2xl p-6 border border-gray-800"
                    >
                        <h2 className="text-xl font-semibold mb-4 text-white">Security</h2>
                        <div className="grid gap-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white font-medium">Change Password</p>
                                    <p className="text-sm text-gray-400">
                                        Update your password regularly for security
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowPasswordModal(true)}
                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                                >
                                    Change
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white font-medium">
                                        Two-Factor Authentication
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        Add an extra layer of security to your account
                                    </p>
                                </div>
                                <span className="px-3 py-1 bg-gray-700 text-gray-400 rounded-lg text-sm">
                                    Coming Soon
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* KYC Documents */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-2xl p-6 border border-gray-800"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-white">KYC Verification</h2>
                            <button
                                onClick={() => setShowKycModal(true)}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                Upload Document
                            </button>
                        </div>
                        <div className="mb-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">KYC Status</span>
                                <span className={`px-3 py-1 rounded-lg text-sm ${getKycStatusBadgeColor(user.kycStatus)}`}>
                                    {user.kycStatus.replace("_", " ")}
                                </span>
                            </div>
                        </div>
                        {kycLoading ? (
                            <div className="text-center py-4 text-gray-400">Loading documents...</div>
                        ) : kycDocuments.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No documents uploaded yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {kycDocuments.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center justify-between bg-gray-900/50 rounded-lg p-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-blue-400" />
                                            <div>
                                                <p className="text-white font-medium">{formatDocumentType(doc.documentType)}</p>
                                                <p className="text-sm text-gray-400">Uploaded {formatDate(doc.submittedAt)}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-sm ${getDocumentStatusBadgeColor(doc.status)}`}>
                                            {doc.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Account Status */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-2xl p-6 border border-gray-800"
                    >
                        <h2 className="text-xl font-semibold mb-4 text-white">
                            Account Status
                        </h2>
                        <div className="grid gap-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Member Since</span>
                                <span className="text-white">{formatDate(user.createdAt)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Account Balance</span>
                                <span className="text-white">${user.balance.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Total Invested</span>
                                <span className="text-white">${user.totalInvested.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Total Earnings</span>
                                <span className="text-white">${user.totalEarnings.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Verification Status</span>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 ${user.isVerified ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"
                                        }`}>
                                        {user.isVerified && <Check className="w-3 h-3" />}
                                        {user.isVerified ? "Verified" : "Pending"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Password Change Modal */}
            <AnimatePresence>
                {showPasswordModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowPasswordModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-6 max-w-md w-full border border-gray-700"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold text-white">Change Password</h3>
                                <button
                                    onClick={() => setShowPasswordModal(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Error message inside modal */}
                            {errorMessage && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mb-4 bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-500 flex items-center gap-2 text-sm"
                                >
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{errorMessage}</span>
                                </motion.div>
                            )}

                            {/* Success message inside modal */}
                            {successMessage && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mb-4 bg-green-500/20 border border-green-500 rounded-lg p-3 text-green-500 flex items-center gap-2 text-sm"
                                >
                                    <Check className="w-4 h-4 flex-shrink-0" />
                                    <span>{successMessage}</span>
                                </motion.div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none pr-10"
                                        />
                                        <button
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                        >
                                            {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none pr-10"
                                        />
                                        <button
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                        >
                                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {passwordStrength && (
                                        <div className="mt-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`h-1 flex-1 rounded-full ${passwordStrength.strength === "strong" ? "bg-green-500" :
                                                    passwordStrength.strength === "medium" ? "bg-yellow-500" : "bg-red-500"
                                                    }`} />
                                                <span className={`text-xs ${passwordStrength.strength === "strong" ? "text-green-500" :
                                                    passwordStrength.strength === "medium" ? "text-yellow-500" : "text-red-500"
                                                    }`}>
                                                    {passwordStrength.strength.toUpperCase()}
                                                </span>
                                            </div>
                                            {passwordStrength.feedback.length > 0 && (
                                                <ul className="text-xs text-gray-400 space-y-1">
                                                    {passwordStrength.feedback.map((item, idx) => (
                                                        <li key={idx}>• {item}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none pr-10"
                                        />
                                        <button
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setShowPasswordModal(false)}
                                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleChangePassword}
                                        disabled={changingPassword}
                                        className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {changingPassword ? "Changing..." : "Change Password"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* KYC Upload Modal */}
            <AnimatePresence>
                {showKycModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowKycModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-6 max-w-md w-full border border-gray-700"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold text-white">Upload KYC Document</h3>
                                <button
                                    onClick={() => setShowKycModal(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Error message inside modal */}
                            {errorMessage && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mb-4 bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-500 flex items-center gap-2 text-sm"
                                >
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{errorMessage}</span>
                                </motion.div>
                            )}

                            {/* Success message inside modal */}
                            {successMessage && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mb-4 bg-green-500/20 border border-green-500 rounded-lg p-3 text-green-500 flex items-center gap-2 text-sm"
                                >
                                    <Check className="w-4 h-4 flex-shrink-0" />
                                    <span>{successMessage}</span>
                                </motion.div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Document Type</label>
                                    <select
                                        value={documentType}
                                        onChange={(e) => setDocumentType(e.target.value as any)}
                                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="NATIONAL_ID">National ID</option>
                                        <option value="PASSPORT">Passport</option>
                                        <option value="DRIVERS_LICENSE">Driver's License</option>
                                        <option value="UTILITY_BILL">Utility Bill</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Document Number (Optional)</label>
                                    <input
                                        type="text"
                                        value={documentNumber}
                                        onChange={(e) => setDocumentNumber(e.target.value)}
                                        placeholder="Enter document number"
                                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Select File</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            id="kyc-file-input"
                                        />
                                        <label
                                            htmlFor="kyc-file-input"
                                            className="flex items-center justify-center gap-2 w-full bg-gray-900/50 border-2 border-dashed border-gray-700 rounded-lg px-4 py-8 text-gray-400 hover:border-blue-500 hover:text-blue-500 cursor-pointer transition-colors"
                                        >
                                            <Upload className="w-5 h-5" />
                                            {selectedFile ? selectedFile.name : "Click to select file"}
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Max file size: 5MB. Supported formats: JPG, PNG, PDF
                                    </p>
                                </div>

                                {uploading && (
                                    <div>
                                        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                                            <span>Uploading...</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${uploadProgress}%` }}
                                                className="h-full bg-blue-500"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setShowKycModal(false)}
                                        disabled={uploading}
                                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUploadKyc}
                                        disabled={uploading || !selectedFile}
                                        className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {uploading ? "Uploading..." : "Upload"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}