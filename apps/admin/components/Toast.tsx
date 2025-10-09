'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
    id: string
    type: ToastType
    title: string
    message?: string
    duration?: number
}

interface ToastItemProps {
    toast: Toast
    onRemove: (id: string) => void
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false)
            setTimeout(() => onRemove(toast.id), 300) // Wait for exit animation
        }, toast.duration || 5000)

        return () => clearTimeout(timer)
    }, [toast.id, toast.duration, onRemove])

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500" />
            case 'error':
                return <XCircle className="w-5 h-5 text-red-500" />
            case 'warning':
                return <AlertCircle className="w-5 h-5 text-yellow-500" />
            case 'info':
                return <AlertCircle className="w-5 h-5 text-blue-500" />
            default:
                return <AlertCircle className="w-5 h-5 text-blue-500" />
        }
    }

    const getBorderColor = () => {
        switch (toast.type) {
            case 'success':
                return 'border-green-500/30'
            case 'error':
                return 'border-red-500/30'
            case 'warning':
                return 'border-yellow-500/30'
            case 'info':
                return 'border-blue-500/30'
            default:
                return 'border-blue-500/30'
        }
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: 300, scale: 0.3 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    className={`bg-dark-800/95 backdrop-blur-sm border ${getBorderColor()} rounded-xl p-4 shadow-lg max-w-sm w-full`}
                >
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            {getIcon()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm">{toast.title}</p>
                            {toast.message && (
                                <p className="text-gray-300 text-sm mt-1">{toast.message}</p>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                setIsVisible(false)
                                setTimeout(() => onRemove(toast.id), 300)
                            }}
                            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

interface ToastContainerProps {
    toasts: Toast[]
    onRemove: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    )
}

export default ToastItem