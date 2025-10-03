"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { ArrowRight, CheckCircle, Star, Zap } from 'lucide-react'
import Link from 'next/link'

const CTA = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    })

    const investmentTiers = [
        {
            name: 'Starter',
            amount: '$500',
            monthlyReturn: '$40-75',
            features: ['Basic Mining Access', 'Monthly Dividends', 'Email Support', 'Portfolio Dashboard'],
            popular: false,
        },
        {
            name: 'Professional',
            amount: '$2,500',
            monthlyReturn: '$200-375',
            features: ['Premium Mining Access', 'Weekly Dividends', 'Priority Support', 'Advanced Analytics', 'Gold Backing'],
            popular: true,
        },
        {
            name: 'Enterprise',
            amount: '$10,000',
            monthlyReturn: '$800-1,500',
            features: ['Exclusive Mining Pools', 'Daily Dividends', 'Dedicated Manager', 'Custom Strategies', 'Full Gold Reserve'],
            popular: false,
        },
    ]

    return (
        <section className="py-20 bg-dark-900 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gold-500/5 via-transparent to-blue-500/5"></div>
                <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-gold-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 50 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-6xl font-bold font-display mb-6">
                        Start Earning <span className="text-gradient">Today</span>
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8">
                        Join the future of cryptocurrency mining and gold investments.
                        Choose your investment tier and start earning automated dividends within 24 hours.
                    </p>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap justify-center items-center gap-6 mb-12">
                        {[
                            { icon: CheckCircle, text: 'SEC Compliant' },
                            { icon: Star, text: '5-Star Rated' },
                            { icon: Zap, text: 'Instant Setup' },
                        ].map((badge, index) => (
                            <div key={index} className="flex items-center text-gray-300">
                                <badge.icon className="w-5 h-5 text-gold-500 mr-2" />
                                <span>{badge.text}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Investment Tiers */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {investmentTiers.map((tier, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            animate={inView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: index * 0.2, duration: 0.8 }}
                            className={`relative bg-navy-800/50 backdrop-blur-sm rounded-3xl p-8 border-2 transition-all duration-300 hover:scale-105 ${tier.popular
                                ? 'border-gold-500 shadow-2xl shadow-gold-500/20'
                                : 'border-gold-500/20 hover:border-gold-500/40'
                                }`}
                        >
                            {/* Popular Badge */}
                            {tier.popular && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <div className="bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 px-6 py-2 rounded-full text-sm font-bold">
                                        Most Popular
                                    </div>
                                </div>
                            )}

                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                                <div className="text-4xl font-bold text-gold-500 mb-2">{tier.amount}</div>
                                <div className="text-gray-400">Minimum Investment</div>
                                <div className="text-lg font-semibold text-white mt-4">
                                    {tier.monthlyReturn} <span className="text-sm text-gray-400">/ month</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {tier.features.map((feature, featureIndex) => (
                                    <li key={featureIndex} className="flex items-center text-gray-300">
                                        <CheckCircle className="w-5 h-5 text-gold-500 mr-3 flex-shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link href="/signup">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 ${tier.popular
                                        ? 'btn-primary'
                                        : 'bg-navy-700 text-white hover:bg-navy-600 border border-gold-500/30 hover:border-gold-500'
                                        }`}
                                >
                                    Get Started
                                    <ArrowRight className="ml-2 w-5 h-5 inline" />
                                </motion.button>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Final CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="text-center"
                >
                    <div className="bg-navy-800/50 backdrop-blur-sm rounded-3xl p-8 border border-gold-500/30">
                        <h3 className="text-2xl md:text-3xl font-bold mb-4">
                            Don't Wait - Start Earning Passive Income Today!
                        </h3>
                        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                            Limited spots available for new investors. Join now and secure your position
                            in the future of cryptocurrency mining and gold investments.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/signup">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="btn-primary text-lg px-10 py-4"
                                >
                                    Start Investing Now
                                    <ArrowRight className="ml-2 w-6 h-6" />
                                </motion.button>
                            </Link>
                            <Link href="/contact">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="btn-secondary text-lg px-10 py-4"
                                >
                                    Schedule Consultation
                                </motion.button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default CTA