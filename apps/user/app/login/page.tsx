'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { ArrowRight, Mail, AlertCircle } from 'lucide-react';
import axiosInstance from '@/lib/axiosInstance';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import AuthLayout from '@/app/components/AuthLayout';
import { saveAuthData } from '@/utils/auth';

interface LoginFormData {
    email: string;
    password: string;
}

const Login = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Get redirect URL and expired status from query parameters
    const redirect = searchParams.get('redirect') || '/dashboard';
    const isExpired = searchParams.get('expired') === 'true';

    // Show session expired message on component mount if needed
    useEffect(() => {
        if (isExpired) {
            toast.error('Your session has expired. Please log in again.');
        }
    }, [isExpired]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axiosInstance.post('/api/auth/user/login', formData);

            if (response.data && response.data.success) {
                toast.success('Login successful! Welcome back!');

                // Store authentication data using the utility function
                if (response.data.data?.tokens && response.data.data?.user) {
                    saveAuthData(
                        response.data.data.tokens.accessToken,
                        response.data.data.tokens.refreshToken,
                        response.data.data.user
                    );
                }

                // Validate redirect URL is internal (prevent open redirect attacks)
                const redirectUrl = redirect.startsWith('/') ? redirect : '/dashboard';
                router.push(redirectUrl);
            }
        } catch (err) {
            const axiosError = err as AxiosError;
            let errorMessage = 'Login failed. Please try again.';

            // Check if there are validation errors from backend
            const responseData = axiosError.response?.data as any;
            if (responseData?.error?.details && Array.isArray(responseData.error.details)) {
                // Extract the first validation error message
                errorMessage = responseData.error.details[0]?.msg || responseData.error.message || errorMessage;
            } else if (responseData?.error?.message) {
                errorMessage = responseData.error.message;
            } else if (responseData?.message) {
                errorMessage = responseData.message;
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            overlayTitle="Welcome Back to NexGen"
            overlayDescription="Sign in to access your dashboard and continue your journey to financial freedom with our proven mining technology."
        >
            <div className="w-full max-w-md">
                {/* Back Button */}
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

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-gray-200">
                        Sign in to access your <span className="text-gold-500">NexGen</span> dashboard
                    </p>
                </motion.div>

                {/* Form */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >
                    {/* Email Field */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-300" />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300/30 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all duration-200"
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-200">
                                Password
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-sm text-gold-400 hover:text-gold-300 transition-colors duration-200"
                            >
                                Forgot password?
                            </Link>
                        </div>
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
                                placeholder="Enter your password"
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
                                Sign In
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </>
                        )}
                    </motion.button>
                </motion.form>

                {/* Footer Links */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="mt-8 space-y-6"
                >
                    <div className="text-gray-300 text-center">
                        <span>Don't have an account? </span>
                        <Link
                            href="/signup"
                            className="text-gold-400 hover:text-gold-300 font-semibold transition-colors duration-200"
                        >
                            Sign up here
                        </Link>
                    </div>

                    {/* Terms and Privacy */}
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

export default Login;