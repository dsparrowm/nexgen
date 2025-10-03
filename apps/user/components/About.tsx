"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Shield, Award, Users, TrendingUp } from 'lucide-react'

const About = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    })

    const features = [
        {
            icon: Shield,
            title: 'Secure & Transparent',
            description: 'Bank-level security with full transparency in all operations and real-time portfolio tracking.',
        },
        {
            icon: Award,
            title: 'Proven Track Record',
            description: '5+ years of consistent returns with industry-leading mining efficiency and risk management.',
        },
        {
            icon: Users,
            title: 'Expert Team',
            description: 'Led by blockchain pioneers and financial experts with decades of combined experience.',
        },
        {
            icon: TrendingUp,
            title: 'Automated Returns',
            description: 'Smart algorithms optimize mining and selling for maximum returns with automated dividend payouts.',
        },
    ]

    return (
        <section id="about" className="py-20 bg-dark-900 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-r from-gold-500/10 to-transparent"></div>
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
                        Why Choose <span className="text-gradient">NexGen</span>?
                    </h2>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                        We combine cutting-edge cryptocurrency mining technology with the stability of gold-backed investments,
                        delivering consistent returns through automated processes and expert management.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            animate={inView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: index * 0.1, duration: 0.8 }}
                            className="bg-navy-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20 card-hover group"
                        >
                            <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <feature.icon className="w-6 h-6 text-navy-900" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                            <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Company Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="bg-gradient-to-r from-navy-800/50 to-dark-800/50 backdrop-blur-sm rounded-3xl p-8 border border-gold-500/20"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { label: 'Years Operating', value: '5+', suffix: '' },
                            { label: 'Mining Facilities', value: '12', suffix: '' },
                            { label: 'Hash Rate', value: '2.5', suffix: 'EH/s' },
                            { label: 'Client Satisfaction', value: '99', suffix: '%' },
                        ].map((stat, index) => (
                            <div key={index}>
                                <div className="text-3xl md:text-4xl font-bold text-gold-500 mb-2">
                                    {stat.value}{stat.suffix}
                                </div>
                                <div className="text-gray-400 text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default About