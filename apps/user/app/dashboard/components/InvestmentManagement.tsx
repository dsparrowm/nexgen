"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts'
import {
    Coins,
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    DollarSign,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Eye,
    EyeOff,
    Plus,
    Minus,
    BarChart3,
    PieChart as PieChartIcon,
    Wallet
} from 'lucide-react'

const InvestmentManagement = () => {
    const [showBalance, setShowBalance] = useState(true)
    const [selectedAsset, setSelectedAsset] = useState('gold')
    const [buyAmount, setBuyAmount] = useState('')
    const [sellAmount, setSellAmount] = useState('')

    // Mock data
    const goldPriceData = [
        { name: 'Jan', price: 1850, volume: 120 },
        { name: 'Feb', price: 1920, volume: 140 },
        { name: 'Mar', price: 1980, volume: 160 },
        { name: 'Apr', price: 1950, volume: 130 },
        { name: 'May', price: 2020, volume: 180 },
        { name: 'Jun', price: 2080, volume: 200 },
    ]

    const portfolioData = [
        { name: 'Gold', value: 65, amount: '$32,450', color: '#FFD700' },
        { name: 'Bitcoin', value: 25, amount: '$12,500', color: '#F59E0B' },
        { name: 'Ethereum', value: 10, amount: '$5,000', color: '#8B5CF6' },
    ]

    const transactions = [
        { id: 1, type: 'buy', asset: 'Gold', amount: '2.5 oz', value: '$5,000', date: '2024-01-15', status: 'completed' },
        { id: 2, type: 'sell', asset: 'Bitcoin', amount: '0.1 BTC', value: '$6,000', date: '2024-01-10', status: 'completed' },
        { id: 3, type: 'buy', asset: 'Gold', amount: '1.8 oz', value: '$3,600', date: '2024-01-05', status: 'completed' },
        { id: 4, type: 'buy', asset: 'Ethereum', amount: '2 ETH', value: '$5,000', date: '2023-12-28', status: 'completed' },
    ]

    const currentPrices = {
        gold: { price: 2080, change: '+2.4%', changeType: 'positive' },
        bitcoin: { price: 67500, change: '-1.2%', changeType: 'negative' },
        ethereum: { price: 2450, change: '+5.8%', changeType: 'positive' },
    }

    const holdings = {
        gold: { amount: '12.5 oz', value: '$26,000', allocation: '65%' },
        bitcoin: { amount: '0.185 BTC', value: '$12,487.50', allocation: '25%' },
        ethereum: { amount: '2.04 ETH', value: '$4,998', allocation: '10%' },
    }

    const handleBuy = () => {
        console.log(`Buying ${buyAmount} of ${selectedAsset}`)
        setBuyAmount('')
    }

    const handleSell = () => {
        console.log(`Selling ${sellAmount} of ${selectedAsset}`)
        setSellAmount('')
    }

    return (
        <div className="space-y-6">
            {/* Portfolio Overview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Investment Portfolio</h2>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setShowBalance(!showBalance)}
                            className="p-2 rounded-lg text-gray-400 hover:text-gold-500 transition-colors"
                        >
                            {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>
                        <div className="text-right">
                            <p className="text-sm text-gray-400">Total Portfolio Value</p>
                            <p className="text-2xl font-bold text-white">
                                {showBalance ? '$49,985.50' : '****'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {Object.entries(holdings).map(([asset, data]) => (
                        <div key={asset} className="bg-navy-800/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center">
                                    <Coins className="w-6 h-6 text-gold-500 mr-2" />
                                    <h3 className="text-white font-semibold capitalize">{asset}</h3>
                                </div>
                                <span className="text-sm text-gray-400">{data.allocation}</span>
                            </div>
                            <p className="text-lg font-bold text-white mb-1">
                                {showBalance ? data.value : '****'}
                            </p>
                            <p className="text-sm text-gray-400">{data.amount}</p>
                            <div className={`flex items-center mt-2 text-sm ${currentPrices[asset as keyof typeof currentPrices].changeType === 'positive'
                                    ? 'text-green-500'
                                    : 'text-red-500'
                                }`}>
                                {currentPrices[asset as keyof typeof currentPrices].changeType === 'positive' ? (
                                    <ArrowUpRight className="w-4 h-4 mr-1" />
                                ) : (
                                    <ArrowDownRight className="w-4 h-4 mr-1" />
                                )}
                                {currentPrices[asset as keyof typeof currentPrices].change}
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Price Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">Gold Price Chart</h3>
                        <div className="flex items-center space-x-2">
                            <select className="bg-navy-800 text-white border border-gold-500/30 rounded-lg px-3 py-1 text-sm">
                                <option>1M</option>
                                <option>3M</option>
                                <option>6M</option>
                                <option>1Y</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-4">
                        <p className="text-3xl font-bold text-white">$2,080.00</p>
                        <div className="flex items-center text-green-500">
                            <ArrowUpRight className="w-4 h-4 mr-1" />
                            <span className="text-sm">+2.4% ($48.50)</span>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={goldPriceData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1F2937',
                                    border: '1px solid #F59E0B',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="price"
                                stroke="#FFD700"
                                strokeWidth={3}
                                dot={{ fill: '#FFD700', strokeWidth: 2, r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Portfolio Allocation */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
                >
                    <h3 className="text-xl font-bold text-white mb-6">Portfolio Allocation</h3>

                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={portfolioData}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                innerRadius={40}
                                dataKey="value"
                                startAngle={90}
                                endAngle={450}
                            >
                                {portfolioData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1F2937',
                                    border: '1px solid #F59E0B',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="space-y-3">
                        {portfolioData.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div
                                        className="w-3 h-3 rounded-full mr-3"
                                        style={{ backgroundColor: item.color }}
                                    ></div>
                                    <span className="text-gray-300">{item.name}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-medium">{item.value}%</p>
                                    <p className="text-gray-400 text-sm">{item.amount}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Trading Interface */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
            >
                <h3 className="text-xl font-bold text-white mb-6">Trade Assets</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Buy Section */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-green-500 flex items-center">
                            <Plus className="w-5 h-5 mr-2" />
                            Buy Assets
                        </h4>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Asset</label>
                                <select
                                    value={selectedAsset}
                                    onChange={(e) => setSelectedAsset(e.target.value)}
                                    className="w-full bg-navy-800/50 border border-gold-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500"
                                >
                                    <option value="gold">Gold (Au)</option>
                                    <option value="bitcoin">Bitcoin (BTC)</option>
                                    <option value="ethereum">Ethereum (ETH)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Amount ($)</label>
                                <input
                                    type="number"
                                    value={buyAmount}
                                    onChange={(e) => setBuyAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    className="w-full bg-navy-800/50 border border-gold-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gold-500"
                                />
                            </div>

                            <div className="bg-navy-800/30 rounded-lg p-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Current Price:</span>
                                    <span className="text-white">
                                        ${currentPrices[selectedAsset as keyof typeof currentPrices].price.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Estimated Amount:</span>
                                    <span className="text-white">
                                        {buyAmount && !isNaN(Number(buyAmount))
                                            ? `${(Number(buyAmount) / currentPrices[selectedAsset as keyof typeof currentPrices].price).toFixed(6)} ${selectedAsset.toUpperCase()}`
                                            : '0'
                                        }
                                    </span>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleBuy}
                                disabled={!buyAmount}
                                className="w-full btn-primary bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ShoppingCart className="w-5 h-5 mr-2" />
                                Buy {selectedAsset.charAt(0).toUpperCase() + selectedAsset.slice(1)}
                            </motion.button>
                        </div>
                    </div>

                    {/* Sell Section */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-red-500 flex items-center">
                            <Minus className="w-5 h-5 mr-2" />
                            Sell Assets
                        </h4>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Asset</label>
                                <select
                                    value={selectedAsset}
                                    onChange={(e) => setSelectedAsset(e.target.value)}
                                    className="w-full bg-navy-800/50 border border-gold-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500"
                                >
                                    <option value="gold">Gold (Au)</option>
                                    <option value="bitcoin">Bitcoin (BTC)</option>
                                    <option value="ethereum">Ethereum (ETH)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                                <input
                                    type="number"
                                    value={sellAmount}
                                    onChange={(e) => setSellAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    className="w-full bg-navy-800/50 border border-gold-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gold-500"
                                />
                            </div>

                            <div className="bg-navy-800/30 rounded-lg p-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Available:</span>
                                    <span className="text-white">
                                        {holdings[selectedAsset as keyof typeof holdings].amount}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Estimated Value:</span>
                                    <span className="text-white">
                                        {sellAmount && !isNaN(Number(sellAmount))
                                            ? `$${(Number(sellAmount) * currentPrices[selectedAsset as keyof typeof currentPrices].price).toLocaleString()}`
                                            : '$0'
                                        }
                                    </span>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSell}
                                disabled={!sellAmount}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                <DollarSign className="w-5 h-5 mr-2" />
                                Sell {selectedAsset.charAt(0).toUpperCase() + selectedAsset.slice(1)}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Transaction History */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/20"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Recent Transactions</h3>
                    <button className="text-gold-500 hover:text-gold-400 transition-colors text-sm">
                        View All
                    </button>
                </div>

                <div className="space-y-3">
                    {transactions.map((transaction) => (
                        <div key={transaction.id} className="bg-navy-800/50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className={`p-2 rounded-lg ${transaction.type === 'buy'
                                            ? 'bg-green-500/20 text-green-500'
                                            : 'bg-red-500/20 text-red-500'
                                        }`}>
                                        {transaction.type === 'buy' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">
                                            {transaction.type === 'buy' ? 'Bought' : 'Sold'} {transaction.asset}
                                        </p>
                                        <p className="text-gray-400 text-sm">{transaction.amount}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-medium">{transaction.value}</p>
                                    <p className="text-gray-400 text-sm">{transaction.date}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}

export default InvestmentManagement