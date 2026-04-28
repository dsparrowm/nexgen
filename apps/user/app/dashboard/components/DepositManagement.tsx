"use client"

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    AlertCircle,
    ArrowRight,
    Bitcoin,
    CheckCircle,
    Coins,
    Copy,
    CreditCard,
    DollarSign,
    Loader,
    QrCode,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import QRCode from 'qrcode'
import { createDeposit } from '@/utils/api/transactionApi'
import { formatCurrency } from '@/utils/formatters'

interface DepositFormData {
    amount: string
    cryptocurrency: 'BTC' | 'ETH' | 'USDT' | 'BNB'
}

const PLATFORM_MIN = 10
const PLATFORM_MAX = 10000

const cryptocurrencies = [
    {
        id: 'BTC',
        name: 'Bitcoin',
        symbol: 'BTC',
        icon: Bitcoin,
        walletAddress: 'bc1qv9w4rs7trun9k22wykhtd88vwcql8rt8a3g422',
        network: 'Bitcoin Network',
        minDeposit: 0.0001,
    },
    {
        id: 'ETH',
        name: 'Ethereum',
        symbol: 'ETH',
        icon: CreditCard,
        walletAddress: '0xE9A080c04BbB2467c2f46c3205Bb87C79de65A7E',
        network: 'Ethereum Network',
        minDeposit: 0.001,
    },
    {
        id: 'USDT',
        name: 'Tether (USDT)',
        symbol: 'USDT',
        icon: DollarSign,
        walletAddress: '0xE9A080c04BbB2467c2f46c3205Bb87C79de65A7E',
        network: 'TRON (ERC-20)',
        minDeposit: 10,
    },
    {
        id: 'BNB',
        name: 'BNB',
        symbol: 'BNB',
        icon: Coins,
        walletAddress: '0xE9A080c04BbB2467c2f46c3205Bb87C79de65A7E',
        network: 'BNB Smart Chain (BEP-20)',
        minDeposit: 0.01,
    },
]

