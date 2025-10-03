'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import axiosInstance from '@/lib/axiosInstance';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import AuthLayout from '../components/AuthLayout';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            const response = await axiosInstance.post('/api/auth/forgot-password', { email });

            if (response.data.success) {
                setSuccess(true);
                toast.success('Password reset email sent!');
            }
        } catch (err) {
            const error = err as AxiosError<any>;
            let errorMessage = 'Failed to send reset email. Please try again.';

            if (error.response?.data) {
                const errorData = error.response.data;
                if (errorData.error) {
                    // Check for validation errors array
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

    return (
        <AuthLayout
            overlayTitle="Reset Your Password"
            overlayDescription="Enter your email to receive reset instructions"
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
                        href="/login"
                        className="inline-flex items-center text-gray-300 hover:text-gold-500 transition-colors duration-200 group"
                    >
                        <ArrowRight className="w-4 h-4 mr-2 rotate-180 group-hover:-translate-x-1 transition-transform duration-200" />
                        <span className="text-sm font-medium">Back to Login</span>
                    </Link>
                </motion.div>

                {!success ? (
                    <>
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="text-center mb-8"
                        >
                            <h1 className="text-4xl font-bold text-white mb-2">
                                Forgot Password?
                            </h1>
                            <p className="text-gray-200">
                                No worries, we'll send you reset instructions
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
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setError('');
                                        }}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300/30 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all duration-200"
                                        placeholder="Enter your registered email"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Error Message */}
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
                                        Send Reset Link
                                        <ArrowRight className="ml-2 w-5 h-5" />
                                    </>
                                )}
                            </motion.button>
                        </motion.form>
                    </>
                ) : (
                    /* Success State */
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-center space-y-6"
                    >
                        {/* Success Icon */}
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

                        {/* Success Message */}
                        <div className="space-y-3">
                            <h2 className="text-3xl font-bold text-white">
                                Check Your Email
                            </h2>
                            <p className="text-gray-300">
                                We've sent password reset instructions to:
                            </p>
                            <p className="text-gold-400 font-semibold text-lg">
                                {email}
                            </p>
                        </div>

                        {/* Instructions */}
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                            <p className="text-gray-300 text-sm leading-relaxed">
                                Click the link in the email to reset your password.
                                The link will expire in <span className="text-gold-400 font-semibold">1 hour</span>.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <Link
                                href="/login"
                                className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold rounded-lg transition-all duration-200"
                            >
                                Back to Login
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>

                            <button
                                onClick={() => {
                                    setSuccess(false);
                                    setEmail('');
                                }}
                                className="w-full px-6 py-3 text-gray-300 hover:text-white transition-colors duration-200 text-sm"
                            >
                                Didn't receive the email? Try again
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Footer Links */}
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

export default ForgotPassword;