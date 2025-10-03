"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Zap,
    Play,
    Pause,
    Square,
    TrendingUp,
    Settings,
    Calendar,
    AlertCircle,
    CheckCircle,
    Clock,
    Thermometer,
    Activity,
    DollarSign,
    ArrowUp,
    ArrowDown
} from 'lucide-react'

const MiningManagement = () => {
    const [miningStatus, setMiningStatus] = useState<'active' | 'paused' | 'stopped'>('active')
    const [selectedPlan, setSelectedPlan] = useState('pro')

    const currentPlan = {
        name: 'Pro Plan',
        hashpower: '180 TH/s',
        expires: 'Dec 15, 2025',
        status: 'active',
        efficiency: '95.2%',
        temperature: '65°C',
        uptime: '99.8%',
        dailyEarnings: '$240.50',
        monthlyEarnings: '$7,215.00'
    }

    const plans = [
        {
            id: 'basic',
            name: 'Basic',
            hashpower: '50 TH/s',
            price: '$75',
            period: '/month',
            features: ['Basic mining access', 'Daily payouts', 'Email support', 'Mobile app'],
            popular: false,
            estimated: '$45-65/month'
        },
        {
            id: 'pro',
            name: 'Pro',
            hashpower: '180 TH/s',
            price: '$250',
            period: '/month',
            features: ['Premium mining access', 'Real-time monitoring', 'Priority support', 'Advanced analytics'],
            popular: true,
            estimated: '$180-220/month'
        },
        {
            id: 'elite',
            name: 'Elite',
            hashpower: '500 TH/s',
            price: '$650',
            period: '/month',
            features: ['Elite mining pools', 'Dedicated hardware', '24/7 phone support', 'Custom strategies'],
            popular: false,
            estimated: '$480-580/month'
        }
    ]

    const miningRigs = [
        { id: 1, name: 'Antminer S19 Pro #001', hashpower: '110 TH/s', status: 'active', temperature: '62°C', efficiency: '29.5 J/TH' },
        { id: 2, name: 'Antminer S19 Pro #002', hashpower: '70 TH/s', status: 'active', temperature: '68°C', efficiency: '29.5 J/TH' },
    ]

    const handleMiningControl = (action: 'start' | 'pause' | 'stop') => {
        if (action === 'start') {
            setMiningStatus('active')
        } else if (action === 'pause') {
            setMiningStatus('paused')
        } else {
            setMiningStatus('stopped')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-green-500 bg-green-500/20'
            case 'paused': return 'text-yellow-500 bg-yellow-500/20'
            case 'stopped': return 'text-red-500 bg-red-500/20'
            default: return 'text-gray-500 bg-gray-500/20'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return CheckCircle
            case 'paused': return Clock
            case 'stopped': return AlertCircle
            default: return AlertCircle
        }
    }

    return (
        <div className="space-y-6">
            {/* Current Mining Status */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Mining Operations</h2>
                    <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(miningStatus)}`}>
                        {React.createElement(getStatusIcon(miningStatus), { className: "w-4 h-4 mr-2" })}
                        {miningStatus.charAt(0).toUpperCase() + miningStatus.slice(1)}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Controls */}
                    <div className="space-y-4">
                        <div className="bg-navy-800/50 rounded-xl p-4">
                            <h3 className="text-lg font-semibold text-white mb-4">Current Plan</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Plan:</span>
                                    <span className="text-white font-medium">{currentPlan.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Hashpower:</span>
                                    <span className="text-gold-500 font-medium">{currentPlan.hashpower}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Expires:</span>
                                    <span className="text-white">{currentPlan.expires}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Efficiency:</span>
                                    <span className="text-green-500">{currentPlan.efficiency}</span>
                                </div>
                            </div>
                        </div>

                        {/* Mining Controls */}
                        <div className="bg-navy-800/50 rounded-xl p-4">
                            <h3 className="text-lg font-semibold text-white mb-4">Controls</h3>
                            <div className="flex space-x-3">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleMiningControl('start')}
                                    disabled={miningStatus === 'active'}
                                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Play className="w-4 h-4 mr-2" />
                                    Start
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleMiningControl('pause')}
                                    disabled={miningStatus !== 'active'}
                                    className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Pause className="w-4 h-4 mr-2" />
                                    Pause
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleMiningControl('stop')}
                                    disabled={miningStatus === 'stopped'}
                                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Square className="w-4 h-4 mr-2" />
                                    Stop
                                </motion.button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Performance Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-navy-800/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <Thermometer className="w-5 h-5 text-orange-500" />
                                <span className="text-orange-500 text-sm">Temperature</span>
                            </div>
                            <p className="text-xl font-bold text-white">{currentPlan.temperature}</p>
                            <p className="text-gray-400 text-sm">Normal range</p>
                        </div>

                        <div className="bg-navy-800/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <Activity className="w-5 h-5 text-green-500" />
                                <span className="text-green-500 text-sm">Uptime</span>
                            </div>
                            <p className="text-xl font-bold text-white">{currentPlan.uptime}</p>
                            <p className="text-gray-400 text-sm">Last 30 days</p>
                        </div>

                        <div className="bg-navy-800/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <DollarSign className="w-5 h-5 text-blue-500" />
                                <span className="text-blue-500 text-sm">Daily</span>
                            </div>
                            <p className="text-xl font-bold text-white">{currentPlan.dailyEarnings}</p>
                            <p className="text-gray-400 text-sm">Today's earnings</p>
                        </div>

                        <div className="bg-navy-800/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <TrendingUp className="w-5 h-5 text-gold-500" />
                                <span className="text-gold-500 text-sm">Monthly</span>
                            </div>
                            <p className="text-xl font-bold text-white">{currentPlan.monthlyEarnings}</p>
                            <p className="text-gray-400 text-sm">This month</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Mining Rigs Status */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
            >
                <h3 className="text-xl font-bold text-white mb-6">Mining Rigs</h3>
                <div className="space-y-4">
                    {miningRigs.map((rig) => (
                        <div key={rig.id} className="bg-navy-800/50 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-white font-semibold">{rig.name}</h4>
                                    <p className="text-gray-400 text-sm">Hashpower: {rig.hashpower}</p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-center">
                                        <p className="text-white text-sm">{rig.temperature}</p>
                                        <p className="text-gray-400 text-xs">Temp</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white text-sm">{rig.efficiency}</p>
                                        <p className="text-gray-400 text-xs">Efficiency</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rig.status)}`}>
                                        {rig.status}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Upgrade Plans */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Upgrade Your Plan</h3>
                    <div className="text-sm text-gray-400">
                        Current: <span className="text-gold-500">{currentPlan.name}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <motion.div
                            key={plan.id}
                            whileHover={{ scale: 1.02 }}
                            className={`relative bg-navy-800/50 rounded-xl p-6 border-2 transition-all duration-300 cursor-pointer ${plan.popular
                                    ? 'border-gold-500 shadow-lg shadow-gold-500/20'
                                    : selectedPlan === plan.id
                                        ? 'border-gold-500/60'
                                        : 'border-gold-500/20 hover:border-gold-500/40'
                                }`}
                            onClick={() => setSelectedPlan(plan.id)}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 px-4 py-1 rounded-full text-xs font-bold">
                                        Current Plan
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-4">
                                <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
                                <div className="text-3xl font-bold text-gold-500 mb-1">{plan.price}</div>
                                <div className="text-gray-400 text-sm">{plan.period}</div>
                                <div className="text-lg font-semibold text-white mt-2">{plan.hashpower}</div>
                            </div>

                            <div className="space-y-2 mb-6">
                                {plan.features.map((feature, index) => (
                                    <div key={index} className="flex items-center text-sm text-gray-300">
                                        <CheckCircle className="w-4 h-4 text-gold-500 mr-2 flex-shrink-0" />
                                        {feature}
                                    </div>
                                ))}
                            </div>

                            <div className="text-center mb-4">
                                <div className="text-sm text-gray-400">Estimated Earnings</div>
                                <div className="text-lg font-semibold text-green-500">{plan.estimated}</div>
                            </div>

                            {plan.id !== 'pro' && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${plan.id === 'basic'
                                            ? 'bg-gray-600 text-white hover:bg-gray-700 flex items-center justify-center'
                                            : 'btn-primary flex items-center justify-center'
                                        }`}
                                >
                                    {plan.id === 'basic' ? (
                                        <>
                                            <ArrowDown className="w-4 h-4 mr-2" />
                                            Downgrade
                                        </>
                                    ) : (
                                        <>
                                            <ArrowUp className="w-4 h-4 mr-2" />
                                            Upgrade
                                        </>
                                    )}
                                </motion.button>
                            )}
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}

export default MiningManagement