const DepositManagement = () => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<{
        type: 'success' | 'error' | null
        message: string
    }>({ type: null, message: '' })
    const [copyStatus, setCopyStatus] = useState<{
        type: 'success' | 'error' | null
        message: string
    }>({ type: null, message: '' })
    const [qrCodeUrl, setQrCodeUrl] = useState('')
    const [isGeneratingQr, setIsGeneratingQr] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
    } = useForm<DepositFormData>({
        defaultValues: {
            cryptocurrency: 'BTC',
            amount: '',
        },
    })

    const selectedAmount = watch('amount')
    const selectedCryptocurrency = watch('cryptocurrency')
    const selectedCrypto = cryptocurrencies.find(c => c.id === selectedCryptocurrency)
    const SelectedCryptoIcon = selectedCrypto?.icon

    const qrPayload = selectedCrypto
        ? selectedCrypto.id === 'BTC'
            ? `bitcoin:${selectedCrypto.walletAddress}?label=${encodeURIComponent('NexGen Deposit')}&message=${encodeURIComponent(selectedCrypto.network)}`
            : selectedCrypto.walletAddress
        : ''

    useEffect(() => {
        let isMounted = true

        const generateQrCode = async () => {
            if (!qrPayload) {
                setQrCodeUrl('')
                return
            }

            setIsGeneratingQr(true)

            try {
                const url = await QRCode.toDataURL(qrPayload, {
                    errorCorrectionLevel: 'M',
                    margin: 1,
                    width: 220,
                    color: {
                        dark: '#0f172a',
                        light: '#ffffff',
                    },
                })

                if (isMounted) {
                    setQrCodeUrl(url)
                }
            } catch (error) {
                console.error('Failed to generate QR code:', error)
                if (isMounted) {
                    setQrCodeUrl('')
                }
            } finally {
                if (isMounted) {
                    setIsGeneratingQr(false)
                }
            }
        }

        void generateQrCode()

        return () => {
            isMounted = false
        }
    }, [qrPayload])

    const quickAmounts = [50, 100, 250, 500, 1000]

    const copyToClipboard = async (text: string) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text)
            } else {
                const textArea = document.createElement('textarea')
                textArea.value = text
                textArea.style.position = 'fixed'
                textArea.style.left = '-999999px'
                textArea.style.top = '-999999px'
                document.body.appendChild(textArea)
                textArea.focus()
                textArea.select()

                const successful = document.execCommand('copy')
                textArea.remove()

                if (!successful) {
                    throw new Error('Copy command was unsuccessful')
                }
            }

            setCopyStatus({
                type: 'success',
                message: 'Address copied to clipboard!'
            })

            setTimeout(() => {
                setCopyStatus({ type: null, message: '' })
            }, 3000)
        } catch (error) {
            console.error('Failed to copy text:', error)
            setCopyStatus({
                type: 'error',
                message: 'Failed to copy address. Please copy manually.'
            })

            setTimeout(() => {
                setCopyStatus({ type: null, message: '' })
            }, 5000)
        }
    }

    const onSubmit = async (data: DepositFormData) => {
        setIsSubmitting(true)
        setSubmitStatus({ type: null, message: '' })

        try {
            const amount = Number.parseFloat(data.amount)

            if (!Number.isFinite(amount) || amount <= 0) {
                throw new Error('Please enter a valid amount')
            }

            if (amount < PLATFORM_MIN) {
                throw new Error(`Minimum deposit request is $${PLATFORM_MIN}`)
            }

            if (amount > PLATFORM_MAX) {
                throw new Error(`Maximum deposit request is $${PLATFORM_MAX.toLocaleString()}`)
            }

            const crypto = cryptocurrencies.find(c => c.id === data.cryptocurrency)
            if (!crypto) {
                throw new Error('Please select a cryptocurrency')
            }

            const result = await createDeposit({
                amount,
                currency: data.cryptocurrency,
                paymentMethod: 'CRYPTO',
            })

            const reference = result.success && result.data
                ? (result.data as any).reference || (result.data as any).id
                : null

            setSubmitStatus({
                type: 'success',
                message: reference
                    ? `Deposit request ${reference} created successfully. Use the destination details below and send only ${crypto.symbol} on ${crypto.network}.`
                    : `Deposit request created successfully. Use the destination details below and send only ${crypto.symbol} on ${crypto.network}.`,
            })
        } catch (error: any) {
            setSubmitStatus({
                type: 'error',
                message: error?.message || 'Failed to create deposit request'
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm"
            >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="rounded-2xl bg-gold-500/10 p-3">
                            <DollarSign className="h-7 w-7 text-gold-500" />
                        </div>
                        <div>
                            <div className="mb-2 flex flex-wrap gap-2">
                                <span className="rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-400">
                                    Step 1 · Create request
                                </span>
                                <span className="rounded-full border border-navy-700 bg-navy-900/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-300">
                                    Crypto deposit
                                </span>
                                <span className="rounded-full border border-navy-700 bg-navy-900/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-300">
                                    Min ${PLATFORM_MIN}
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Deposit Funds</h2>
                            <p className="mt-1 max-w-2xl text-sm text-gray-400">
                                Create a deposit request, review the destination details, and copy the wallet address before sending.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className="rounded-2xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm"
                >
                    <h3 className="mb-2 text-xl font-semibold text-white">Deposit request</h3>
                    <p className="mb-6 text-sm text-gray-400">
                        Enter your requested deposit amount in USD, then choose the destination asset and network.
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-300">
                                Deposit amount (USD)
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="number"
                                    step="0.01"
                                    min={PLATFORM_MIN}
                                    max={PLATFORM_MAX}
                                    {...register('amount', {
                                        required: 'Amount is required',
                                        min: { value: PLATFORM_MIN, message: `Minimum deposit request is $${PLATFORM_MIN}` },
                                        max: { value: PLATFORM_MAX, message: `Maximum deposit request is $${PLATFORM_MAX.toLocaleString()}` }
                                    })}
                                    className="w-full rounded-lg border border-navy-700 bg-navy-900 py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gold-500"
                                    placeholder="Enter amount"
                                />
                            </div>
                            {errors.amount && (
                                <p className="mt-1 text-sm text-red-500">{errors.amount.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-300">
                                Quick select
                            </label>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                                {quickAmounts.map((amount) => (
                                    <button
                                        key={amount}
                                        type="button"
                                        onClick={() => {
                                            setValue('amount', amount.toString(), {
                                                shouldValidate: true,
                                                shouldDirty: true,
                                            })
                                        }}
                                        className="rounded-lg bg-navy-800 px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-navy-700 hover:text-white"
                                    >
                                        ${amount}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="mb-4 block text-sm font-medium text-gray-300">
                                Destination asset
                            </label>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {cryptocurrencies.map((crypto) => {
                                    const Icon = crypto.icon

                                    return (
                                        <label
                                            key={crypto.id}
                                            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${selectedCryptocurrency === crypto.id
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

                                            <div className="rounded-lg bg-navy-800 p-2">
                                                <Icon className="h-5 w-5 text-gold-500" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-medium text-white">{crypto.name}</div>
                                                    {selectedCryptocurrency === crypto.id && (
                                                        <CheckCircle className="h-4 w-4 text-gold-500" />
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-400">{crypto.network}</div>
                                                <div className="mt-1 text-xs text-gray-500">
                                                    Destination details will update automatically when selected.
                                                </div>
                                            </div>
                                        </label>
                                    )
                                })}
                            </div>

                            {errors.cryptocurrency && (
                                <p className="mt-1 text-sm text-red-500">Please select a cryptocurrency</p>
                            )}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={isSubmitting}
                            className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 px-6 py-3 font-semibold text-white transition-all hover:from-gold-700 hover:to-gold-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader className="mr-2 h-5 w-5 animate-spin" />
                                    Creating request...
                                </>
                            ) : (
                                <>
                                    <ArrowRight className="mr-2 h-5 w-5" />
                                    Create Deposit Request
                                </>
                            )}
                        </motion.button>

                        {submitStatus.type && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`rounded-lg border p-4 ${submitStatus.type === 'success'
                                    ? 'border-green-500/30 bg-green-500/10'
                                    : 'border-red-500/30 bg-red-500/10'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    {submitStatus.type === 'success' ? (
                                        <CheckCircle className="mt-0.5 h-5 w-5 text-green-400" />
                                    ) : (
                                        <AlertCircle className="mt-0.5 h-5 w-5 text-red-400" />
                                    )}
                                    <p
                                        className={`text-sm ${submitStatus.type === 'success'
                                            ? 'text-green-300'
                                            : 'text-red-300'
                                            }`}
                                    >
                                        {submitStatus.message}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </form>
                </motion.div>

                <div className="space-y-6 lg:sticky lg:top-6 self-start">
                    {selectedAmount && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="rounded-2xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm"
                        >
                            <h4 className="mb-4 text-lg font-semibold text-white">Review</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Requested amount</span>
                                    <span className="font-medium text-white">
                                        {formatCurrency(Number.parseFloat(selectedAmount) || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Destination asset</span>
                                    <span className="font-medium text-white">
                                        {selectedCrypto?.name} ({selectedCrypto?.symbol})
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Network</span>
                                    <span className="font-medium text-white">{selectedCrypto?.network}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Network minimum</span>
                                    <span className="font-medium text-white">
                                        {selectedCrypto?.minDeposit} {selectedCrypto?.symbol}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Platform limit</span>
                                    <span className="font-medium text-white">
                                        ${PLATFORM_MIN} - ${PLATFORM_MAX.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="rounded-2xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h4 className="text-lg font-semibold text-white">Deposit destination</h4>
                            {selectedCrypto && (
                                <span className="rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-400">
                                    {selectedCrypto.network}
                                </span>
                            )}
                        </div>

                        <div className="space-y-5">
                            {selectedCrypto && (
                                <div className="flex items-center gap-3 rounded-xl bg-navy-900/50 p-4">
                                    {SelectedCryptoIcon && (
                                        <SelectedCryptoIcon className="h-7 w-7 text-gold-500" />
                                    )}
                                    <div>
                                        <div className="font-medium text-white">
                                            {selectedCrypto.name} ({selectedCrypto.symbol})
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            Use the network above exactly as shown.
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                                <div className="flex flex-col items-center justify-center rounded-xl border border-gold-500/20 bg-navy-900/60 p-4">
                                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-300">
                                        <QrCode className="h-4 w-4 text-gold-500" />
                                        Scan QR code
                                    </div>

                                    <div className="flex h-[220px] w-[220px] items-center justify-center rounded-lg bg-white p-3">
                                        {isGeneratingQr ? (
                                            <div className="flex flex-col items-center gap-2 text-gray-500">
                                                <Loader className="h-6 w-6 animate-spin text-gold-500" />
                                                <span className="text-xs">Generating QR...</span>
                                            </div>
                                        ) : qrCodeUrl ? (
                                            <img
                                                src={qrCodeUrl}
                                                alt={`${selectedCrypto?.name || 'Deposit'} wallet QR code`}
                                                className="h-full w-full object-contain"
                                            />
                                        ) : (
                                            <div className="text-center text-xs text-gray-500">
                                                QR code unavailable
                                            </div>
                                        )}
                                    </div>

                                    <p className="mt-3 text-center text-xs leading-relaxed text-gray-400">
                                        {selectedCrypto?.id === 'BTC'
                                            ? 'Bitcoin wallets can open this as a payment request. If your wallet does not support it, use the address below.'
                                            : 'Scan the address below with a wallet that supports the selected network.'}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-300">
                                        Wallet address
                                    </label>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={selectedCrypto?.walletAddress || ''}
                                            className="min-w-0 flex-1 rounded-lg border border-navy-700 bg-navy-900 px-4 py-3 font-mono text-sm text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const address = selectedCrypto?.walletAddress
                                                if (address) {
                                                    copyToClipboard(address)
                                                }
                                            }}
                                            className="inline-flex items-center rounded-lg bg-gold-600 px-4 py-3 text-white transition-colors hover:bg-gold-700"
                                        >
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy
                                        </button>
                                    </div>

                                    <p className="text-xs leading-relaxed text-gray-400">
                                        Send only {selectedCrypto?.symbol} on {selectedCrypto?.network}. Sending the wrong asset or network may result in permanent loss.
                                    </p>

                                    <ul className="space-y-2 pt-2 text-xs text-gray-400">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="mt-0.5 h-3.5 w-3.5 text-green-400" />
                                            Copy the address before leaving this page.
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="mt-0.5 h-3.5 w-3.5 text-green-400" />
                                            Verify the network in your wallet before sending.
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 text-yellow-400" />
                                            Minimum network deposit rules apply.
                                        </li>
                                    </ul>

                                    {copyStatus.type && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`rounded-lg p-3 text-xs flex items-center ${copyStatus.type === 'success'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-red-500/20 text-red-400'
                                                }`}
                                        >
                                            {copyStatus.type === 'success' ? (
                                                <CheckCircle className="mr-2 h-3 w-3" />
                                            ) : (
                                                <AlertCircle className="mr-2 h-3 w-3" />
                                            )}
                                            {copyStatus.message}
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="rounded-2xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm"
                    >
                        <h4 className="mb-4 text-lg font-semibold text-white">Before you send</h4>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="mt-0.5 h-5 w-5 text-green-400" />
                                <div>
                                    <h5 className="font-medium text-white">Match the network exactly</h5>
                                    <p className="text-sm text-gray-400">
                                        Make sure your wallet network matches the one selected above.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <CheckCircle className="mt-0.5 h-5 w-5 text-green-400" />
                                <div>
                                    <h5 className="font-medium text-white">Use the exact address</h5>
                                    <p className="text-sm text-gray-400">
                                        Copy the deposit address directly from this page to avoid mistakes.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-400" />
                                <div>
                                    <h5 className="font-medium text-white">Confirm minimums</h5>
                                    <p className="text-sm text-gray-400">
                                        Network-specific minimums may apply depending on the asset and wallet used.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

export default DepositManagement
