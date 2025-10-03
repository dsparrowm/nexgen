"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Twitter, Linkedin, Facebook, Instagram } from 'lucide-react'
import NexgenLogo from '../utils/NexgenLogo'

const Footer = () => {
    const footerLinks = {
        company: [
            { name: 'About Us', href: '#about' },
            { name: 'Our Team', href: '#team' },
            { name: 'Careers', href: '#careers' },
            { name: 'Press', href: '#press' },
        ],
        services: [
            { name: 'Mining Services', href: '#services' },
            { name: 'Gold Investments', href: '#gold' },
            { name: 'Dividend Plans', href: '#dividends' },
            { name: 'Portfolio Management', href: '#portfolio' },
        ],
        support: [
            { name: 'Help Center', href: '#help' },
            { name: 'Contact Us', href: '#contact' },
            { name: 'API Documentation', href: '#api' },
            { name: 'System Status', href: '#status' },
        ],
        legal: [
            { name: 'Privacy Policy', href: '#privacy' },
            { name: 'Terms of Service', href: '#terms' },
            { name: 'Risk Disclosure', href: '#risk' },
            { name: 'Compliance', href: '#compliance' },
        ],
    }

    const socialLinks = [
        { icon: Twitter, href: '#', label: 'Twitter' },
        { icon: Linkedin, href: '#', label: 'LinkedIn' },
        { icon: Facebook, href: '#', label: 'Facebook' },
        { icon: Instagram, href: '#', label: 'Instagram' },
    ]

    return (
        <footer className="bg-dark-900 border-t border-gold-500/20 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><g fill="#FFD700" fill-opacity="0.1"><path d="M20 20c0-11.046-8.954-20-20-20v20h20z"/></g></svg>')}")`
                    }}
                ></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
                    {/* Company Info */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="mb-6"
                        >
                            <div className="flex items-center space-x-2 mb-4">
                                <NexgenLogo size="md" variant="full" showText={true} dark={true} />
                            </div>
                            <p className="text-gray-400 leading-relaxed mb-6">
                                Leading the future of cryptocurrency mining and gold investments with automated systems,
                                transparent operations, and consistent dividend payouts.
                            </p>

                            {/* Contact Info */}
                            <div className="space-y-3">
                                <div className="flex items-center text-gray-400">
                                    <Mail className="w-4 h-4 mr-3 text-gold-500" />
                                    <span>support@nexgencrypto.live</span>
                                </div>
                                <div className="flex items-center text-gray-400">
                                    <Phone className="w-4 h-4 mr-3 text-gold-500" />
                                    <span>+1 (555) 123-4567</span>
                                </div>
                                <div className="flex items-center text-gray-400">
                                    <MapPin className="w-4 h-4 mr-3 text-gold-500" />
                                    <span>123 Financial District, NY</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Footer Links */}
                    {Object.entries(footerLinks).map(([category, links], index) => (
                        <motion.div
                            key={category}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.6 }}
                        >
                            <h3 className="text-white font-semibold mb-4 capitalize">{category}</h3>
                            <ul className="space-y-3">
                                {links.map((link, linkIndex) => (
                                    <li key={linkIndex}>
                                        <a
                                            href={link.href}
                                            className="text-gray-400 hover:text-gold-500 transition-colors duration-300"
                                        >
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                {/* Social Links & Newsletter */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="border-t border-gold-500/20 pt-8 mb-8"
                >
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        {/* Social Links */}
                        <div className="flex items-center space-x-6 mb-6 md:mb-0">
                            <span className="text-gray-400 font-medium">Follow Us:</span>
                            {socialLinks.map((social, index) => (
                                <motion.a
                                    key={index}
                                    href={social.href}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="w-10 h-10 bg-navy-800/50 rounded-lg flex items-center justify-center text-gray-400 hover:text-gold-500 hover:bg-gold-500/10 transition-all duration-300"
                                    aria-label={social.label}
                                >
                                    <social.icon className="w-5 h-5" />
                                </motion.a>
                            ))}
                        </div>

                        {/* Newsletter Signup */}
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-400 font-medium">Stay Updated:</span>
                            <div className="flex">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="px-4 py-2 bg-navy-800/50 border border-gold-500/30 rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 transition-colors"
                                />
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-6 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 rounded-r-lg font-semibold hover:from-gold-400 hover:to-gold-500 transition-all duration-300"
                                >
                                    Subscribe
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Bottom Footer */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="border-t border-gold-500/20 pt-8"
                >
                    <div className="flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
                        <div className="mb-4 md:mb-0">
                            <p>&copy; 2025 NexGen Investments. All rights reserved.</p>
                        </div>
                        <div className="flex flex-wrap items-center space-x-6">
                            <span>Licensed & Regulated</span>
                            <span>•</span>
                            <span>SEC Compliant</span>
                            <span>•</span>
                            <span>FINRA Member</span>
                        </div>
                    </div>

                    {/* Risk Disclaimer */}
                    <div className="mt-6 p-4 bg-navy-800/30 rounded-lg border border-gold-500/20">
                        <p className="text-xs text-gray-400 leading-relaxed">
                            <strong className="text-gold-500">Risk Disclaimer:</strong> Cryptocurrency mining and investments involve substantial risk of loss.
                            Past performance does not guarantee future results. All investments are subject to market volatility.
                            Please consider your financial situation and consult with a financial advisor before investing.
                        </p>
                    </div>
                </motion.div>
            </div>
        </footer>
    )
}

export default Footer