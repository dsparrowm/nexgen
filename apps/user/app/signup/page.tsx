'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { ArrowRight, Mail, AlertCircle, User, Gift, Globe } from 'lucide-react';
import Select from 'react-select';
import countries from 'world-countries';
import axiosInstance from '@/lib/axiosInstance';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

interface SignupFormData {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    country: string;
    referralCode?: string;
    acceptTerms: boolean;
}

interface CountryOption {
    value: string;
    label: string;
    flag: string;
}

const Signup = () => {
    const router = useRouter();

    // Prepare country options from world-countries data
    const countryOptions = useMemo(() => {
        return countries
            .map(country => ({
                value: country.name.common,
                label: country.name.common,
                flag: country.flag,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, []);

    const [formData, setFormData] = useState<SignupFormData>({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        country: '',
        referralCode: '',
        acceptTerms: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
        setError('');
    };

    const validateForm = () => {
        if (formData.username.length < 3) {
            setError('Username must be at least 3 characters long');
            return false;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            setError('Username can only contain letters, numbers, and underscores');
            return false;
        }
        if (!formData.country) {
            setError('Please select your country');
            return false;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }
        // Check password complexity
        const hasUpperCase = /[A-Z]/.test(formData.password);
        const hasLowerCase = /[a-z]/.test(formData.password);
        const hasNumber = /[0-9]/.test(formData.password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);

        if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
            setError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        if (!formData.acceptTerms) {
            setError('Please accept the terms and conditions');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setError('');

        try {
            const signupData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                username: formData.username,
                email: formData.email,
                password: formData.password,
                country: formData.country,
                referralCode: formData.referralCode || undefined,
            };

            const response = await axiosInstance.post('/api/auth/user/register', signupData);

            if (response.data && response.data.success) {
                toast.success('Account created successfully! Please check your email for verification code.');
                // Redirect to verification page with email
                router.push(`/verification?email=${encodeURIComponent(formData.email)}`);
            }
        } catch (err) {
            const axiosError = err as AxiosError;
            let errorMessage = 'Signup failed. Please try again.';

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
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="text-3xl font-bold mb-4"
                        >
                            Join Thousands of Successful Investors
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="text-lg opacity-90"
                        >
                            Start your journey to financial freedom with our proven mining technology.
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
                        <h1 className="text-4xl font-bold text-white mb-2">
                            Create Account
                        </h1>
                        <p className="text-gray-200">
                            Join <span className="text-gold-500">NexGen</span> and start mining today
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
                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* First Name */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-300" />
                                </div>
                                <input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300/30 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all duration-200"
                                    placeholder="First Name"
                                    required
                                />
                            </div>

                            {/* Last Name */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-300" />
                                </div>
                                <input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300/30 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Last Name"
                                    required
                                />
                            </div>
                        </div>

                        {/* Username & Email Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Username Field */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-300" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300/30 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Username"
                                    required
                                />
                            </div>

                            {/* Email Field */}
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
                                    placeholder="Email Address"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Password Field */}
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
                                    placeholder="Password (8+ chars, A-z, 0-9, !@#$%)"
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

                            {/* Confirm Password Field */}
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
                                    placeholder="Confirm password"
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

                        {/* Country Field */}
                        <div className="relative">
                            <Select
                                id="country"
                                instanceId="country-select"
                                options={countryOptions}
                                value={countryOptions.find(option => option.value === formData.country)}
                                onChange={(option: CountryOption | null) => {
                                    setFormData({ ...formData, country: option?.value || '' });
                                    setError('');
                                }}
                                placeholder="Select your country..."
                                className="country-select"
                                classNamePrefix="select"
                                isSearchable
                                styles={{
                                    control: (base, state) => ({
                                        ...base,
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderColor: state.isFocused ? '#D4AF37' : 'rgba(209, 213, 219, 0.3)',
                                        borderRadius: '0.5rem',
                                        padding: '0.375rem',
                                        boxShadow: state.isFocused ? '0 0 0 2px #D4AF37' : 'none',
                                        '&:hover': {
                                            borderColor: '#D4AF37',
                                        },
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        backgroundColor: '#1e293b',
                                        borderRadius: '0.5rem',
                                        marginTop: '0.25rem',
                                    }),
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isFocused ? '#334155' : 'transparent',
                                        color: state.isSelected ? '#D4AF37' : '#e5e7eb',
                                        cursor: 'pointer',
                                        '&:active': {
                                            backgroundColor: '#475569',
                                        },
                                    }),
                                    singleValue: (base) => ({
                                        ...base,
                                        color: '#ffffff',
                                    }),
                                    placeholder: (base) => ({
                                        ...base,
                                        color: '#9ca3af',
                                    }),
                                    input: (base) => ({
                                        ...base,
                                        color: '#ffffff',
                                    }),
                                }}
                            />
                        </div>

                        {/* Referral Code Field (Optional) */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Gift className="h-5 w-5 text-gray-300" />
                            </div>
                            <input
                                id="referralCode"
                                name="referralCode"
                                type="text"
                                value={formData.referralCode}
                                onChange={handleChange}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300/30 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all duration-200"
                                placeholder="Referral Code (Optional - Get bonus rewards!)"
                            />
                        </div>

                        {/* Terms and Conditions */}
                        <div className="flex items-start space-x-3">
                            <input
                                id="acceptTerms"
                                name="acceptTerms"
                                type="checkbox"
                                checked={formData.acceptTerms}
                                onChange={handleChange}
                                className="mt-1 h-4 w-4 text-gold-500 bg-white/10 border-gray-300/30 rounded focus:ring-gold-500 focus:ring-2"
                                required
                            />
                            <label htmlFor="acceptTerms" className="text-sm text-gray-200">
                                I agree to the{' '}
                                <Link href="/terms" className="text-gold-400 hover:text-gold-300 underline">
                                    Terms and Conditions
                                </Link>{' '}
                                and{' '}
                                <Link href="/privacy" className="text-gold-400 hover:text-gold-300 underline">
                                    Privacy Policy
                                </Link>
                            </label>
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
                                    Create Account
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
                            <span>Already have an account? </span>
                            <Link
                                href="/login"
                                className="text-gold-400 hover:text-gold-300 font-semibold transition-colors duration-200"
                            >
                                Sign in here
                            </Link>
                        </div>

                        <div>
                            <Link
                                href="/forgot-password"
                                className="text-gray-300 hover:text-gray-200 text-sm transition-colors duration-200"
                            >
                                Forgot your password?
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;