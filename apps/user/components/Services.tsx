"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Cpu, Coins, BarChart3, Zap, Settings, DollarSign } from 'lucide-react'

const Services = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    })

    const services = [
        {
            icon: Cpu,
            title: 'Professional Mining',
            description: 'State-of-the-art mining facilities with latest ASIC hardware and optimal power efficiency.',
            features: ['Latest ASIC Miners', '99.9% Uptime', 'Green Energy', '24/7 Monitoring'],
            gradient: 'from-blue-500 to-purple-600',
        },
        {
            icon: Coins,
            title: 'Gold-Backed Tokens',
            description: 'Cryptocurrency mining backed by physical gold reserves for added stability and security.',
            features: ['Physical Gold Reserve', 'Audited Holdings', 'Stable Value', 'Liquid Assets'],
            gradient: 'from-gold-400 to-gold-600',
        },
        {
            icon: BarChart3,
            title: 'Smart Portfolio',
            description: 'AI-driven portfolio management with automatic rebalancing and risk optimization.',
            features: ['AI Optimization', 'Risk Management', 'Auto Rebalancing', 'Real-time Analytics'],
            gradient: 'from-green-500 to-emerald-600',
        },
        {
            icon: Zap,
            title: 'Automated Selling',
            description: 'Intelligent algorithms monitor market conditions and execute optimal selling strategies.',
            features: ['Market Analysis', 'Optimal Timing', 'Price Alerts', 'Auto Execution'],
            gradient: 'from-orange-500 to-red-600',
        },
        {
            icon: Settings,
            title: 'Custom Strategies',
            description: 'Personalized investment strategies tailored to your risk tolerance and goals.',
            features: ['Risk Assessment', 'Custom Plans', 'Goal Setting', 'Strategy Adjustment'],
            gradient: 'from-purple-500 to-pink-600',
        },
        {
            icon: DollarSign,
            title: 'Dividend Payouts',
            description: 'Regular dividend distributions with flexible payout options and compound growth.',
            features: ['Monthly Payouts', 'Compound Options', 'Multiple Currencies', 'Instant Transfers'],
            gradient: 'from-cyan-500 to-blue-600',
        },
    ]

    return (
        <section id="services" className="py-20 bg-navy-900 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-10 w-32 h-32 bg-gold-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 50 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
                        Our <span className="text-gradient">Services</span>
                    </h2>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                        Comprehensive cryptocurrency mining and investment solutions designed to maximize your returns
                        while minimizing risk through automated processes and expert management.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            animate={inView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: index * 0.1, duration: 0.8 }}
                            className="group relative"
                        >
                            <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20 card-hover h-full">
                                {/* Icon */}
                                <div className={`w-12 h-12 bg-gradient-to-br ${service.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <service.icon className="w-6 h-6 text-white" />
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-semibold mb-3 text-white">{service.title}</h3>
                                <p className="text-gray-400 mb-6 leading-relaxed">{service.description}</p>

                                {/* Features */}
                                <ul className="space-y-2">
                                    {service.features.map((feature, featureIndex) => (
                                        <li key={featureIndex} className="flex items-center text-sm text-gray-300">
                                            <div className="w-1.5 h-1.5 bg-gold-500 rounded-full mr-3"></div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="text-center mt-16"
                >
                    <div className="bg-navy-800/50 backdrop-blur-sm rounded-3xl p-8 border border-gold-500/30">
                        <h3 className="text-2xl md:text-3xl font-bold mb-4">
                            Ready to Start Your Investment Journey?
                        </h3>
                        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                            Join thousands of investors who trust NexGen for their cryptocurrency mining and gold investment needs.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn-primary"
                        >
                            Get Started Today
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default Services