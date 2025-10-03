"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Mail, Phone, MapPin, Send, MessageCircle, Clock } from 'lucide-react'

const Contact = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    })

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        investment: '',
        message: '',
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Handle form submission here
        console.log('Form submitted:', formData)
    }

    const contactInfo = [
        {
            icon: Mail,
            title: 'Email Us',
            details: 'support@nexgencrypto.live',
            description: 'Get in touch via email',
        },
        {
            icon: Phone,
            title: 'Call Us',
            details: '+1 (555) 123-4567',
            description: '24/7 Support Available',
        },
        {
            icon: MapPin,
            title: 'Visit Us',
            details: '123 Financial District, NY',
            description: 'Schedule an appointment',
        },
    ]

    return (
        <section id="contact" className="py-20 bg-navy-900 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFD700' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0l-2 2-2-2v4l2 2 2-2zm0 60v-4l-2-2-2 2v4l2-2 2 2zM34 36h-4v-2h4v-4h2v4h4v2h-4v4h-2v-4zm30-2h-4l-2-2 2-2h4l-2 2 2 2zM0 34h4l2-2-2-2H0l2 2-2 2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
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
                        Get in <span className="text-gradient">Touch</span>
                    </h2>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                        Ready to start your investment journey? Our expert team is here to guide you through
                        every step of the process. Contact us today for a personalized consultation.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="bg-dark-800/50 backdrop-blur-sm rounded-3xl p-8 border border-gold-500/20"
                    >
                        <h3 className="text-2xl font-bold mb-6 text-white">Send us a Message</h3>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 transition-colors"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 transition-colors"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 transition-colors"
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="investment" className="block text-sm font-medium text-gray-300 mb-2">
                                        Investment Interest
                                    </label>
                                    <select
                                        id="investment"
                                        name="investment"
                                        value={formData.investment}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/30 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors"
                                    >
                                        <option value="">Select an option</option>
                                        <option value="starter">Starter ($500+)</option>
                                        <option value="professional">Professional ($2,500+)</option>
                                        <option value="enterprise">Enterprise ($10,000+)</option>
                                        <option value="custom">Custom Investment</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                                    Message
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    rows={5}
                                    className="w-full px-4 py-3 bg-navy-800/50 border border-gold-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 transition-colors resize-none"
                                    placeholder="Tell us about your investment goals and any questions you have..."
                                />
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="w-full btn-primary group"
                            >
                                Send Message
                                <Send className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </motion.button>
                        </form>
                    </motion.div>

                    {/* Contact Information */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="space-y-8"
                    >
                        {/* Contact Cards */}
                        <div className="space-y-6">
                            {contactInfo.map((info, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={inView ? { opacity: 1, y: 0 } : {}}
                                    transition={{ delay: 0.6 + index * 0.1, duration: 0.8 }}
                                    className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20 card-hover group"
                                >
                                    <div className="flex items-start">
                                        <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                            <info.icon className="w-6 h-6 text-navy-900" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-semibold text-white mb-1">{info.title}</h4>
                                            <p className="text-gold-500 font-medium mb-1">{info.details}</p>
                                            <p className="text-gray-400 text-sm">{info.description}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Additional Info */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={inView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: 0.8, duration: 0.8 }}
                            className="bg-navy-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/30"
                        >
                            <div className="flex items-center mb-4">
                                <Clock className="w-6 h-6 text-gold-500 mr-3" />
                                <h4 className="text-lg font-semibold text-white">Business Hours</h4>
                            </div>
                            <div className="space-y-2 text-gray-300">
                                <div className="flex justify-between">
                                    <span>Monday - Friday:</span>
                                    <span>9:00 AM - 8:00 PM EST</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Saturday:</span>
                                    <span>10:00 AM - 6:00 PM EST</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Sunday:</span>
                                    <span>12:00 PM - 5:00 PM EST</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Quick Contact */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={inView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: 1, duration: 0.8 }}
                            className="text-center"
                        >
                            <h4 className="text-lg font-semibold text-white mb-4">Need Immediate Assistance?</h4>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn-primary"
                            >
                                <MessageCircle className="w-5 h-5 mr-2" />
                                Live Chat Support
                            </motion.button>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

export default Contact