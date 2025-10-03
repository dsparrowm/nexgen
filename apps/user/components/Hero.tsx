"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react'
import Link from 'next/link'

const Hero = () => {
    const floatingElements = [
        { icon: TrendingUp, delay: 0, x: 100, y: 50 },
        { icon: Shield, delay: 0.5, x: -80, y: 80 },
        { icon: Zap, delay: 1, x: 120, y: -60 },
    ]

    return (
        <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
            style={{
                backgroundImage: `url('/herobg.jpeg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}>
            {/* Background Overlay for better text readability */}
            <div className="absolute inset-0 bg-black/50"></div>

            {/* Faded Background Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <h2 className="text-8xl md:text-9xl lg:text-[10rem] xl:text-[15rem] font-bold font-display text-white/5 select-none whitespace-nowrap transform -rotate-12">
                    NEXGEN
                </h2>
            </div>

            {/* Animated Background Pattern Overlay */}
            <div className="absolute inset-0 opacity-5">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFD700' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                />
            </div>

            {/* Floating Elements */}
            {floatingElements.map((element, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: element.delay, duration: 0.8 }}
                    className="absolute hidden lg:block z-10"
                    style={{ left: `${50 + element.x}px`, top: `${50 + element.y}%` }}
                >
                    <motion.div
                        animate={{ y: [-10, 10, -10] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-16 h-16 bg-gradient-to-br from-gold-400/30 to-gold-600/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-gold-500/40"
                    >
                        <element.icon className="w-8 h-8 text-gold-400" />
                    </motion.div>
                </motion.div>
            ))}
            {/* Main Content Layout */}
            <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-12">
                {/* Left Side: Text Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex-1 text-left"
                >
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-bold font-display mb-6 leading-tight"
                    >
                        Invest in the future of{' '}
                        <span className="text-gradient">Money</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="text-lg md:text-xl lg:text-2xl text-gray-200 mb-8 max-w-4xl leading-relaxed"
                    >
                        Secure your future with expert-managed <span className="text-gradient ">cryptocurrency mining and gold investments</span> — smart profits, steady dividends, zero paperwork
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="hidden md:flex flex-col sm:flex-row gap-4 justify-start items-start"
                    >
                        <Link href="/signup">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn-primary group px-8 py-4 text-lg font-semibold"
                            >
                                Start Mining Now
                                <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </motion.button>
                        </Link>

                        <Link href="/login">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn-secondary px-8 py-4 text-lg font-semibold"
                            >
                                See Real Results
                            </motion.button>
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Right Side: Image */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="flex-1 flex justify-center lg:justify-end"
                >
                    <div className="relative">
                        {/* Placeholder Image - Replace with your actual image */}
                        <img
                            src="/images/happyclient.png"
                            alt="Happy Client - Crypto Mining Success"
                            className="w-full max-w-md lg:max-w-lg h-auto rounded-lg shadow-2xl"
                        />
                        {/* Optional: Add a glowing effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-gold-400/20 to-transparent rounded-lg blur-xl -z-10"></div>
                    </div>
                </motion.div>
            </div>

        </section>
    )
}

export default Hero