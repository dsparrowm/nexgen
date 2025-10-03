"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Zap,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Clock,
    Activity,
    DollarSign,
    BarChart3,
    RefreshCw,
    AlertTriangle,
    Loader2,
    Shield,
    Target,
    Plus,
    X
} from 'lucide-react'
import { useMiningData } from '@/hooks/useMiningData'
import {
    getRiskLevelColor,
    getInvestmentStatusColor,
    type MiningOperation as MiningOperationType
} from '@/utils/api/miningApi'
import { formatCurrency, formatPercentage, formatDate } from '@/utils/api/formatters'

const MiningManagement = () => {
    const {
        investments,
        investmentSummary,
        operations,
        stats,
        loading,
        investmentsLoading,
        operationsLoading,
        investmentsError,
        operationsError,
        refetch,
        refetchInvestments,
        refetchOperations,
        startOperation,
        stopOperation,
    } = useMiningData();

    const [selectedOperation, setSelectedOperation] = useState<MiningOperationType | null>(null)
    const [investmentAmount, setInvestmentAmount] = useState('')
    const [showInvestmentModal, setShowInvestmentModal] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [actionError, setActionError] = useState<string | null>(null)

    // Handle investment modal
    const handleStartInvestment = (operation: MiningOperationType) => {
        setSelectedOperation(operation)
        setInvestmentAmount('')
        setActionError(null)
        setShowInvestmentModal(true)
    }

    const handleConfirmInvestment = async () => {
        if (!selectedOperation || !investmentAmount) {
            setActionError('Please enter an investment amount')
            return
        }

        const amount = parseFloat(investmentAmount)
        if (isNaN(amount) || amount < Number(selectedOperation.minInvestment) || amount > Number(selectedOperation.maxInvestment)) {
            setActionError(`Amount must be between ${formatCurrency(selectedOperation.minInvestment)} and ${formatCurrency(selectedOperation.maxInvestment)}`)
            return
        }

        setActionLoading(true)
        setActionError(null)

        const result = await startOperation(selectedOperation.id, amount)

        setActionLoading(false)

        if (result.success) {
            setShowInvestmentModal(false)
            setSelectedOperation(null)
            setInvestmentAmount('')
        } else {
            setActionError(result.error || 'Failed to start investment')
        }
    }

    const handleStopInvestment = async (investmentId: string) => {
        if (!confirm('Are you sure you want to stop this mining operation?')) {
            return
        }

        setActionLoading(true)
        const result = await stopOperation(investmentId)
        setActionLoading(false)

        if (!result.success) {
            alert(result.error || 'Failed to stop investment')
        }
    }

    // Loading skeleton
    const SkeletonCard = () => (
        <div className="bg-navy-800/50 rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-gray-700 rounded w-3/4"></div>
        </div>
    )

    return (
        <div className="space-y-6">
            {/* Investment Summary */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Mining Operations</h2>
                    <button
                        onClick={refetch}
                        disabled={loading}
                        className="flex items-center px-4 py-2 bg-gold-500/20 text-gold-500 rounded-lg hover:bg-gold-500/30 disabled:opacity-50 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Error State */}
                {(investmentsError || operationsError) && (
                    <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                        <div className="flex items-start">
                            <AlertTriangle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-red-500 font-semibold mb-1">Error Loading Data</h3>
                                <p className="text-red-300 text-sm">{investmentsError || operationsError}</p>
                                <button
                                    onClick={refetch}
                                    className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {investmentsLoading ? (
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    ) : (
                        <>
                            <div className="bg-navy-800/50 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <DollarSign className="w-5 h-5 text-blue-500" />
                                    <span className="text-blue-500 text-sm">Invested</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{formatCurrency(investmentSummary.totalInvested)}</p>
                                <p className="text-gray-400 text-sm">{investmentSummary.activeCount} active {investmentSummary.activeCount === 1 ? 'operation' : 'operations'}</p>
                            </div>

                            <div className="bg-navy-800/50 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <TrendingUp className="w-5 h-5 text-green-500" />
                                    <span className="text-green-500 text-sm">Earnings</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{formatCurrency(investmentSummary.totalEarnings)}</p>
                                <p className="text-gray-400 text-sm">Total earned</p>
                            </div>

                            <div className="bg-navy-800/50 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <BarChart3 className="w-5 h-5 text-gold-500" />
                                    <span className="text-gold-500 text-sm">ROI</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{formatPercentage(investmentSummary.roi)}</p>
                                <p className="text-gray-400 text-sm">Return on investment</p>
                            </div>

                            <div className="bg-navy-800/50 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <Activity className="w-5 h-5 text-purple-500" />
                                    <span className="text-purple-500 text-sm">Avg Return</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{formatPercentage(investmentSummary.averageDailyReturn * 100)}</p>
                                <p className="text-gray-400 text-sm">Daily average</p>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>

            {/* Active Investments */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Active Investments</h3>
                    <span className="text-sm text-gray-400">{investments.length} {investments.length === 1 ? 'investment' : 'investments'}</span>
                </div>

                {investmentsLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-navy-800/50 rounded-xl p-4 animate-pulse">
                                <div className="h-6 bg-gray-700 rounded w-1/3 mb-3"></div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="h-4 bg-gray-700 rounded"></div>
                                    <div className="h-4 bg-gray-700 rounded"></div>
                                    <div className="h-4 bg-gray-700 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : investments.length === 0 ? (
                    <div className="text-center py-12">
                        <Zap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg mb-2">No active investments</p>
                        <p className="text-gray-500 text-sm">Start investing in mining operations below</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {investments.map((investment) => {
                            const statusColor = getInvestmentStatusColor(investment.status)
                            const daysRemaining = Math.ceil(
                                (new Date(investment.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                            )

                            return (
                                <div key={investment.id} className="bg-navy-800/50 rounded-xl p-4 border border-gold-500/10 hover:border-gold-500/30 transition-all">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="text-white font-semibold text-lg">{investment.miningOperation.name}</h4>
                                            <p className="text-gray-400 text-sm">{investment.miningOperation.description}</p>
                                        </div>
                                        <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColor.text} ${statusColor.bg}`}>
                                            {investment.status}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div>
                                            <p className="text-gray-400 text-xs mb-1">Invested</p>
                                            <p className="text-white font-semibold">{formatCurrency(investment.amount)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs mb-1">Current Earnings</p>
                                            <p className="text-green-500 font-semibold">{formatCurrency(investment.currentEarnings)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs mb-1">Daily Return</p>
                                            <p className="text-gold-500 font-semibold">{formatPercentage(investment.dailyReturn * 100)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs mb-1">Performance</p>
                                            <p className="text-white font-semibold">{formatPercentage(investment.performance)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                                        <div className="flex items-center text-sm text-gray-400">
                                            <Clock className="w-4 h-4 mr-1" />
                                            {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Completed'}
                                        </div>
                                        {investment.status === 'ACTIVE' && (
                                            <button
                                                onClick={() => handleStopInvestment(investment.id)}
                                                disabled={actionLoading}
                                                className="px-4 py-1 bg-red-600/20 text-red-500 rounded-lg hover:bg-red-600/30 disabled:opacity-50 transition-colors text-sm"
                                            >
                                                Stop Operation
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </motion.div>

            {/* Available Mining Operations */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Available Mining Operations</h3>
                    <button
                        onClick={refetchOperations}
                        disabled={operationsLoading}
                        className="text-sm text-gold-500 hover:text-gold-400 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${operationsLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {operationsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-navy-800/50 rounded-xl p-6 animate-pulse">
                                <div className="h-6 bg-gray-700 rounded w-2/3 mb-4"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-700 rounded"></div>
                                    <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                                    <div className="h-4 bg-gray-700 rounded w-4/6"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : operations.length === 0 ? (
                    <div className="text-center py-12">
                        <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg mb-2">No operations available</p>
                        <p className="text-gray-500 text-sm">Check back later for new opportunities</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {operations.map((operation) => {
                            const riskColor = getRiskLevelColor(operation.riskLevel)
                            const capacityPercentage = operation.totalCapacity > 0
                                ? (operation.currentCapacity / operation.totalCapacity) * 100
                                : 0
                            const isAvailable = operation.availableCapacity > 0

                            return (
                                <motion.div
                                    key={operation.id}
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-navy-800/50 rounded-xl p-6 border-2 border-gold-500/20 hover:border-gold-500/40 transition-all"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <h4 className="text-xl font-bold text-white">{operation.name}</h4>
                                        <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${riskColor.text} ${riskColor.bg}`}>
                                            <Shield className="w-3 h-3 mr-1" />
                                            {operation.riskLevel}
                                        </div>
                                    </div>

                                    <p className="text-gray-400 text-sm mb-4">{operation.description}</p>

                                    <div className="space-y-3 mb-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Daily Return:</span>
                                            <span className="text-green-500 font-semibold">{formatPercentage(operation.dailyReturn * 100)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Duration:</span>
                                            <span className="text-white font-semibold">{operation.duration} days</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Min Investment:</span>
                                            <span className="text-white font-semibold">{formatCurrency(operation.minInvestment)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Max Investment:</span>
                                            <span className="text-white font-semibold">{formatCurrency(operation.maxInvestment)}</span>
                                        </div>
                                    </div>

                                    {/* Capacity Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                            <span>Capacity</span>
                                            <span>{capacityPercentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-gold-500 to-gold-600 transition-all duration-300"
                                                style={{ width: `${capacityPercentage}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleStartInvestment(operation)}
                                        disabled={!isAvailable}
                                        className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center ${isAvailable
                                                ? 'btn-primary'
                                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        {isAvailable ? 'Start Investment' : 'Capacity Full'}
                                    </motion.button>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </motion.div>

            {/* Investment Modal */}
            {showInvestmentModal && selectedOperation && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-dark-800 rounded-2xl p-6 max-w-md w-full border border-gold-500/30"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Start Investment</h3>
                            <button
                                onClick={() => setShowInvestmentModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-white font-semibold mb-2">{selectedOperation.name}</h4>
                            <p className="text-gray-400 text-sm mb-4">{selectedOperation.description}</p>

                            <div className="bg-navy-800/50 rounded-xl p-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Daily Return:</span>
                                    <span className="text-green-500 font-semibold">{formatPercentage(selectedOperation.dailyReturn * 100)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Duration:</span>
                                    <span className="text-white">{selectedOperation.duration} days</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Range:</span>
                                    <span className="text-white">{formatCurrency(selectedOperation.minInvestment)} - {formatCurrency(selectedOperation.maxInvestment)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-400 text-sm mb-2">Investment Amount</label>
                            <input
                                type="number"
                                value={investmentAmount}
                                onChange={(e) => setInvestmentAmount(e.target.value)}
                                placeholder={`Min: ${selectedOperation.minInvestment}`}
                                className="w-full px-4 py-3 bg-navy-800 border border-gold-500/20 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                            />
                        </div>

                        {actionError && (
                            <div className="mb-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                                <p className="text-red-400 text-sm">{actionError}</p>
                            </div>
                        )}

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowInvestmentModal(false)}
                                disabled={actionLoading}
                                className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmInvestment}
                                disabled={actionLoading}
                                className="flex-1 py-3 btn-primary disabled:opacity-50 flex items-center justify-center"
                            >
                                {actionLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    'Confirm Investment'
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}

export default MiningManagement
