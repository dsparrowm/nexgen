'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Shield, Eye, Database, Lock, Share2, Cookie } from 'lucide-react';

const PrivacyPolicy = () => {
    const sections = [
        {
            icon: Database,
            title: "1. Information We Collect",
            content: `We collect information you provide directly to us, including your name, email address, username, country of residence, and payment information. We also automatically collect certain information about your device and how you interact with our platform, including IP address, browser type, and usage patterns.`
        },
        {
            icon: Eye,
            title: "2. How We Use Your Information",
            content: `We use the information we collect to provide, maintain, and improve our services; process your transactions; send you technical notices and support messages; respond to your inquiries; monitor and analyze trends and usage; detect and prevent fraud; and comply with legal obligations.`
        },
        {
            icon: Share2,
            title: "3. Information Sharing",
            content: `We do not sell your personal information. We may share your information with service providers who perform services on our behalf, with law enforcement when required by law, or with other parties with your consent. All third parties are bound by confidentiality obligations.`
        },
        {
            icon: Lock,
            title: "4. Data Security",
            content: `We implement industry-standard security measures to protect your personal information, including encryption, secure servers, and regular security audits. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.`
        },
        {
            icon: Cookie,
            title: "5. Cookies and Tracking",
            content: `We use cookies and similar tracking technologies to collect information about your browsing activities. You can control cookies through your browser settings, but disabling cookies may limit your ability to use certain features of our platform.`
        },
        {
            icon: Shield,
            title: "6. Your Privacy Rights",
            content: `You have the right to access, correct, or delete your personal information. You may also object to or restrict certain processing of your data. To exercise these rights, please contact our privacy team at privacy@nexgen.com.`
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl top-20 -left-20"></div>
                <div className="absolute w-96 h-96 bg-gold-500/10 rounded-full blur-3xl bottom-20 -right-20"></div>
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
                        Privacy Policy
                    </h1>
                    <p className="text-gray-300 text-lg">
                        Your privacy is important to us at{' '}
                        <span className="text-gold-500 font-semibold">NexGen</span>
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                        Last Updated: October 3, 2025
                    </p>
                </motion.div>

                {/* Introduction */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="bg-white/5 backdrop-blur-lg rounded-2xl border border-gray-300/20 p-8 mb-8"
                >
                    <p className="text-gray-300 leading-relaxed">
                        At NexGen, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our cloud mining platform. Please read this policy carefully.
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
                                    <div className="p-2 bg-purple-500/20 rounded-lg">
                                        <Icon className="w-6 h-6 text-purple-400" />
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

                    {/* Additional Sections */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.1, duration: 0.5 }}
                        className="pt-8 border-t border-gray-300/20 space-y-6"
                    >
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-3">
                                7. Data Retention
                            </h2>
                            <p className="text-gray-300 leading-relaxed">
                                We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. When we no longer need your information, we will securely delete or anonymize it.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-white mb-3">
                                8. International Data Transfers
                            </h2>
                            <p className="text-gray-300 leading-relaxed">
                                Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-white mb-3">
                                9. Children's Privacy
                            </h2>
                            <p className="text-gray-300 leading-relaxed">
                                Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will take steps to delete such information promptly.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-white mb-3">
                                10. Changes to This Policy
                            </h2>
                            <p className="text-gray-300 leading-relaxed">
                                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. We encourage you to review this policy periodically.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-white mb-3">
                                11. Contact Us
                            </h2>
                            <p className="text-gray-300 leading-relaxed">
                                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                            </p>
                            <div className="mt-3 space-y-1">
                                <p className="text-purple-400">Email: privacy@nexgen.com</p>
                                <p className="text-purple-400">Data Protection Officer: dpo@nexgen.com</p>
                                <p className="text-purple-400">Support: support@nexgen.com</p>
                            </div>
                        </div>

                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6 mt-8">
                            <h3 className="text-xl font-bold text-white mb-2">
                                Your Consent
                            </h3>
                            <p className="text-gray-300">
                                By using NexGen, you consent to our Privacy Policy and agree to its terms. If you do not agree with this policy, please do not use our services.
                            </p>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Footer CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="mt-8 text-center space-y-4"
                >
                    <p className="text-gray-300">
                        We value your trust and are committed to protecting your privacy.
                    </p>
                    <Link
                        href="/signup"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200"
                    >
                        Get Started Securely
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
