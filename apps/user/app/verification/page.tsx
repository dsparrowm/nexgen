'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, AlertCircle, CheckCircle, ArrowRight, Clock, RefreshCw } from 'lucide-react';
import axiosInstance from '@/lib/axiosInstance';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import AuthLayout from '@/app/components/AuthLayout';


function VerificationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const email = searchParams.get('email') || '';

    useEffect(() => {
        if (!email) {
            router.push('/signup');
        }
    }, [email, router]);

    // Countdown timer for resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    // Auto-focus first input on mount
    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // Only allow digits

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all fields are filled
        if (newCode.every(digit => digit !== '') && index === 5) {
            handleSubmit(newCode.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newCode = [...code];
        pastedData.split('').forEach((char, index) => {
            if (index < 6) newCode[index] = char;
        });
        setCode(newCode);

        // Focus last filled input or first empty
        const lastFilledIndex = pastedData.length - 1;
        if (lastFilledIndex < 5) {
            inputRefs.current[lastFilledIndex + 1]?.focus();
        }

        // Auto-submit if complete
        if (pastedData.length === 6) {
            handleSubmit(pastedData);
        }
    };

    const handleSubmit = async (verificationCode?: string) => {
        const codeToSubmit = verificationCode || code.join('');

        if (codeToSubmit.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axiosInstance.post('/api/auth/verify-email', {
                email,
                code: codeToSubmit,
            });

            if (response.data.success || response.data.isSuccess) {
                toast.success('Email verified successfully!');
                router.push('/verification/success');
            }
        } catch (err) {
            const axiosError = err as AxiosError;
            let errorMessage = 'Verification failed. Please try again.';

            const responseData = axiosError.response?.data as any;
            if (responseData?.error?.message) {
                errorMessage = responseData.error.message;
            } else if (responseData?.message) {
                errorMessage = responseData.message;
            }

            setError(errorMessage);
            toast.error(errorMessage);
            // Clear code on error
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!canResend) return;

        setResendLoading(true);
        setError('');

        try {
            const response = await axiosInstance.post('/api/auth/resend-verification', {
                email,
            });

            if (response.data.success || response.data.isSuccess) {
                toast.success('Verification code sent to your email');
                setCountdown(60);
                setCanResend(false);
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (err) {
            const axiosError = err as AxiosError;
            const errorMessage = (axiosError.response?.data as any)?.message || 'Failed to resend code.';
            toast.error(errorMessage);
        } finally {
            setResendLoading(false);
        }
    };

    if (!email) {
        return null;
    }

    return (
        <AuthLayout
            overlayTitle="Verify Your Email"
            overlayDescription="We've sent a 6-digit verification code to your email address. Enter it below to activate your account."
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
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-gold-500/20 rounded-full">
                            <Mail className="w-8 h-8 text-gold-500" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Check Your Email
                    </h1>
                    <p className="text-gray-200">
                        We've sent a verification code to{' '}
                        <span className="text-gold-500 font-semibold break-all">{email}</span>
                    </p>
                </motion.div>

                {/* Code Input Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="space-y-6"
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-4 text-center">
                            Enter Verification Code
                        </label>
                        <div className="flex justify-center gap-3">
                            {code.map((digit, index) => (
                                <motion.input
                                    key={index}
                                    ref={el => { inputRefs.current[index] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={index === 0 ? handlePaste : undefined}
                                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border-2 border-gray-300/30 rounded-xl bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all duration-200"
                                    disabled={loading}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.5 + index * 0.05 }}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-3 text-center">
                            Paste or type the 6-digit code sent to your email
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-center space-x-2 text-red-400 bg-red-900/30 border border-red-800/50 rounded-lg p-3"
                        >
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </motion.div>
                    )}

                    {/* Verify Button */}
                    <motion.button
                        type="button"
                        onClick={() => handleSubmit()}
                        disabled={loading || code.some(d => !d)}
                        whileHover={{ scale: code.some(d => !d) ? 1 : 1.02 }}
                        whileTap={{ scale: code.some(d => !d) ? 1 : 0.98 }}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 font-semibold rounded-lg hover:from-gold-600 hover:to-gold-700 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-navy-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                <span>Verifying...</span>
                            </>
                        ) : (
                            <>
                                <span>Verify Email</span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </motion.button>

                    {/* Resend Code Section */}
                    <div className="text-center space-y-3">
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span>
                                {canResend ? (
                                    "Didn't receive the code?"
                                ) : (
                                    `Resend code in ${countdown}s`
                                )}
                            </span>
                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={!canResend || resendLoading}
                                className="text-gold-400 hover:text-gold-300 font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {resendLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </span>
                                ) : (
                                    'Resend'
                                )}
                            </button>
                        </div>

                    </div>
                </motion.div>

                {/* Footer Links */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="mt-8 space-y-4"
                >
                    <div className="text-gray-300 text-sm text-center">
                        <span>Wrong email? </span>
                        <Link
                            href="/signup"
                            className="text-gold-400 hover:text-gold-300 font-semibold transition-colors duration-200"
                        >
                            Sign up again
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
}

export default function Verification() {
    return (
        <Suspense>
            <VerificationContent />
        </Suspense>
    );
}