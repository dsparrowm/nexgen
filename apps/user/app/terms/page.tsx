'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, FileText, Shield, AlertCircle, Users, Wallet, Ban } from 'lucide-react';

const TermsAndConditions = () => {
    const sections = [
        {
            icon: FileText,
            title: "1. Acceptance of Terms",
            content: `By accessing and using NexGen's cloud mining platform, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our services.`
        },
        {
            icon: Users,
            title: "2. User Accounts",
            content: `You must be at least 18 years old to use our services. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.`
        },
        {
            icon: Wallet,
            title: "3. Mining Services",
            content: `NexGen provides cloud mining services for cryptocurrency. Mining returns are not guaranteed and may vary based on network difficulty, cryptocurrency prices, and other factors. We reserve the right to modify mining plans, fees, and services at any time with reasonable notice.`
        },
        {
            icon: Shield,
            title: "4. Payment and Fees",
            content: `All investments and payments are final and non-refundable unless otherwise stated. You agree to pay all applicable fees associated with your chosen mining plan. Withdrawal fees may apply when transferring funds from your account.`
        },
        {
            icon: AlertCircle,
            title: "5. Risks and Disclaimers",
            content: `Cryptocurrency mining involves financial risk. The value of cryptocurrencies can be volatile. NexGen is not responsible for any losses incurred due to market fluctuations, network issues, or other factors beyond our control. You should only invest what you can afford to lose.`
        },
        {
            icon: Ban,
            title: "6. Prohibited Activities",
            content: `You may not use our services for any illegal activities, fraud, money laundering, or any purpose that violates applicable laws. We reserve the right to suspend or terminate accounts engaged in prohibited activities without notice or refund.`
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 bg-gold-500/10 rounded-full blur-3xl top-20 -left-20"></div>
                <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl bottom-20 -right-20"></div>
            </div>

            <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="mb-8"
                >
                    <Link
                        href="/"
                        className="inline-flex items-center text-gray-300 hover:text-gold-500 transition-colors duration-200 group"
                    >
                        <ArrowRight className="w-5 h-5 mr-2 rotate-180 group-hover:-translate-x-1 transition-transform duration-200" />
                        <span className="text-sm font-medium">Back to Home</span>
                    </Link>
                </motion.div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-5xl font-bold text-white mb-4">
                        Terms and Conditions
                    </h1>
                    <p className="text-gray-300 text-lg">
                        Please read these terms carefully before using{' '}
                        <span className="text-gold-500 font-semibold">NexGen</span>
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                        Last Updated: October 3, 2025
                    </p>
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="bg-white/5 backdrop-blur-lg rounded-2xl border border-gray-300/20 p-8 md:p-12 space-y-8"
                >
                    {sections.map((section, index) => {
                        const Icon = section.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                                className="space-y-3"
                            >
                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-gold-500/20 rounded-lg">
                                        <Icon className="w-6 h-6 text-gold-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-white mb-3">
                                            {section.title}
                                        </h2>
                                        <p className="text-gray-300 leading-relaxed">
                                            {section.content}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* Additional Terms */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.1, duration: 0.5 }}
                        className="pt-8 border-t border-gray-300/20 space-y-6"
                    >
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-3">
                                7. Intellectual Property
                            </h2>
                            <p className="text-gray-300 leading-relaxed">
                                All content, trademarks, and intellectual property on the NexGen platform are owned by NexGen or its licensors. You may not reproduce, distribute, or create derivative works without our express written permission.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-white mb-3">
                                8. Limitation of Liability
                            </h2>
                            <p className="text-gray-300 leading-relaxed">
                                NexGen shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use our services. Our total liability shall not exceed the amount paid by you in the past 12 months.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-white mb-3">
                                9. Termination
                            </h2>
                            <p className="text-gray-300 leading-relaxed">
                                We reserve the right to suspend or terminate your account at any time for violations of these terms or for any other reason we deem necessary. Upon termination, you will forfeit any outstanding balances or pending withdrawals.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-white mb-3">
                                10. Changes to Terms
                            </h2>
                            <p className="text-gray-300 leading-relaxed">
                                We may modify these terms at any time. We will notify users of any material changes via email or platform notification. Your continued use of our services after such modifications constitutes acceptance of the updated terms.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-white mb-3">
                                11. Governing Law
                            </h2>
                            <p className="text-gray-300 leading-relaxed">
                                These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which NexGen operates, without regard to its conflict of law provisions.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-white mb-3">
                                12. Contact Information
                            </h2>
                            <p className="text-gray-300 leading-relaxed">
                                If you have any questions about these Terms and Conditions, please contact us at:
                            </p>
                            <div className="mt-3 space-y-1">
                                <p className="text-gold-400">Email: legal@nexgen.com</p>
                                <p className="text-gold-400">Support: support@nexgen.com</p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Footer CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="mt-8 text-center"
                >
                    <p className="text-gray-300 mb-4">
                        By using NexGen, you acknowledge that you have read and agree to these terms.
                    </p>
                    <Link
                        href="/signup"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold rounded-lg transition-all duration-200"
                    >
                        Get Started
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default TermsAndConditions;
