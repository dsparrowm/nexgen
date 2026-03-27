"use client"

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowRight,
    AlertCircle,
    CheckCircle,
    Loader,
    Wallet,
    TrendingUp,
    PieChart as PieChartIcon,
    Eye,
    EyeOff,
    RefreshCw,
    Bitcoin,
    Coins,
} from 'lucide-react'
import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from 'recharts'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useAssetData } from '@/hooks/useAssetData'
import {
    ASSET_COLORS,
    type SupportedAssetSymbol,
} from '@/utils/api/assetsApi'
import { formatCurrency, formatCrypto, formatPercentage } from '@/utils/formatters'

const assetIcons: Record<SupportedAssetSymbol, React.ComponentType<{ className?: string }>> = {
    BTC: Bitcoin,
    ETH: Coins,
    USDT: Wallet,
    BNB: TrendingUp,
}

const investmentHighlights = [
    {
        title: 'Balanced exposure',
        text: 'Build positions across the four supported crypto assets without touching mining.',
    },
    {
        title: 'Balance-aware buying',
        text: 'Every purchase is validated against your NexGen cash balance before submission.',
    },
    {
        title: 'Asset-first portfolio',
        text: 'Holdings, allocation, and performance are shown per asset symbol instead of mining plan.',
    },
]

const InvestmentManagement = () => {
    const [showBalance, setShowBalance] = useState(true)
    const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<SupportedAssetSymbol>('BTC')
    const [amount, setAmount] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [actionError, setActionError] = useState<string | null>(null)
    const [actionSuccess, setActionSuccess] = useState<string | null>(null)

    const {
        data,
        loading: dashboardLoading,
        error: dashboardError,
        refetch: refetchDashboard,
    } = useDashboardData()

    const {
        supportedAssets,
        assetPositions,
        assetSummary,
        loading: assetLoading,
        error: assetError,
        purchaseAsset,
        refetch: refetchAssets,
    } = useAssetData()

    useEffect(() => {
        if (supportedAssets.length > 0 && !supportedAssets.some((asset) => asset.symbol === selectedAssetSymbol)) {
            setSelectedAssetSymbol(supportedAssets[0]?.symbol || 'BTC')
        }
    }, [supportedAssets, selectedAssetSymbol])

    const availableBalance = Number(data?.user?.balance || 0)
    const selectedAsset = supportedAssets.find((asset) => asset.symbol === selectedAssetSymbol) || supportedAssets[0]
    const purchaseAmount = Number(amount || 0)
    const estimatedUnits =
        selectedAsset && selectedAsset.currentPrice > 0 ? purchaseAmount / selectedAsset.currentPrice : 0
    const canBuy =
        Boolean(selectedAsset) &&
        Number(selectedAsset?.currentPrice || 0) > 0 &&
        purchaseAmount > 0 &&
        purchaseAmount >= Number(selectedAsset?.minPurchase || 0) &&
        purchaseAmount <= availableBalance &&
        !isSubmitting

    const handlePurchase = async () => {
        if (!selectedAsset || !canBuy) return

        setIsSubmitting(true)
        setActionError(null)
        setActionSuccess(null)

        try {
            await purchaseAsset({
                assetSymbol: selectedAsset.symbol,
                amount: purchaseAmount,
            })

            setActionSuccess(`Purchased ${selectedAsset.name} successfully.`)
            setAmount('')
            await Promise.all([refetchAssets(), refetchDashboard()])

            setTimeout(() => setActionSuccess(null), 3500)
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Failed to purchase asset')
        } finally {
            setIsSubmitting(false)
        }
    }

    const portfolioPieData = assetSummary.allocations.length > 0
        ? assetSummary.allocations
        : supportedAssets.map((asset) => ({
              symbol: asset.symbol,
              name: asset.name,
              value: asset.symbol === 'USDT' ? 1 : 0,
              percentage: 0,
              color: ASSET_COLORS[asset.symbol],
          }))

    return (
        <div className="space-y-6">
            <AnimatePresence>
                {dashboardError && (
                    <motion.div
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300"
                    >
                        {dashboardError}
                    </motion.div>
                )}

                {assetError && (
                    <motion.div
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-200"
                    >
                        {assetError}
                    </motion.div>
                )}

                {actionSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-300"
                    >
                        {actionSuccess}
                    </motion.div>
                )}

                {actionError && (
                    <motion.div
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300"
                    >
                        {actionError}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-3xl border border-gold-500/20 bg-dark-800/60 p-6 backdrop-blur-sm"
            >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
                            Crypto assets
                        </div>
                        <h2 className="text-3xl font-bold text-white">Buy BTC, ETH, USDT, and BNB</h2>
                        <p className="mt-3 max-w-xl text-sm text-gray-300">
                            This page is now asset-first. Mining remains on its own route, while crypto purchases, balances, and portfolio allocation are handled here.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowBalance((prev) => !prev)}
                        className="inline-flex items-center gap-2 self-start rounded-xl border border-gold-500/20 bg-navy-900/60 px-4 py-2 text-sm text-gray-300 transition-colors hover:text-white"
                    >
                        {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        {showBalance ? 'Hide balance' : 'Show balance'}
                    </button>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
            >
                {[
                    {
                        title: 'Asset invested',
                        value: showBalance ? formatCurrency(assetSummary.totalInvested) : '****',
                        helper: `${assetSummary.activePositions} active positions`,
                        icon: Wallet,
                        color: 'text-green-500',
                        bg: 'bg-green-500/10',
                    },
                    {
                        title: 'Current value',
                        value: showBalance ? formatCurrency(assetSummary.currentValue) : '****',
                        helper: 'Live portfolio value',
                        icon: TrendingUp,
                        color: 'text-blue-500',
                        bg: 'bg-blue-500/10',
                    },
                    {
                        title: 'Unrealized PnL',
                        value: showBalance ? formatCurrency(assetSummary.unrealizedPnL) : '****',
                        helper: formatPercentage(assetSummary.unrealizedPnLPercent, { showSign: true }),
                        icon: PieChartIcon,
                        color: 'text-gold-500',
                        bg: 'bg-gold-500/10',
                    },
                    {
                        title: 'Available balance',
                        value: showBalance ? formatCurrency(availableBalance) : '****',
                        helper: 'Ready to deploy',
                        icon: RefreshCw,
                        color: 'text-purple-500',
                        bg: 'bg-purple-500/10',
                    },
                ].map((stat) => (
                    <div
                        key={stat.title}
                        className="rounded-2xl border border-gold-500/20 bg-dark-800/50 p-5 backdrop-blur-sm"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <div className={`rounded-xl ${stat.bg} p-3`}>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                        </div>
                        <p className="text-sm text-gray-400">{stat.title}</p>
                        <p className="mt-1 text-2xl font-bold text-white">{stat.value}</p>
                        <p className="mt-1 text-sm text-gray-500">{stat.helper}</p>
                    </div>
                ))}
            </motion.div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <motion.div
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="rounded-3xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm"
                >
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-white">Buy assets</h3>
                            <p className="text-sm text-gray-400">Choose a symbol and invest from your available balance.</p>
                        </div>
                        <button
                            onClick={() => refetchAssets()}
                            className="rounded-lg border border-gold-500/20 bg-navy-900/40 p-2 text-gray-400 transition-colors hover:text-white"
                        >
                            <RefreshCw className={`h-4 w-4 ${assetLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {supportedAssets.map((asset) => {
                            const Icon = assetIcons[asset.symbol]
                            const isSelected = selectedAssetSymbol === asset.symbol

                            return (
                                <button
                                    key={asset.symbol}
                                    type="button"
                                    onClick={() => setSelectedAssetSymbol(asset.symbol)}
                                    className={`rounded-2xl border p-4 text-left transition-all ${
                                        isSelected
                                            ? 'border-gold-500 bg-gold-500/10'
                                            : 'border-navy-700 bg-navy-900/50 hover:border-gold-500/30'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="rounded-xl bg-black/20 p-2">
                                            <Icon className="h-4 w-4 text-gold-400" />
                                        </div>
                                        {isSelected && <CheckCircle className="h-4 w-4 text-gold-400" />}
                                    </div>
                                    <p className="mt-4 text-sm font-semibold text-white">{asset.symbol}</p>
                                    <p className="text-xs text-gray-400">{asset.name}</p>
                                </button>
                            )
                        })}
                    </div>

                    <div className="mt-6 rounded-2xl border border-gold-500/20 bg-navy-900/40 p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-400">Selected asset</p>
                                <h4 className="text-2xl font-bold text-white">
                                    {selectedAsset?.name || 'Asset'}
                                </h4>
                                <p className="mt-1 text-sm text-gray-400">
                                    {selectedAsset?.network || 'Network details pending'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-400">Price</p>
                                <p className="text-lg font-semibold text-white">
                                    {selectedAsset?.currentPrice && selectedAsset.currentPrice > 0
                                        ? formatCurrency(selectedAsset.currentPrice)
                                        : 'Price pending'}
                                </p>
                                <p className="text-sm text-gray-400">
                                    {formatPercentage(selectedAsset?.priceChange24h || 0, { showSign: true })}
                                    {' '}24h
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-300">
                                    Investment amount (USD)
                                </label>
                                <input
                                    type="number"
                                    min={selectedAsset?.minPurchase || 0}
                                    step="0.01"
                                    value={amount}
                                    onChange={(event) => setAmount(event.target.value)}
                                    className="w-full rounded-xl border border-navy-700 bg-navy-900/70 px-4 py-3 text-white outline-none transition-colors focus:border-gold-500"
                                    placeholder="Enter amount"
                                />
                                <p className="mt-2 text-xs text-gray-400">
                                    Minimum purchase: {formatCurrency(selectedAsset?.minPurchase || 0)}
                                </p>
                            </div>

                            <div className="rounded-xl border border-navy-700 bg-navy-900/50 p-4">
                                <p className="text-sm text-gray-400">Estimated units</p>
                                <p className="mt-2 text-2xl font-bold text-white">
                                    {selectedAsset?.currentPrice && selectedAsset.currentPrice > 0
                                        ? formatCrypto(estimatedUnits, {
                                              symbol: selectedAsset.symbol,
                                              decimals: selectedAsset.symbol === 'USDT' ? 2 : 6,
                                          })
                                        : 'Awaiting price'}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">Based on the current quote.</p>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={handlePurchase}
                                disabled={!canBuy}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 px-5 py-3 font-semibold text-navy-900 transition-all hover:from-gold-500 hover:to-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader className="h-4 w-4 animate-spin" />
                                        Processing
                                    </>
                                ) : (
                                    <>
                                        Buy {selectedAsset?.symbol || 'asset'}
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => refetchAssets()}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold-500/20 px-5 py-3 text-gray-300 transition-colors hover:text-white"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Refresh portfolio
                            </button>
                        </div>

                        {actionError && (
                            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                                {actionError}
                            </div>
                        )}

                        {actionSuccess && (
                            <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
                                {actionSuccess}
                            </div>
                        )}

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            {investmentHighlights.map((item) => (
                                <div key={item.title} className="rounded-xl border border-navy-700 bg-navy-900/40 p-4">
                                    <p className="text-sm font-semibold text-white">{item.title}</p>
                                    <p className="mt-1 text-xs leading-5 text-gray-400">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="rounded-3xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm"
                >
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-white">Portfolio allocation</h3>
                            <p className="text-sm text-gray-400">Asset allocation based on live positions.</p>
                        </div>
                        <button
                            onClick={() => refetchAssets()}
                            className="rounded-lg border border-gold-500/20 bg-navy-900/40 p-2 text-gray-400 transition-colors hover:text-white"
                        >
                            <RefreshCw className={`h-4 w-4 ${assetLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {assetSummary.allocations.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={portfolioPieData}
                                        dataKey="value"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={56}
                                        outerRadius={86}
                                        paddingAngle={2}
                                    >
                                        {portfolioPieData.map((entry) => (
                                            <Cell key={entry.symbol} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#111827',
                                            border: '1px solid rgba(245, 158, 11, 0.3)',
                                            borderRadius: '12px',
                                            color: '#fff',
                                        }}
                                        formatter={(value: number) => [formatCurrency(value), 'Value']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>

                            <div className="mt-4 space-y-3">
                                {assetSummary.allocations.map((item) => (
                                    <div
                                        key={item.symbol}
                                        className="flex items-center justify-between rounded-2xl border border-navy-700 bg-navy-900/40 px-4 py-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                            <div>
                                                <p className="font-medium text-white">{item.name}</p>
                                                <p className="text-xs text-gray-400">{item.symbol}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-white">{formatCurrency(item.value)}</p>
                                            <p className="text-xs text-gray-400">{item.percentage.toFixed(1)}%</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-gold-500/20 bg-navy-900/30 text-center">
                            <PieChartIcon className="mb-4 h-12 w-12 text-gray-500" />
                            <p className="text-white">No positions yet</p>
                            <p className="mt-2 max-w-sm text-sm text-gray-400">
                                Buy one of the supported assets to see your allocation chart and asset-specific performance here.
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="rounded-3xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm"
            >
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white">Supported assets</h3>
                        <p className="text-sm text-gray-400">Prices, minimum purchases, and networks are driven by the asset catalog.</p>
                    </div>
                    <button
                        onClick={() => refetchAssets()}
                        className="rounded-lg border border-gold-500/20 bg-navy-900/40 p-2 text-gray-400 transition-colors hover:text-white"
                    >
                        <RefreshCw className={`h-4 w-4 ${assetLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {supportedAssets.map((asset) => {
                        const isSelected = selectedAssetSymbol === asset.symbol
                        const Icon = assetIcons[asset.symbol]

                        return (
                            <button
                                key={asset.symbol}
                                type="button"
                                onClick={() => setSelectedAssetSymbol(asset.symbol)}
                                className={`rounded-2xl border p-5 text-left transition-all ${
                                    isSelected
                                        ? 'border-gold-500 bg-gold-500/10'
                                        : 'border-navy-700 bg-navy-900/40 hover:border-gold-500/30'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="rounded-xl bg-black/20 p-3">
                                        <Icon className="h-5 w-5 text-gold-400" />
                                    </div>
                                    {isSelected && <CheckCircle className="h-5 w-5 text-gold-400" />}
                                </div>

                                <div className="mt-4">
                                    <p className="text-lg font-bold text-white">{asset.name}</p>
                                    <p className="text-sm text-gray-400">{asset.symbol}</p>
                                </div>

                                <div className="mt-4 space-y-2 text-sm">
                                    <div className="flex items-center justify-between text-gray-300">
                                        <span>Price</span>
                                        <span className="text-white">
                                            {asset.currentPrice > 0 ? formatCurrency(asset.currentPrice) : 'Pending'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-gray-300">
                                        <span>24h</span>
                                        <span className={Number(asset.priceChange24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}>
                                            {formatPercentage(asset.priceChange24h || 0, { showSign: true })}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-gray-300">
                                        <span>Min</span>
                                        <span className="text-white">{formatCurrency(asset.minPurchase || 0)}</span>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="rounded-3xl border border-gold-500/20 bg-dark-800/50 p-6 backdrop-blur-sm"
            >
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white">Current positions</h3>
                        <p className="text-sm text-gray-400">Track value, units, and performance per asset.</p>
                    </div>
                    <button
                        onClick={() => refetchAssets()}
                        className="rounded-lg border border-gold-500/20 bg-navy-900/40 p-2 text-gray-400 transition-colors hover:text-white"
                    >
                        <RefreshCw className={`h-4 w-4 ${assetLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {assetPositions.length > 0 ? (
                    <div className="space-y-3">
                        {assetPositions.map((position) => {
                            const currentValue = Number(
                                position.currentValue ??
                                    (position.unitsHeld && position.currentPrice ? position.unitsHeld * position.currentPrice : 0)
                            )
                            const pnl = Number(position.unrealizedPnL ?? currentValue - Number(position.amountInvested || 0))
                            const pnlPercent = Number(
                                position.unrealizedPnLPercent ??
                                    (Number(position.amountInvested || 0) > 0 ? (pnl / Number(position.amountInvested || 0)) * 100 : 0)
                            )

                            return (
                                <div
                                    key={position.id}
                                    className="rounded-2xl border border-navy-700 bg-navy-900/40 p-4"
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-lg font-semibold text-white">
                                                    {position.assetName || position.assetSymbol}
                                                </p>
                                                <span className="rounded-full border border-gold-500/20 bg-gold-500/10 px-2 py-0.5 text-xs font-semibold text-gold-400">
                                                    {position.assetSymbol}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-400">
                                                {position.unitsHeld > 0
                                                    ? formatCrypto(position.unitsHeld, {
                                                          symbol: position.assetSymbol,
                                                          decimals: position.assetSymbol === 'USDT' ? 2 : 6,
                                                      })
                                                    : '0'}
                                                {' '}held
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                            <div>
                                                <p className="text-xs text-gray-400">Invested</p>
                                                <p className="mt-1 font-semibold text-white">
                                                    {formatCurrency(position.amountInvested)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400">Value</p>
                                                <p className="mt-1 font-semibold text-white">
                                                    {formatCurrency(currentValue)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400">PnL</p>
                                                <p className={`mt-1 font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {formatCurrency(pnl)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400">Return</p>
                                                <p className={`mt-1 font-semibold ${pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {formatPercentage(pnlPercent, { showSign: true })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gold-500/20 bg-navy-900/30 py-12 text-center">
                        <Wallet className="mb-4 h-12 w-12 text-gray-500" />
                        <p className="text-white">No positions yet</p>
                        <p className="mt-2 max-w-md text-sm text-gray-400">
                            Buy an asset above to create your first crypto position and start building allocation.
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    )
}

export default InvestmentManagement
