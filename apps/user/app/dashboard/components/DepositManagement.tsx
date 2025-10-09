"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    DollarSign,
    CreditCard,
    Bitcoin,
    ArrowRight,
    AlertCircle,
    CheckCircle,
    Loader
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { createDeposit } from '@/utils/api/transactionApi'
import { formatCurrency } from '@/utils/formatters'

interface DepositFormData {
    amount: string
    cryptocurrency: 'BTC' | 'ETH' | 'USDT'
}

const DepositManagement = () => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<{
        type: 'success' | 'error' | null
        message: string
    }>({ type: null, message: '' })

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch
    } = useForm<DepositFormData>({
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
            walletAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            network: 'Bitcoin Network',
            minDeposit: 0.0001,
            available: true
        },
        {
            id: 'ETH',
            name: 'Ethereum',
            symbol: 'ETH',
            icon: CreditCard, // Using CreditCard as placeholder, should be Ethereum icon
            walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            network: 'Ethereum Network',
            minDeposit: 0.001,
            available: true
        },
        {
            id: 'USDT',
            name: 'Tether (USDT)',
            symbol: 'USDT',
            icon: DollarSign,
            walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // Same as ETH for ERC-20
            network: 'Ethereum (ERC-20)',
            minDeposit: 10,
            available: true
        }
    ]

    const quickAmounts = [50, 100, 250, 500, 1000]

    const onSubmit = async (data: DepositFormData) => {
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

            if (amount < selectedCrypto.minDeposit) {
                throw new Error(`Minimum deposit amount is ${selectedCrypto.minDeposit} ${selectedCrypto.symbol}`)
            }

            const result = await createDeposit({
                amount,
                currency: data.cryptocurrency,
                paymentMethod: 'CRYPTO'
            })

            setSubmitStatus({
                type: 'success',
                message: `Deposit request created successfully! Please send ${amount} ${selectedCrypto.symbol} to the provided wallet address.`
            })

            reset()

        } catch (error: any) {
            setSubmitStatus({
                type: 'error',
                message: error.message || 'Failed to create deposit request'
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
                    <DollarSign className="w-8 h-8 text-gold-500 mr-3" />
                    <div>
                        <h2 className="text-2xl font-bold text-white">Deposit Funds</h2>
                        <p className="text-gray-400">Add funds to your NexGen account</p>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Deposit Form */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
                >
                    <h3 className="text-xl font-semibold text-white mb-6">Make a Deposit</h3>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Amount Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Deposit Amount (USD)
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="number"
                                    step="0.01"
                                    min="10"
                                    max="10000"
                                    {...register('amount', {
                                        required: 'Amount is required',
                                        min: { value: 10, message: 'Minimum deposit is $10' },
                                        max: { value: 10000, message: 'Maximum deposit is $10,000' }
                                    })}
                                    className="w-full pl-10 pr-4 py-3 bg-navy-900 border border-navy-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                                    placeholder="Enter amount"
                                />
                            </div>
                            {errors.amount && (
                                <p className="mt-1 text-sm text-red-500">{errors.amount.message}</p>
                            )}
                        </div>

                        {/* Quick Amount Buttons */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Quick Select
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {quickAmounts.map((amount) => (
                                    <button
                                        key={amount}
                                        type="button"
                                        onClick={() => reset({ amount: amount.toString(), cryptocurrency: selectedCryptocurrency })}
                                        className="px-3 py-2 bg-navy-800 text-gray-300 rounded-lg hover:bg-navy-700 hover:text-white transition-colors text-sm"
                                    >
                                        ${amount}
                                    </button>
                                ))}
                            </div>
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
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                value={crypto.id}
                                                {...register('cryptocurrency', { required: true })}
                                                className="sr-only"
                                            />
                                            <Icon className="w-6 h-6 text-gold-500 mr-3" />
                                            <div className="flex-1">
                                                <div className="font-medium text-white">{crypto.name}</div>
                                                <div className="text-sm text-gray-400">{crypto.walletAddress}</div>
                                                <div className="text-xs text-gold-500 mt-1">Min Deposit: {crypto.minDeposit} {crypto.symbol}</div>
                                            </div>
                                            {selectedCryptocurrency === crypto.id && (
                                                <CheckCircle className="w-5 h-5 text-gold-500" />
                                            )}
                                        </label>
                                    )
                                })}
                            </div>
                            {errors.cryptocurrency && (
                                <p className="mt-1 text-sm text-red-500">Please select a cryptocurrency</p>
                            )}
                        </div>

                        {/* Wallet Address Display */}
                        {selectedCryptocurrency && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
                            >
                                <h4 className="text-lg font-semibold text-white mb-4">Deposit Address</h4>
                                <div className="space-y-4">
                                    {(() => {
                                        const selectedCrypto = cryptocurrencies.find(c => c.id === selectedCryptocurrency)
                                        if (!selectedCrypto) return null

                                        const Icon = selectedCrypto.icon
                                        return (
                                            <div className="flex items-center justify-between p-4 bg-navy-900/50 rounded-lg">
                                                <div className="flex items-center">
                                                    <Icon className="w-8 h-8 text-gold-500 mr-3" />
                                                    <div>
                                                        <div className="text-white font-medium">{selectedCrypto.name} ({selectedCrypto.symbol})</div>
                                                        <div className="text-gray-400 text-sm">{selectedCrypto.network}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })()}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Wallet Address
                                        </label>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="text"
                                                readOnly
                                                value={cryptocurrencies.find(c => c.id === selectedCryptocurrency)?.walletAddress || ''}
                                                className="flex-1 px-4 py-3 bg-navy-900 border border-navy-700 rounded-lg text-white font-mono text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const address = cryptocurrencies.find(c => c.id === selectedCryptocurrency)?.walletAddress
                                                    if (address) {
                                                        navigator.clipboard.writeText(address)
                                                        // Could add a toast notification here
                                                    }
                                                }}
                                                className="px-4 py-3 bg-gold-600 hover:bg-gold-700 text-white rounded-lg transition-colors"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">
                                            Send only {selectedCryptocurrency} to this address. Sending other cryptocurrencies may result in permanent loss.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-semibold rounded-lg hover:from-gold-700 hover:to-gold-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <ArrowRight className="w-5 h-5 mr-2" />
                                    Create Deposit Request
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

                {/* Deposit Information */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="space-y-6"
                >
                    {/* Deposit Summary */}
                    {selectedAmount && (
                        <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20">
                            <h4 className="text-lg font-semibold text-white mb-4">Deposit Summary</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between text-gray-300">
                                    <span>Amount:</span>
                                    <span className="text-white font-medium">{formatCurrency(parseFloat(selectedAmount) || 0)}</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                    <span>Cryptocurrency:</span>
                                    <span className="text-white font-medium">
                                        {cryptocurrencies.find(c => c.id === selectedCryptocurrency)?.name}
                                    </span>
                                </div>
                                <hr className="border-navy-700" />
                                <div className="flex justify-between text-white font-semibold">
                                    <span>Total:</span>
                                    <span>{formatCurrency(parseFloat(selectedAmount) || 0)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Information Cards */}
                    <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20">
                        <h4 className="text-lg font-semibold text-white mb-4">Deposit Information</h4>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                                <div>
                                    <h5 className="text-white font-medium">Instant Processing</h5>
                                    <p className="text-gray-400 text-sm">Card and crypto deposits are processed instantly</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                                <div>
                                    <h5 className="text-white font-medium">Secure Transactions</h5>
                                    <p className="text-gray-400 text-sm">All payments are processed through secure gateways</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <AlertCircle className="w-5 h-5 text-yellow-500 mr-3 mt-0.5" />
                                <div>
                                    <h5 className="text-white font-medium">Bank Transfer Delay</h5>
                                    <p className="text-gray-400 text-sm">Manual transfers may take 2-3 business days</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Minimum/Maximum Deposits */}
                    <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20">
                        <h4 className="text-lg font-semibold text-white mb-4">Deposit Limits</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-500">$10</div>
                                <div className="text-sm text-gray-400">Minimum</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gold-500">$10,000</div>
                                <div className="text-sm text-gray-400">Maximum</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default DepositManagement