"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    ArrowUpRight,
    CreditCard,
    Bitcoin,
    Building,
    AlertCircle,
    CheckCircle,
    Loader,
    Info,
    DollarSign
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { createWithdrawal } from '@/utils/api/transactionApi'
import { formatCurrency } from '@/utils/formatters'
import { useDashboardData } from '@/hooks/useDashboardData'

interface WithdrawalFormData {
    amount: string
    cryptocurrency: 'BTC' | 'ETH' | 'USDT'
    withdrawalAddress: string
}

const WithdrawalManagement = () => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<{
        type: 'success' | 'error' | null
        message: string
    }>({ type: null, message: '' })

    const { data } = useDashboardData()
    const user = data?.user

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch
    } = useForm<WithdrawalFormData>({
        defaultValues: {
            cryptocurrency: 'BTC'
        }
    })

    const selectedAmount = watch('amount')
    const selectedCryptocurrency = watch('cryptocurrency')

    const cryptocurrencies = [
        {
            id: 'BTC',
            name: 'Bitcoin',
            symbol: 'BTC',
            icon: Bitcoin,
            network: 'Bitcoin Network',
            fee: '0.0001 BTC',
            minWithdrawal: 0.001,
            available: true
        },
        {
            id: 'ETH',
            name: 'Ethereum',
            symbol: 'ETH',
            icon: CreditCard, // Using CreditCard as placeholder, should be Ethereum icon
            network: 'Ethereum Network',
            fee: '0.005 ETH',
            minWithdrawal: 0.01,
            available: true
        },
        {
            id: 'USDT',
            name: 'Tether (USDT)',
            symbol: 'USDT',
            icon: DollarSign,
            network: 'Ethereum (ERC-20)',
            fee: '5 USDT',
            minWithdrawal: 50,
            available: true
        }
    ]

    const availableBalance = user?.balance || 0
    const minWithdrawal = cryptocurrencies.find(c => c.id === selectedCryptocurrency)?.minWithdrawal || 0.001
    const fee = cryptocurrencies.find(c => c.id === selectedCryptocurrency)?.fee || '0.0001 BTC'
    const feeAmount = selectedAmount ? parseFloat(selectedAmount) * 0.001 : 0 // Simplified fee calculation
    const netAmount = selectedAmount ? parseFloat(selectedAmount) - feeAmount : 0

    const onSubmit = async (data: WithdrawalFormData) => {
        setIsSubmitting(true)
        setSubmitStatus({ type: null, message: '' })

        try {
            const amount = parseFloat(data.amount)
            if (isNaN(amount) || amount <= 0) {
                throw new Error('Please enter a valid amount')
            }

            const selectedCrypto = cryptocurrencies.find(c => c.id === data.cryptocurrency)
            if (!selectedCrypto) {
                throw new Error('Please select a cryptocurrency')
            }

            if (amount < selectedCrypto.minWithdrawal) {
                throw new Error(`Minimum withdrawal amount is ${selectedCrypto.minWithdrawal} ${selectedCrypto.symbol}`)
            }

            if (amount > availableBalance) {
                throw new Error('Insufficient balance')
            }

            // Validate withdrawal address format
            if (!data.withdrawalAddress || data.withdrawalAddress.trim().length === 0) {
                throw new Error('Please enter a withdrawal address')
            }

            const result = await createWithdrawal({
                amount,
                currency: data.cryptocurrency,
                withdrawalAddress: data.withdrawalAddress.trim()
            })

            setSubmitStatus({
                type: 'success',
                message: 'Withdrawal request submitted successfully! Processing may take 24-48 hours.'
            })

            reset()

        } catch (error: any) {
            setSubmitStatus({
                type: 'error',
                message: error.message || 'Failed to create withdrawal request'
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
            >
                <div className="flex items-center mb-4">
                    <ArrowUpRight className="w-8 h-8 text-gold-500 mr-3" />
                    <div>
                        <h2 className="text-2xl font-bold text-white">Withdraw Funds</h2>
                        <p className="text-gray-400">Withdraw your earnings from NexGen</p>
                    </div>
                </div>

                {/* Balance Display */}
                <div className="bg-gradient-to-r from-navy-800 to-navy-900 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Available Balance</p>
                            <p className="text-2xl font-bold text-white">{formatCurrency(availableBalance)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-sm">Pending Withdrawals</p>
                            <p className="text-lg font-semibold text-yellow-500">$0.00</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Withdrawal Form */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
                >
                    <h3 className="text-xl font-semibold text-white mb-6">Request Withdrawal</h3>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Amount Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Withdrawal Amount (USD)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min={minWithdrawal}
                                    max={availableBalance}
                                    {...register('amount', {
                                        required: 'Amount is required',
                                        min: { value: minWithdrawal, message: `Minimum withdrawal is $${minWithdrawal}` },
                                        max: { value: availableBalance, message: 'Amount exceeds available balance' },
                                        validate: (value) => {
                                            const numValue = parseFloat(value)
                                            if (numValue > availableBalance) {
                                                return 'Insufficient balance'
                                            }
                                            return true
                                        }
                                    })}
                                    className="w-full pl-8 pr-4 py-3 bg-navy-900 border border-navy-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                                    placeholder="Enter amount"
                                />
                            </div>
                            {errors.amount && (
                                <p className="mt-1 text-sm text-red-500">{errors.amount.message}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-400">
                                Available: {formatCurrency(availableBalance)} | Min: ${minWithdrawal}
                            </p>
                        </div>

                        {/* Cryptocurrency Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-4">
                                Cryptocurrency
                            </label>
                            <div className="space-y-3">
                                {cryptocurrencies.map((crypto) => {
                                    const Icon = crypto.icon
                                    return (
                                        <label
                                            key={crypto.id}
                                            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${selectedCryptocurrency === crypto.id
                                                ? 'border-gold-500 bg-gold-500/10'
                                                : 'border-navy-700 bg-navy-900/50 hover:border-navy-600'
                                                } ${!crypto.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <input
                                                type="radio"
                                                value={crypto.id}
                                                disabled={!crypto.available}
                                                {...register('cryptocurrency', { required: true })}
                                                className="sr-only"
                                            />
                                            <Icon className={`w-6 h-6 mr-3 ${crypto.available ? 'text-gold-500' : 'text-gray-500'}`} />
                                            <div className="flex-1">
                                                <div className={`font-medium ${crypto.available ? 'text-white' : 'text-gray-500'}`}>
                                                    {crypto.name}
                                                </div>
                                                <div className={`text-sm ${crypto.available ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {crypto.network}
                                                </div>
                                                <div className={`text-xs mt-1 ${crypto.available ? 'text-gold-500' : 'text-gray-500'}`}>
                                                    Fee: {crypto.fee} | Min: ${crypto.minWithdrawal}
                                                </div>
                                            </div>
                                            {selectedCryptocurrency === crypto.id && crypto.available && (
                                                <CheckCircle className="w-5 h-5 text-gold-500" />
                                            )}
                                            {!crypto.available && (
                                                <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">Coming Soon</span>
                                            )}
                                        </label>
                                    )
                                })}
                            </div>
                            {errors.cryptocurrency && (
                                <p className="mt-1 text-sm text-red-500">Please select a cryptocurrency</p>
                            )}
                        </div>

                        {/* Withdrawal Address */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Withdrawal Address
                            </label>
                            <input
                                {...register('withdrawalAddress', {
                                    required: 'Withdrawal address is required',
                                    minLength: { value: 10, message: 'Please provide a valid withdrawal address' }
                                })}
                                className="w-full px-4 py-3 bg-navy-900 border border-navy-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                                placeholder={
                                    selectedCryptocurrency === 'BTC'
                                        ? 'Enter your Bitcoin wallet address'
                                        : selectedCryptocurrency === 'ETH'
                                            ? 'Enter your Ethereum wallet address'
                                            : 'Enter your Tether wallet address'
                                }
                            />
                            {errors.withdrawalAddress && (
                                <p className="mt-1 text-sm text-red-500">{errors.withdrawalAddress.message}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isSubmitting || availableBalance < minWithdrawal}
                            className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <ArrowUpRight className="w-5 h-5 mr-2" />
                                    Request Withdrawal
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Status Message */}
                    {submitStatus.type && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mt-4 p-4 rounded-lg flex items-center ${submitStatus.type === 'success'
                                ? 'bg-green-500/20 border border-green-500/30'
                                : 'bg-red-500/20 border border-red-500/30'
                                }`}
                        >
                            {submitStatus.type === 'success' ? (
                                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                            )}
                            <p className={`text-sm ${submitStatus.type === 'success' ? 'text-green-400' : 'text-red-400'
                                }`}>
                                {submitStatus.message}
                            </p>
                        </motion.div>
                    )}
                </motion.div>

                {/* Withdrawal Information */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="space-y-6"
                >
                    {/* Withdrawal Summary */}
                    {selectedAmount && parseFloat(selectedAmount) > 0 && (
                        <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20">
                            <h4 className="text-lg font-semibold text-white mb-4">Withdrawal Summary</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between text-gray-300">
                                    <span>Requested Amount:</span>
                                    <span className="text-white font-medium">{formatCurrency(parseFloat(selectedAmount) || 0)}</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                    <span>Network Fee:</span>
                                    <span className="text-red-500">-{cryptocurrencies.find(c => c.id === selectedCryptocurrency)?.fee}</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                    <span>Cryptocurrency:</span>
                                    <span className="text-white font-medium">
                                        {cryptocurrencies.find(c => c.id === selectedCryptocurrency)?.name}
                                    </span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                    <span>Network:</span>
                                    <span className="text-white font-medium">
                                        {cryptocurrencies.find(c => c.id === selectedCryptocurrency)?.network}
                                    </span>
                                </div>
                                <hr className="border-navy-700" />
                                <div className="flex justify-between text-white font-semibold">
                                    <span>Estimated Processing:</span>
                                    <span className="text-yellow-500">24-48 hours</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Processing Times */}
                    <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20">
                        <h4 className="text-lg font-semibold text-white mb-4">Processing Times</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Bitcoin className="w-5 h-5 text-orange-500 mr-3" />
                                    <div>
                                        <div className="text-white font-medium">Bitcoin (BTC)</div>
                                        <div className="text-gray-400 text-sm">1-2 confirmations (10-20 min)</div>
                                    </div>
                                </div>
                                <span className="text-yellow-500 font-medium">10-20 min</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <CreditCard className="w-5 h-5 text-blue-500 mr-3" />
                                    <div>
                                        <div className="text-white font-medium">Ethereum (ETH/USDT)</div>
                                        <div className="text-gray-400 text-sm">12-15 confirmations (3-5 min)</div>
                                    </div>
                                </div>
                                <span className="text-green-500 font-medium">3-5 min</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-4">
                            All withdrawals require manual review before processing. Processing begins after approval.
                        </p>
                    </div>

                    {/* Important Notes */}
                    <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20">
                        <h4 className="text-lg font-semibold text-white mb-4">Important Notes</h4>
                        <div className="space-y-3">
                            <div className="flex items-start">
                                <Info className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h5 className="text-white font-medium">Address Verification</h5>
                                    <p className="text-gray-400 text-sm">Double-check your withdrawal address. Incorrect addresses cannot be recovered.</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <AlertCircle className="w-5 h-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h5 className="text-white font-medium">Network Fees</h5>
                                    <p className="text-gray-400 text-sm">Network fees are deducted from your withdrawal amount and vary by blockchain congestion.</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h5 className="text-white font-medium">Security First</h5>
                                    <p className="text-gray-400 text-sm">All withdrawal requests are manually reviewed for security before processing.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Withdrawal Limits */}
                    <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20">
                        <h4 className="text-lg font-semibold text-white mb-4">Withdrawal Limits</h4>
                        <div className="space-y-4">
                            {cryptocurrencies.map((crypto) => (
                                <div key={crypto.id} className="flex items-center justify-between p-3 bg-navy-900/50 rounded-lg">
                                    <div className="flex items-center">
                                        <crypto.icon className="w-5 h-5 text-gold-500 mr-3" />
                                        <div>
                                            <div className="text-white font-medium">{crypto.symbol}</div>
                                            <div className="text-gray-400 text-sm">{crypto.name}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-gold-500 font-medium">Min: {crypto.minWithdrawal} {crypto.symbol}</div>
                                        <div className="text-gray-400 text-sm">Fee: {crypto.fee}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default WithdrawalManagement