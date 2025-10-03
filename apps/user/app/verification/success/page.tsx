'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';
import AuthLayout from '@/app/components/AuthLayout';

const VerificationSuccess = () => {
    const router = useRouter();

    useEffect(() => {
        // Auto redirect to login after 5 seconds
        const timer = setTimeout(() => {
            router.push('/login');
        }, 5000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <AuthLayout
            overlayTitle="Email Verified Successfully!"
            overlayDescription="Your account has been activated. Welcome to the NexGen community! Start your journey to financial freedom."
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

                {/* Success Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
                    className="text-center mb-8"
                >
                    <div className="relative inline-block">
                        <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
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
                        Welcome to NexGen!
                    </h1>
                    <p className="text-gray-200">
                        Your email has been successfully verified
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
                            Account Activated
                        </h3>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                        Congratulations! Your account is now fully activated. You can now sign in to your dashboard and start your mining journey with NexGen.
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
                        href="/login"
                        className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold rounded-lg transition-all duration-200"
                    >
                        Sign In Now
                        <ArrowRight className="ml-2 w-5 h-5" />
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
                    className="space-y-6"
                >
                    <div className="text-center">
                        <p className="text-gray-400 text-sm">
                            You will be automatically redirected to the login page in 5 seconds...
                        </p>
                        <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
                            <motion.div
                                initial={{ width: "100%" }}
                                animate={{ width: "0%" }}
                                transition={{ duration: 5, ease: "linear" }}
                                className="bg-gold-500 h-1 rounded-full"
                            />
                        </div>
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

export default VerificationSuccess;