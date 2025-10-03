'use client';

import React, { useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight, Home, Mail, Lock, User } from 'lucide-react';

const Success = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const type = searchParams.get('type') || 'general';
    const email = searchParams.get('email') || '';

    // Auto redirect based on type
    useEffect(() => {
        let redirectPath = '/login';
        let delay = 5000;

        switch (type) {
            case 'password-reset':
                redirectPath = '/login';
                break;
            case 'account-created':
                redirectPath = '/verification';
                break;
            case 'email-updated':
                redirectPath = '/dashboard/settings';
                delay = 3000;
                break;
            default:
                redirectPath = '/login';
        }

        const timer = setTimeout(() => {
            if (type === 'account-created' && email) {
                router.push(`${redirectPath}?email=${encodeURIComponent(email)}`);
            } else {
                router.push(redirectPath);
            }
        }, delay);

        return () => clearTimeout(timer);
    }, [router, type, email]);

    const getSuccessConfig = () => {
        switch (type) {
            case 'password-reset':
                return {
                    icon: <Lock className="w-20 h-20 text-green-500 mx-auto" />,
                    title: 'Password Reset Successful!',
                    subtitle: 'Your password has been updated',
                    message: 'You can now sign in with your new password. Make sure to keep it secure!',
                    primaryButton: {
                        text: 'Sign In Now',
                        href: '/login',
                        icon: <ArrowRight className="ml-2 w-5 h-5" />
                    },
                    autoRedirectText: 'You will be redirected to the login page in 5 seconds...'
                };
            case 'account-created':
                return {
                    icon: <User className="w-20 h-20 text-green-500 mx-auto" />,
                    title: 'Account Created Successfully!',
                    subtitle: 'Welcome to NexGen Mining',
                    message: 'Your account has been created successfully. Please check your email for a verification code to activate your account.',
                    primaryButton: {
                        text: 'Verify Email',
                        href: `/verification${email ? `?email=${encodeURIComponent(email)}` : ''}`,
                        icon: <Mail className="ml-2 w-5 h-5" />
                    },
                    autoRedirectText: 'You will be redirected to email verification in 5 seconds...'
                };
            case 'email-updated':
                return {
                    icon: <Mail className="w-20 h-20 text-green-500 mx-auto" />,
                    title: 'Email Updated Successfully!',
                    subtitle: 'Your account email has been changed',
                    message: 'Please check your new email address for confirmation. Your account settings have been updated.',
                    primaryButton: {
                        text: 'Back to Settings',
                        href: '/dashboard/settings',
                        icon: <ArrowRight className="ml-2 w-5 h-5" />
                    },
                    autoRedirectText: 'You will be redirected to settings in 3 seconds...'
                };
            default:
                return {
                    icon: <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />,
                    title: 'Success!',
                    subtitle: 'Operation completed successfully',
                    message: 'Your request has been processed successfully.',
                    primaryButton: {
                        text: 'Continue',
                        href: '/dashboard',
                        icon: <ArrowRight className="ml-2 w-5 h-5" />
                    },
                    autoRedirectText: 'You will be redirected in 5 seconds...'
                };
        }
    };

    const config = getSuccessConfig();

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
                    alt="Happy Client - Success Story"
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
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
                            className="mb-6"
                        >
                            {config.icon}
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="text-3xl font-bold mb-4"
                        >
                            {config.title}
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7, duration: 0.8 }}
                            className="text-lg opacity-90"
                        >
                            {config.message}
                        </motion.p>
                    </motion.div>
                </div>
            </motion.div>

            {/* Right Side - Success Message */}
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full lg:w-1/2 flex items-center justify-center p-8"
            >
                <div className="w-full max-w-md">
                    {/* Success Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
                        className="text-center mb-8"
                    >
                        <div className="relative inline-block">
                            {config.icon}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5, duration: 0.4 }}
                                className="absolute inset-0 border-4 border-green-500 rounded-full animate-ping opacity-20"
                            />
                        </div>
                    </motion.div>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="text-center mb-8"
                    >
                        <h1 className="text-4xl font-bold text-white mb-2">
                            {config.title}
                        </h1>
                        <p className="text-gray-200">
                            {config.subtitle}
                        </p>
                    </motion.div>

                    {/* Success Message */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="bg-green-900/20 border border-green-800/50 rounded-lg p-6 mb-8"
                    >
                        <div className="flex items-center space-x-3 mb-4">
                            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                            <h3 className="text-lg font-semibold text-green-400">
                                Success!
                            </h3>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            {config.message}
                        </p>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className="space-y-4"
                    >
                        <Link
                            href={config.primaryButton.href}
                            className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold rounded-lg transition-all duration-200"
                        >
                            {config.primaryButton.text}
                            {config.primaryButton.icon}
                        </Link>

                        <Link
                            href="/"
                            className="w-full flex items-center justify-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all duration-200 border border-gray-300/30"
                        >
                            <Home className="mr-2 w-5 h-5" />
                            Back to Homepage
                        </Link>
                    </motion.div>

                    {/* Auto Redirect Notice */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.0, duration: 0.8 }}
                        className="mt-8 text-center"
                    >
                        <p className="text-gray-400 text-sm">
                            {config.autoRedirectText}
                        </p>
                        <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
                            <motion.div
                                initial={{ width: "100%" }}
                                animate={{ width: "0%" }}
                                transition={{ duration: type === 'email-updated' ? 3 : 5, ease: "linear" }}
                                className="bg-gold-500 h-1 rounded-full"
                            />
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-navy-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        }>
            <Success />
        </Suspense>
    );
}
