'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

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

const toastStyles: Record<
    ToastType,
    { container: string; icon: string }
> = {
    success: {
        container: 'border-green-200 bg-green-50',
        icon: 'text-green-600',
    },
    error: {
        container: 'border-red-200 bg-red-50',
        icon: 'text-red-600',
    },
    warning: {
        container: 'border-amber-200 bg-amber-50',
        icon: 'text-amber-600',
    },
    info: {
        container: 'border-blue-200 bg-blue-50',
        icon: 'text-blue-600',
    },
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
        const iconClass = cn('h-5 w-5', toastStyles[toast.type].icon)

        switch (toast.type) {
            case 'success':
                return <CheckCircle className={iconClass} />
            case 'error':
                return <XCircle className={iconClass} />
            case 'warning':
                return <AlertCircle className={iconClass} />
            case 'info':
                return <AlertCircle className={iconClass} />
            default:
                return <AlertCircle className={iconClass} />
        }
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: 300, scale: 0.3 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    className={cn(
                        'w-full max-w-sm rounded-xl border p-4 shadow-card',
                        toastStyles[toast.type].container
                    )}
                >
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">{getIcon()}</div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-zinc-900">{toast.title}</p>
                            {toast.message && (
                                <p className="mt-1 text-sm text-zinc-600">{toast.message}</p>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                setIsVisible(false)
                                setTimeout(() => onRemove(toast.id), 300)
                            }}
                            className="flex-shrink-0 text-zinc-400 transition-colors hover:text-zinc-600"
                        >
                            <X className="h-4 w-4" />
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
