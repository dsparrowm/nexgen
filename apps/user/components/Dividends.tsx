"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { TrendingUp, Calendar, Repeat, PieChart, ArrowRight, DollarSign } from 'lucide-react'

const Dividends = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    })

    const dividendFeatures = [
        {
            icon: Calendar,
            title: 'Monthly Payouts',
            description: 'Receive consistent dividend payments every month directly to your wallet.',
            percentage: '8-15%',
            period: 'Monthly',
        },
        {
            icon: Repeat,
            title: 'Auto-Compound',
            description: 'Option to automatically reinvest dividends for exponential growth.',
            percentage: '12-22%',
            period: 'Annually',
        },
        {
            icon: PieChart,
            title: 'Diversified Returns',
            description: 'Returns from multiple mining operations and gold-backed investments.',
            percentage: '95%',
            period: 'Success Rate',
        },
    ]

    const payoutProcess = [
        { step: 1, title: 'Mining Revenue', description: 'Our mining facilities generate cryptocurrency 24/7' },
        { step: 2, title: 'Automated Selling', description: 'AI algorithms sell at optimal market conditions' },
        { step: 3, title: 'Gold Backing', description: 'Portion of profits secured with physical gold reserves' },
        { step: 4, title: 'Dividend Distribution', description: 'Monthly payouts distributed to all investors' },
    ]

    return (
        <section id="dividends" className="py-20 bg-dark-900 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FFD700' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-11.046-8.954-20-20-20v20h20z'/%3E%3C/g%3E%3C/svg%3E")`
                    }}
                ></div>
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
                        Automated <span className="text-gradient">Dividend System</span>
                    </h2>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                        Our sophisticated dividend system ensures consistent returns through automated mining operations,
                        intelligent selling algorithms, and gold-backed security.
                    </p>
                </motion.div>

                {/* Dividend Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {dividendFeatures.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            animate={inView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: index * 0.2, duration: 0.8 }}
                            className="bg-navy-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20 card-hover text-center group"
                        >
                            <div className="w-16 h-16 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <feature.icon className="w-8 h-8 text-navy-900" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                            <div className="text-3xl font-bold text-gold-500 mb-2">{feature.percentage}</div>
                            <div className="text-sm text-gray-400 mb-4">{feature.period}</div>
                            <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Payout Process */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="bg-gradient-to-r from-navy-800/50 to-dark-800/50 backdrop-blur-sm rounded-3xl p-8 border border-gold-500/20 mb-16"
                >
                    <h3 className="text-2xl md:text-3xl font-bold text-center mb-8">
                        How Our <span className="text-gradient">Dividend Process</span> Works
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {payoutProcess.map((process, index) => (
                            <div key={index} className="relative">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-navy-900 font-bold text-lg mb-4">
                                        {process.step}
                                    </div>
                                    <h4 className="text-lg font-semibold mb-2 text-white">{process.title}</h4>
                                    <p className="text-gray-400 text-sm leading-relaxed">{process.description}</p>
                                </div>

                                {/* Arrow */}
                                {index < payoutProcess.length - 1 && (
                                    <div className="hidden lg:block absolute top-6 -right-3 text-gold-500">
                                        <ArrowRight className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Investment Calculator */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="bg-navy-800/50 backdrop-blur-sm rounded-3xl p-8 border border-gold-500/30"
                >
                    <div className="text-center mb-8">
                        <h3 className="text-2xl md:text-3xl font-bold mb-4">
                            Calculate Your Potential Returns
                        </h3>
                        <p className="text-gray-300">See how much you could earn with our dividend system</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        {[
                            { investment: '$1,000', monthly: '$80-150', yearly: '$960-1,800' },
                            { investment: '$5,000', monthly: '$400-750', yearly: '$4,800-9,000' },
                            { investment: '$10,000', monthly: '$800-1,500', yearly: '$9,600-18,000' },
                        ].map((calc, index) => (
                            <div key={index} className="bg-navy-800/50 rounded-xl p-6">
                                <div className="text-2xl font-bold text-gold-500 mb-4">{calc.investment}</div>
                                <div className="space-y-2">
                                    <div>
                                        <div className="text-sm text-gray-400">Monthly Returns</div>
                                        <div className="text-lg font-semibold text-white">{calc.monthly}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400">Yearly Potential</div>
                                        <div className="text-lg font-semibold text-white">{calc.yearly}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-8">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn-primary"
                        >
                            <DollarSign className="w-5 h-5 mr-2" />
                            Start Earning Dividends
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default Dividends