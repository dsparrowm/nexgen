import React from 'react'
import LiveChatButton from './LiveChatButton'
import DashboardLayout from '../components/DashboardLayout'
import AuthGuard from '@/components/auth/AuthGuard'
import { Mail, MessageCircle, Phone, HelpCircle } from 'lucide-react'

export default function SupportPage() {
    return (
        <AuthGuard>
            <DashboardLayout activeSection="support">
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-gold-500/10 to-blue-500/10 rounded-2xl p-6 border border-gold-500/20">
                        <h2 className="text-2xl font-bold text-white mb-2">Support Center</h2>
                        <p className="text-gray-300">We're here to help! Choose how you'd like to get in touch.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20">
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="p-3 bg-blue-500/20 rounded-xl">
                                    <Mail className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Email Support</h3>
                                    <p className="text-gray-400 text-sm">Get help via email</p>
                                </div>
                            </div>
                            <p className="text-gray-300 mb-4">Send us an email and we'll get back to you within 24 hours.</p>
                            <a
                                href="mailto:support@nexgen.com"
                                className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                            >
                                Email Us
                            </a>
                        </div>

                        <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20">
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="p-3 bg-green-500/20 rounded-xl">
                                    <MessageCircle className="w-6 h-6 text-green-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Live Chat</h3>
                                    <p className="text-gray-400 text-sm">Chat with our team</p>
                                </div>
                            </div>
                            <p className="text-gray-300 mb-4">Chat with our support team in real-time.</p>
                            <LiveChatButton />
                        </div>

                        <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20">
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="p-3 bg-gold-500/20 rounded-xl">
                                    <Phone className="w-6 h-6 text-gold-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Phone Support</h3>
                                    <p className="text-gray-400 text-sm">Talk to an expert</p>
                                </div>
                            </div>
                            <p className="text-gray-300 mb-4">Call us during business hours for immediate assistance.</p>
                            <a
                                href="tel:+1234567890"
                                className="inline-block px-4 py-2 bg-gold-500 hover:bg-gold-600 text-navy-900 rounded-lg transition-colors font-medium"
                            >
                                Call Now
                            </a>
                        </div>

                        <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20">
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="p-3 bg-purple-500/20 rounded-xl">
                                    <HelpCircle className="w-6 h-6 text-purple-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">FAQ & Guides</h3>
                                    <p className="text-gray-400 text-sm">Self-service help</p>
                                </div>
                            </div>
                            <p className="text-gray-300 mb-4">Browse our knowledge base for quick answers.</p>
                            <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors">
                                View FAQs
                            </button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </AuthGuard>
    )
}
