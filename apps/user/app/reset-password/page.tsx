'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { AlertCircle, ArrowRight, CheckCircle, ArrowLeft } from 'lucide-react';
import axiosInstance from '@/lib/axiosInstance';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

interface ResetPasswordFormData {
    password: string;
    confirmPassword: string;
}

const ResetPassword = () => {
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

            if (response.data.isSuccess) {
                setResetSuccess(true);
                toast.success('Password reset successfully!');
                setTimeout(() => {
                    router.push('/success?type=password-reset');
                }, 3000);
            }
        } catch (err) {
            const axiosError = err as AxiosError;
            const errorMessage = (axiosError.response?.data as any)?.message || 'Failed to reset password. Please try again.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (tokenValid === false) {
        return (
            <div className="min-h-screen bg-navy-900 flex">
                <div className="m-auto text-center p-8">
                    <div className="bg-red-900/30 border border-red-800/50 rounded-lg p-6 max-w-md">
                        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-white mb-2">Invalid Reset Link</h1>
                        <p className="text-gray-300 mb-6">
                            This password reset link is invalid or has expired. Please request a new one.
                        </p>
                        <Link
                            href="/forgot-password"
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold rounded-lg transition-all duration-200"
                        >
                            Request New Reset Link
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-navy-900 flex">
            {/* Left Side - Image */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-black/40 z-10"></div>
                <img
                    src="/images/happyclient.png"
                    alt="Password Reset"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-navy-900/40 to-transparent z-20"></div>

                {/* Overlay Content */}
                <div className="absolute inset-0 flex items-center justify-center text-white z-30 p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-center max-w-md"
                    >
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="text-3xl font-bold mb-4"
                        >
                            Secure Your Account
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="text-lg opacity-90"
                        >
                            Create a strong password to protect your mining investments.
                        </motion.p>
                    </motion.div>
                </div>
            </motion.div>

            {/* Right Side - Form */}
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full lg:w-1/2 flex items-center justify-center p-8"
            >
                <div className="w-full max-w-md">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="text-center mb-8"
                    >
                        <div className="flex justify-center mb-4">
                            {resetSuccess ? (
                                <CheckCircle className="h-16 w-16 text-green-500" />
                            ) : (
                                <FaLock className="h-16 w-16 text-gold-500" />
                            )}
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-2">
                            {resetSuccess ? 'Password Reset!' : 'Reset Password'}
                        </h1>
                        <p className="text-gray-200">
                            {resetSuccess
                                ? 'Your password has been updated'
                                : 'Enter your new password below'
                            }
                        </p>
                    </motion.div>

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                    >
                        {!resetSuccess ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Password Field */}
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
                                </div>

                                {/* Confirm Password Field */}
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200 mb-2">
                                        Confirm New Password
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

                                {/* Password Requirements */}
                                <div className="text-sm text-gray-400">
                                    <p className="mb-2">Password must contain:</p>
                                    <ul className="space-y-1 ml-4">
                                        <li>• At least 8 characters</li>
                                        <li>• Both passwords must match</li>
                                    </ul>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center space-x-2 text-red-400 bg-red-900/30 border border-red-800/50 rounded-lg p-3"
                                    >
                                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                        <span className="text-sm">{error}</span>
                                    </motion.div>
                                )}

                                {/* Submit Button */}
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
                            </form>
                        ) : (
                            <div className="text-center space-y-6">
                                <div className="bg-green-900/30 border border-green-800/50 rounded-lg p-6">
                                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-white mb-2">Password Updated!</h3>
                                    <p className="text-gray-300 text-sm mb-4">
                                        Your password has been successfully reset. You will be redirected to the login page shortly.
                                    </p>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <motion.div
                                            className="bg-green-500 h-2 rounded-full"
                                            initial={{ width: '100%' }}
                                            animate={{ width: '0%' }}
                                            transition={{ duration: 3, ease: 'linear' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Footer Links */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="mt-8 text-center space-y-4"
                    >
                        <div>
                            <Link
                                href="/"
                                className="text-gray-300 hover:text-gray-200 text-sm transition-colors duration-200"
                            >
                                ← Back to Homepage
                            </Link>
                        </div>

                        <div className="text-gray-300">
                            <span>Remember your password? </span>
                            <Link
                                href="/login"
                                className="text-gold-400 hover:text-gold-300 font-semibold transition-colors duration-200"
                            >
                                Sign in here
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-navy-900 flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-500"></div></div>}>
            <ResetPassword />
        </Suspense>
    );
}