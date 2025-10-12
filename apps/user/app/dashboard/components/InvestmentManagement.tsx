"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts'
import {
    Coins, TrendingUp, DollarSign, ArrowUpRight, Eye, EyeOff, Plus, Minus, BarChart3,
    PieChart as PieChartIcon, Wallet, AlertCircle, RefreshCw, X, Check, Timer, Calendar, ShoppingCart
} from 'lucide-react'
import { useInvestmentData } from '@/hooks/useInvestmentData'
import { useMiningData } from '@/hooks/useMiningData'
import { formatCurrency, formatPercentage, formatDate } from '@/utils/api/formatters'
import { formatInvestment, getInvestmentStatusBadgeColor, getTransactionTypeBgColor, getTransactionTypeColor } from '@/utils/api/investmentApi'

const InvestmentManagement = () => {
    const [showBalance, setShowBalance] = useState(true)
    const [selectedMiningOperationId, setSelectedMiningOperationId] = useState<string>('')
    const [investAmount, setInvestAmount] = useState('')
    const [withdrawInvestmentId, setWithdrawInvestmentId] = useState<string>('')
    const [isInvesting, setIsInvesting] = useState(false)
    const [isWithdrawing, setIsWithdrawing] = useState(false)
    const [actionError, setActionError] = useState<string | null>(null)
    const [actionSuccess, setActionSuccess] = useState<string | null>(null)
    const [showInvestModal, setShowInvestModal] = useState(false)
    const [showWithdrawModal, setShowWithdrawModal] = useState(false)

    const {
        investments, investmentSummary, investmentsLoading, investmentsError,
        transactions, transactionsPagination, transactionsLoading, transactionsError,
        investmentStatus, setInvestmentStatus, transactionPage, setTransactionPage,
        createNewInvestment, withdrawExistingInvestment, refetchInvestments, refetchTransactions
    } = useInvestmentData()

    const { operations: miningOperations, operationsLoading: miningLoading } = useMiningData()

    const portfolioData = investments.filter(inv => inv.status === 'ACTIVE').reduce((acc: any[], inv) => {
        const existingOperation = acc.find(item => item.name === inv.miningOperation.name)
        const amount = Number(inv.amount)
        if (existingOperation) {
            existingOperation.value += amount
        } else {
            const colors = ['#FFD700', '#F59E0B', '#8B5CF6', '#10B981', '#3B82F6', '#EF4444']
            const hash = inv.miningOperation.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
            acc.push({ name: inv.miningOperation.name, value: amount, color: colors[hash % colors.length] })
        }
        return acc
    }, [])

    const totalPortfolioValue = portfolioData.reduce((sum, item) => sum + item.value, 0)
    const portfolioDataWithPercentages = portfolioData.map(item => ({
        ...item, percentage: totalPortfolioValue > 0 ? (item.value / totalPortfolioValue) * 100 : 0
    }))

    const handleInvest = async () => {
        if (!selectedMiningOperationId || !investAmount) return
        setIsInvesting(true)
        setActionError(null)
        setActionSuccess(null)
        try {
            await createNewInvestment({ miningOperationId: selectedMiningOperationId, amount: Number(investAmount) })
            setActionSuccess('Investment created successfully!')
            setInvestAmount('')
            setSelectedMiningOperationId('')
            // keep the modal open briefly so the user can see the success message inside it,
            // then close it after a short delay
            setTimeout(() => closeInvestModal(), 900)
            setTimeout(() => setActionSuccess(null), 3000)
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Failed to create investment')
        } finally {
            setIsInvesting(false)
        }
    }

    const handleWithdraw = async () => {
        if (!withdrawInvestmentId) return
        setIsWithdrawing(true)
        setActionError(null)
        setActionSuccess(null)
        try {
            const result = await withdrawExistingInvestment(withdrawInvestmentId)
            setActionSuccess(`Withdrawal successful! You received ${formatCurrency(result.withdrawalAmount)} (Penalty: ${formatCurrency(result.penalty)})`)
            setWithdrawInvestmentId('')
            // keep modal visible briefly so message is seen inside the modal
            setTimeout(() => closeWithdrawModal(), 900)
            setTimeout(() => setActionSuccess(null), 5000)
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Failed to withdraw investment')
        } finally {
            setIsWithdrawing(false)
        }
    }

    // Helper to close invest modal and clear modal-specific messages
    const closeInvestModal = () => {
        setShowInvestModal(false)
        setActionError(null)
        setActionSuccess(null)
    }

    // Helper to close withdraw modal and clear modal-specific messages
    const closeWithdrawModal = () => {
        setShowWithdrawModal(false)
        setActionError(null)
        setActionSuccess(null)
    }

    const selectedOperation = miningOperations.find(op => op.id === selectedMiningOperationId)
    const estimatedDailyReturn = selectedOperation && investAmount ? Number(investAmount) * (Number(selectedOperation.dailyReturn) / 100) : 0
    const estimatedTotalReturn = selectedOperation ? estimatedDailyReturn * selectedOperation.duration : 0

    const SkeletonCard = () => (
        <div className="animate-pulse"><div className="h-4 bg-gray-700 rounded w-3/4 mb-3"></div><div className="h-8 bg-gray-700 rounded w-1/2 mb-2"></div><div className="h-3 bg-gray-700 rounded w-2/3"></div></div>
    )

    return (
        <div className="space-y-6">
            <AnimatePresence>
                {/* Show top-level banners only when no modal is open to avoid duplicates */}
                {!showInvestModal && !showWithdrawModal && actionSuccess && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-3" /><span className="text-green-500">{actionSuccess}</span>
                    </motion.div>
                )}

                {!showInvestModal && !showWithdrawModal && actionError && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center"><AlertCircle className="w-5 h-5 text-red-500 mr-3" /><span className="text-red-500">{actionError}</span></div>
                        <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Investment Portfolio</h2>
                    <div className="flex items-center space-x-4">
                        <button onClick={() => setShowBalance(!showBalance)} className="p-2 rounded-lg text-gray-400 hover:text-gold-500 transition-colors">
                            {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>
                        <button onClick={() => refetchInvestments()} className="p-2 rounded-lg text-gray-400 hover:text-gold-500 transition-colors" disabled={investmentsLoading}>
                            <RefreshCw className={`w-5 h-5 ${investmentsLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <div className="text-right">
                            <p className="text-sm text-gray-400">Total Portfolio Value</p>
                            <p className="text-2xl font-bold text-white">
                                {investmentsLoading ? <span className="animate-pulse">Loading...</span> : showBalance ? formatCurrency(investmentSummary.currentValue) : '****'}
                            </p>
                        </div>
                    </div>
                </div>

                {investmentsError && (
                    <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center"><AlertCircle className="w-5 h-5 text-red-500 mr-3" /><span className="text-red-500">{investmentsError}</span></div>
                        <button onClick={() => refetchInvestments()} className="text-red-500 hover:text-red-400 flex items-center"><RefreshCw className="w-4 h-4 mr-1" />Retry</button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-navy-800/50 rounded-xl p-4">
                        <div className="flex items-center mb-3"><Coins className="w-6 h-6 text-gold-500 mr-2" /><h3 className="text-white font-semibold">Total Invested</h3></div>
                        {investmentsLoading ? <SkeletonCard /> : (<><p className="text-lg font-bold text-white mb-1">{showBalance ? formatCurrency(investmentSummary.totalInvested) : '****'}</p><p className="text-sm text-gray-400">{investmentSummary.activeInvestments} active</p></>)}
                    </div>
                    <div className="bg-navy-800/50 rounded-xl p-4">
                        <div className="flex items-center mb-3"><TrendingUp className="w-6 h-6 text-green-500 mr-2" /><h3 className="text-white font-semibold">Total Returns</h3></div>
                        {investmentsLoading ? <SkeletonCard /> : (<><p className="text-lg font-bold text-white mb-1">{showBalance ? formatCurrency(investmentSummary.totalReturns) : '****'}</p><div className="flex items-center text-sm text-green-500"><ArrowUpRight className="w-4 h-4 mr-1" />{formatPercentage(investmentSummary.roi)}</div></>)}
                    </div>
                    <div className="bg-navy-800/50 rounded-xl p-4">
                        <div className="flex items-center mb-3"><DollarSign className="w-6 h-6 text-blue-500 mr-2" /><h3 className="text-white font-semibold">Current Value</h3></div>
                        {investmentsLoading ? <SkeletonCard /> : (<><p className="text-lg font-bold text-white mb-1">{showBalance ? formatCurrency(investmentSummary.currentValue) : '****'}</p><p className="text-sm text-gray-400">Portfolio value</p></>)}
                    </div>
                    <div className="bg-navy-800/50 rounded-xl p-4">
                        <div className="flex items-center mb-3"><BarChart3 className="w-6 h-6 text-purple-500 mr-2" /><h3 className="text-white font-semibold">Avg Return</h3></div>
                        {investmentsLoading ? <SkeletonCard /> : (<><p className="text-lg font-bold text-white mb-1">{formatPercentage(investmentSummary.averageReturn)}</p><p className="text-sm text-gray-400">Per investment</p></>)}
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20">
                    <h3 className="text-xl font-bold text-white mb-4">Portfolio Allocation</h3>
                    {investmentsLoading ? (
                        <div className="flex justify-center items-center h-[250px]"><RefreshCw className="w-8 h-8 text-gold-500 animate-spin" /></div>
                    ) : portfolioDataWithPercentages.length > 0 ? (
                        <><ResponsiveContainer width="100%" height={200}>
                            <PieChart><Pie data={portfolioDataWithPercentages} cx="50%" cy="50%" outerRadius={60} innerRadius={30} dataKey="value" startAngle={90} endAngle={450}>
                                {portfolioDataWithPercentages.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                            </Pie><Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #F59E0B', borderRadius: '8px', color: '#fff' }} /></PieChart>
                        </ResponsiveContainer>
                            <div className="space-y-2 mt-4">{portfolioDataWithPercentages.map((item, index) => (
                                <div key={index} className="flex items-center justify-between"><div className="flex items-center"><div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }}></div><span className="text-gray-300 text-sm">{item.name}</span></div><div className="text-right"><p className="text-white font-medium text-sm">{item.percentage.toFixed(1)}%</p><p className="text-gray-400 text-xs">{formatCurrency(item.value)}</p></div></div>
                            ))}</div></>
                    ) : (
                        <div className="flex flex-col justify-center items-center h-[250px] text-gray-400"><PieChartIcon className="w-12 h-12 mb-3 opacity-50" /><p>No active investments yet</p></div>
                    )}
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.6 }} className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20">
                    <h3 className="text-xl font-bold text-white mb-6">Your Investments</h3>
                    {investmentsLoading ? (
                        <div className="space-y-4">{[1, 2].map((i) => (<div key={i} className="bg-navy-800/50 rounded-lg p-4 animate-pulse"><div className="h-4 bg-gray-700 rounded w-1/2 mb-3"></div></div>))}</div>
                    ) : investments.length > 0 ? (
                        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">{investments.slice(0, 3).map((investment) => {
                            const formatted = formatInvestment(investment)
                            const amount = Number(investment.amount)
                            const dailyReturn = Number(investment.dailyReturn)
                            const currentReturn = amount * (dailyReturn / 100) * formatted.daysElapsed
                            return (
                                <div key={investment.id} className="bg-navy-800/50 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-white font-semibold text-sm">{investment.miningOperation.name}</h4>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getInvestmentStatusBadgeColor(investment.status)}`}>{investment.status}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div><p className="text-gray-400">Invested</p><p className="text-white font-medium">{formatCurrency(amount)}</p></div>
                                        <div><p className="text-gray-400">Returns</p><p className="text-green-500 font-medium">{formatCurrency(currentReturn)}</p></div>
                                        <div><p className="text-gray-400">Progress</p><p className="text-white font-medium">{formatted.progress.toFixed(0)}%</p></div>
                                    </div>
                                </div>
                            )
                        })}</div>
                    ) : (
                        <div className="flex flex-col justify-center items-center py-8 text-gray-400"><Wallet className="w-12 h-12 mb-3 opacity-50" /><p>No investments yet</p></div>
                    )}
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowInvestModal(true)} className="btn-primary flex items-center justify-center w-full mt-4">
                        <Plus className="w-5 h-5 mr-2" />New Investment
                    </motion.button>
                </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }} className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Recent Transactions</h3>
                    <button onClick={() => refetchTransactions()} className="text-gold-500 hover:text-gold-400 transition-colors text-sm flex items-center" disabled={transactionsLoading}>
                        <RefreshCw className={`w-4 h-4 mr-1 ${transactionsLoading ? 'animate-spin' : ''}`} />Refresh
                    </button>
                </div>

                {transactionsLoading ? (
                    <div className="space-y-3">{[1, 2, 3].map((i) => (<div key={i} className="bg-navy-800/50 rounded-lg p-4 animate-pulse"><div className="flex items-center space-x-4"><div className="w-8 h-8 bg-gray-700 rounded-lg"></div><div className="flex-1"><div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div></div></div></div>))}</div>
                ) : transactions.length > 0 ? (
                    <div className="space-y-3">{transactions.map((transaction) => (
                        <div key={transaction.id} className="bg-navy-800/50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className={`p-2 rounded-lg ${getTransactionTypeBgColor(transaction.type)}`}>
                                        {transaction.type === 'INVESTMENT' || transaction.type === 'DEPOSIT' || transaction.type === 'REFERRAL_BONUS' ? (<Plus className={`w-4 h-4 ${getTransactionTypeColor(transaction.type)}`} />) : (<Minus className={`w-4 h-4 ${getTransactionTypeColor(transaction.type)}`} />)}
                                    </div>
                                    <div><p className="text-white font-medium">{transaction.type.replace(/_/g, ' ')}</p><p className="text-gray-400 text-sm">{transaction.description}</p></div>
                                </div>
                                <div className="text-right"><p className="text-white font-medium">{formatCurrency(transaction.amount)}</p><p className="text-gray-400 text-sm">{formatDate(transaction.createdAt)}</p></div>
                            </div>
                        </div>
                    ))}</div>
                ) : (
                    <div className="flex flex-col justify-center items-center py-12 text-gray-400"><Calendar className="w-12 h-12 mb-3 opacity-50" /><p>No transactions yet</p></div>
                )}
            </motion.div>

            <AnimatePresence>
                {showInvestModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => !isInvesting && closeInvestModal()}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-dark-800 rounded-2xl p-6 border border-gold-500/20 max-w-md w-full">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white">New Investment</h3>
                                <button onClick={() => !isInvesting && closeInvestModal()} className="text-gray-400 hover:text-white" disabled={isInvesting}><X className="w-5 h-5" /></button>
                            </div>

                            <div className="space-y-4">
                                {/* Show action messages inside modal for better context */}
                                {actionSuccess && (
                                    <div className="mb-2 bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-300 text-sm">
                                        {actionSuccess}
                                    </div>
                                )}
                                {actionError && (
                                    <div className="mb-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
                                        {actionError}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Mining Operation</label>
                                    {miningLoading ? (<div className="animate-pulse h-12 bg-gray-700 rounded-lg"></div>) : (
                                        <select value={selectedMiningOperationId} onChange={(e) => setSelectedMiningOperationId(e.target.value)} className="w-full bg-navy-800/50 border border-gold-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500" disabled={isInvesting}>
                                            <option value="">Select operation...</option>
                                            {miningOperations.map(op => (<option key={op.id} value={op.id}>{op.name} - {formatPercentage(Number(op.dailyReturn))} daily</option>))}
                                        </select>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Investment Amount ($)</label>
                                    <input type="number" value={investAmount} onChange={(e) => setInvestAmount(e.target.value)} placeholder="Enter amount" className="w-full bg-navy-800/50 border border-gold-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gold-500" disabled={isInvesting} />
                                    {selectedOperation && (<p className="text-gray-400 text-sm mt-1">Min: {formatCurrency(Number(selectedOperation.minInvestment))} - Max: {formatCurrency(Number(selectedOperation.maxInvestment))}</p>)}
                                </div>

                                {selectedOperation && investAmount && (
                                    <div className="bg-navy-800/30 rounded-lg p-4 space-y-2">
                                        <div className="flex justify-between text-sm"><span className="text-gray-400">Daily Return:</span><span className="text-white font-medium">{formatCurrency(estimatedDailyReturn)}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-gray-400">Duration:</span><span className="text-white font-medium">{selectedOperation.duration} days</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-gray-400">Total Estimated Return:</span><span className="text-green-500 font-medium">{formatCurrency(estimatedTotalReturn)}</span></div>
                                    </div>
                                )}

                                <div className="flex space-x-3 pt-4">
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => !isInvesting && closeInvestModal()} disabled={isInvesting} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50">Cancel</motion.button>
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleInvest} disabled={!selectedMiningOperationId || !investAmount || isInvesting} className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                                        {isInvesting ? (<><RefreshCw className="w-5 h-5 mr-2 animate-spin" />Creating...</>) : (<><ShoppingCart className="w-5 h-5 mr-2" />Invest Now</>)}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showWithdrawModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => !isWithdrawing && closeWithdrawModal()}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-dark-800 rounded-2xl p-6 border border-gold-500/20 max-w-md w-full">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white">Confirm Withdrawal</h3>
                                <button onClick={() => !isWithdrawing && closeWithdrawModal()} className="text-gray-400 hover:text-white" disabled={isWithdrawing}><X className="w-5 h-5" /></button>
                            </div>

                            <div className="mb-6">
                                {/* show messages inside withdraw modal as well */}
                                {actionSuccess && (
                                    <div className="mb-2 bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-300 text-sm">
                                        {actionSuccess}
                                    </div>
                                )}
                                {actionError && (
                                    <div className="mb-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
                                        {actionError}
                                    </div>
                                )}
                                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-4">
                                    <div className="flex items-start"><AlertCircle className="w-5 h-5 text-yellow-500 mr-3 mt-0.5" /><div><p className="text-yellow-500 font-medium mb-1">Early Withdrawal Penalty</p><p className="text-yellow-500/80 text-sm">A 10% penalty will be deducted from your investment amount if you withdraw early.</p></div></div>
                                </div>
                                <p className="text-gray-400 text-sm">Are you sure you want to withdraw this investment? This action cannot be undone.</p>
                            </div>

                            <div className="flex space-x-3">
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => !isWithdrawing && closeWithdrawModal()} disabled={isWithdrawing} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50">Cancel</motion.button>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleWithdraw} disabled={isWithdrawing} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                                    {isWithdrawing ? (<><RefreshCw className="w-5 h-5 mr-2 animate-spin" />Withdrawing...</>) : (<><DollarSign className="w-5 h-5 mr-2" />Confirm Withdrawal</>)}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default InvestmentManagement
