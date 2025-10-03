'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { AlertCircle, ArrowRight, CheckCircle, Home } from 'lucide-react';
import axiosInstance from '@/lib/axiosInstance';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import AuthLayout from '../components/AuthLayout';

interface ResetPasswordFormData {
    password: string;
    confirmPassword: string;
}

const ResetPasswordContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState<ResetPasswordFormData>({
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);
    const [resetSuccess, setResetSuccess] = useState(false);

    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setError('Reset token is missing or invalid');
            setTokenValid(false);
        } else {
            setTokenValid(true);
        }
    }, [token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const validateForm = () => {
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }

        const hasUpperCase = /[A-Z]/.test(formData.password);
        const hasLowerCase = /[a-z]/.test(formData.password);
        const hasNumber = /[0-9]/.test(formData.password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);

        if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
            setError('Password must contain uppercase, lowercase, number, and special character');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm() || !token) return;

        setLoading(true);
        setError('');

        try {
            const response = await axiosInstance.post('/api/auth/reset-password', {
                token,
                password: formData.password,
            });

            if (response.data.success) {
                setResetSuccess(true);
                toast.success('Password reset successfully!');

                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            }
        } catch (err) {
            const error = err as AxiosError<any>;
            let errorMessage = 'Failed to reset password. Please try again.';

            if (error.response?.data) {
                const errorData = error.response.data;
                if (errorData.error) {
                    if (errorData.error.details && Array.isArray(errorData.error.details)) {
                        errorMessage = errorData.error.details[0]?.msg || errorMessage;
                    } else if (errorData.error.message) {
                        errorMessage = errorData.error.message;
                    }
                }
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (tokenValid === false) {
        return (
            <AuthLayout
                overlayTitle="Invalid Reset Link"
                overlayDescription="This link has expired or is invalid"
            >
                <div className="w-full max-w-md">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="mb-6"
                    >
                        <Link
                            href="/"
                            className="inline-flex items-center text-gray-300 hover:text-gold-500 transition-colors duration-200 group"
                        >
                            <ArrowRight className="w-4 h-4 mr-2 rotate-180 group-hover:-translate-x-1 transition-transform duration-200" />
                            <span className="text-sm font-medium">Home</span>
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-center space-y-6"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 10 }}
                            className="flex justify-center"
                        >
                            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-12 h-12 text-red-500" />
                            </div>
                        </motion.div>

                        <div className="space-y-3">
                            <h2 className="text-3xl font-bold text-white">
                                Invalid Reset Link
                            </h2>
                            <p className="text-gray-300">
                                This password reset link is invalid or has expired.
                            </p>
                        </div>

                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                            <p className="text-gray-300 text-sm leading-relaxed">
                                Reset links expire after <span className="text-gold-400 font-semibold">1 hour</span> for security reasons.
                                Please request a new password reset link.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Link
                                href="/forgot-password"
                                className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold rounded-lg transition-all duration-200"
                            >
                                Request New Reset Link
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>

                            <Link
                                href="/login"
                                className="w-full flex items-center justify-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all duration-200 border border-gray-300/30"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="mt-8 text-center space-y-4"
                    >
                        <div className="flex items-center justify-center space-x-4 text-sm">
                            <Link
                                href="/terms"
                                className="text-gray-400 hover:text-gold-400 transition-colors duration-200"
                            >
                                Terms
                            </Link>
                            <span className="text-gray-600">•</span>
                            <Link
                                href="/privacy"
                                className="text-gray-400 hover:text-gold-400 transition-colors duration-200"
                            >
                                Privacy
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            overlayTitle="Create New Password"
            overlayDescription="Enter a strong password to secure your account"
        >
            <div className="w-full max-w-md">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="mb-6"
                >
                    <Link
                        href="/login"
                        className="inline-flex items-center text-gray-300 hover:text-gold-500 transition-colors duration-200 group"
                    >
                        <ArrowRight className="w-4 h-4 mr-2 rotate-180 group-hover:-translate-x-1 transition-transform duration-200" />
                        <span className="text-sm font-medium">Back to Login</span>
                    </Link>
                </motion.div>

                {!resetSuccess ? (
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="text-center mb-8"
                        >
                            <h1 className="text-4xl font-bold text-white mb-2">
                                Reset Password
                            </h1>
                            <p className="text-gray-200">
                                Enter your new password below
                            </p>
                        </motion.div>

                        <motion.form
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            onSubmit={handleSubmit}
                            className="space-y-6"
                        >
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaLock className="h-5 w-5 text-gray-300" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-12 py-3 border border-gray-300/30 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all duration-200"
                                        placeholder="Enter new password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showPassword ? (
                                            <FaEyeSlash className="h-5 w-5 text-gray-300 hover:text-gray-200" />
                                        ) : (
                                            <FaEye className="h-5 w-5 text-gray-300 hover:text-gray-200" />
                                        )}
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-gray-400">
                                    Must be at least 8 characters with uppercase, lowercase, number, and special character
                                </p>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaLock className="h-5 w-5 text-gray-300" />
                                    </div>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-12 py-3 border border-gray-300/30 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all duration-200"
                                        placeholder="Confirm new password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showConfirmPassword ? (
                                            <FaEyeSlash className="h-5 w-5 text-gray-300 hover:text-gray-200" />
                                        ) : (
                                            <FaEye className="h-5 w-5 text-gray-300 hover:text-gray-200" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-start space-x-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                                >
                                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-300 text-sm">{error}</p>
                                </motion.div>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Reset Password
                                        <ArrowRight className="ml-2 w-5 h-5" />
                                    </>
                                )}
                            </motion.button>
                        </motion.form>
                    </>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-center space-y-6"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 10 }}
                            className="flex justify-center"
                        >
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-12 h-12 text-green-500" />
                            </div>
                        </motion.div>

                        <div className="space-y-3">
                            <h2 className="text-3xl font-bold text-white">
                                Password Reset Successfully!
                            </h2>
                            <p className="text-gray-300">
                                Your password has been updated successfully.
                            </p>
                        </div>

                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                            <p className="text-gray-300 text-sm leading-relaxed">
                                You can now sign in with your new password. Make sure to keep it secure!
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Link
                                href="/login"
                                className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold rounded-lg transition-all duration-200"
                            >
                                Sign In Now
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>

                            <Link
                                href="/"
                                className="w-full flex items-center justify-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all duration-200 border border-gray-300/30"
                            >
                                <Home className="mr-2 w-5 h-5" />
                                Back to Homepage
                            </Link>
                        </div>

                        <div className="text-gray-400 text-sm">
                            Redirecting to login in 3 seconds...
                        </div>
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="mt-8 space-y-4"
                >
                    <div className="text-gray-300 text-center">
                        <span>Remember your password? </span>
                        <Link
                            href="/login"
                            className="text-gold-400 hover:text-gold-300 font-semibold transition-colors duration-200"
                        >
                            Sign in
                        </Link>
                    </div>

                    <div className="flex items-center justify-center space-x-4 text-sm">
                        <Link
                            href="/terms"
                            className="text-gray-400 hover:text-gold-400 transition-colors duration-200"
                        >
                            Terms
                        </Link>
                        <span className="text-gray-600">•</span>
                        <Link
                            href="/privacy"
                            className="text-gray-400 hover:text-gold-400 transition-colors duration-200"
                        >
                            Privacy
                        </Link>
                    </div>
                </motion.div>
            </div>
        </AuthLayout>
    );
};

const ResetPassword = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-navy-900 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
};

export default ResetPassword;
