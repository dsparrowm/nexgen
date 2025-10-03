"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Star, Quote } from 'lucide-react'

const Testimonials = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    })

    const testimonials = [
        {
            name: 'Sarah Johnson',
            role: 'Portfolio Manager',
            company: 'Goldman Investments',
            image: 'https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
            rating: 5,
            text: 'NexGen has consistently delivered exceptional returns. Their automated dividend system is revolutionary, and the transparency is unmatched in the industry.',
        },
        {
            name: 'Michael Chen',
            role: 'Tech Entrepreneur',
            company: 'BlockTech Ventures',
            image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
            rating: 5,
            text: 'The combination of cryptocurrency mining and gold backing provides the perfect balance of growth and security. I\'ve been earning steady dividends for over 2 years.',
        },
        {
            name: 'Emma Rodriguez',
            role: 'Investment Advisor',
            company: 'Wealth Management Pro',
            image: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
            rating: 5,
            text: 'Their professional mining operations and smart algorithms have generated consistent 12% annual returns for my clients. Highly recommended for serious investors.',
        },
        {
            name: 'David Kim',
            role: 'Crypto Analyst',
            company: 'Digital Assets Research',
            image: 'https://images.pexels.com/photos/3777943/pexels-photo-3777943.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
            rating: 5,
            text: 'NexGen\'s transparency and automated processes give me complete confidence. The monthly dividends have exceeded my expectations every single time.',
        },
        {
            name: 'Lisa Thompson',
            role: 'Retirement Planner',
            company: 'SecureFuture Financial',
            image: 'https://images.pexels.com/photos/3756681/pexels-photo-3756681.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
            rating: 5,
            text: 'Perfect for retirement planning! The steady dividend payments and gold backing provide the security my clients need for their golden years.',
        },
        {
            name: 'James Wilson',
            role: 'Hedge Fund Manager',
            company: 'Alpha Capital',
            image: 'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
            rating: 5,
            text: 'Outstanding performance across all market conditions. NexGen has become a cornerstone of our alternative investment strategy.',
        },
    ]

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, index) => (
            <Star
                key={index}
                className={`w-5 h-5 ${index < rating ? 'text-gold-500 fill-current' : 'text-gray-400'
                    }`}
            />
        ))
    }

    return (
        <section id="testimonials" className="py-20 bg-navy-900 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-1/3 left-1/4 w-24 h-24 bg-gold-500/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
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
                        What Our <span className="text-gradient">Clients Say</span>
                    </h2>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                        Join thousands of satisfied investors who trust NexGen for their cryptocurrency mining
                        and gold investment needs. Here's what they have to say about their experience.
                    </p>
                </motion.div>

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            animate={inView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: index * 0.1, duration: 0.8 }}
                            className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20 card-hover group relative"
                        >
                            {/* Quote Icon */}
                            <div className="absolute top-4 right-4 text-gold-500/30">
                                <Quote className="w-8 h-8" />
                            </div>

                            {/* Rating */}
                            <div className="flex items-center mb-4">
                                {renderStars(testimonial.rating)}
                            </div>

                            {/* Testimonial Text */}
                            <p className="text-gray-300 mb-6 leading-relaxed italic">
                                "{testimonial.text}"
                            </p>

                            {/* Client Info */}
                            <div className="flex items-center">
                                <img
                                    src={testimonial.image}
                                    alt={testimonial.name}
                                    className="w-12 h-12 rounded-full object-cover mr-4"
                                />
                                <div>
                                    <h4 className="font-semibold text-white">{testimonial.name}</h4>
                                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                                    <p className="text-sm text-gold-500">{testimonial.company}</p>
                                </div>
                            </div>

                            {/* Hover Effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>
                        </motion.div>
                    ))}
                </div>

                {/* Trust Indicators */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="bg-gradient-to-r from-navy-800/50 to-dark-800/50 backdrop-blur-sm rounded-3xl p-8 border border-gold-500/20"
                >
                    <div className="text-center mb-8">
                        <h3 className="text-2xl md:text-3xl font-bold mb-4">
                            Trusted by Industry Leaders
                        </h3>
                        <p className="text-gray-300">Join over 10,000 satisfied investors worldwide</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { metric: '10,000+', label: 'Active Investors' },
                            { metric: '99.2%', label: 'Client Satisfaction' },
                            { metric: '$50M+', label: 'Total Invested' },
                            { metric: '5+ Years', label: 'Track Record' },
                        ].map((stat, index) => (
                            <div key={index}>
                                <div className="text-3xl md:text-4xl font-bold text-gold-500 mb-2">
                                    {stat.metric}
                                </div>
                                <div className="text-gray-400">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default Testimonials