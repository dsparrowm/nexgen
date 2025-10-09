'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Toast, ToastContainer, ToastType } from './Toast'

interface ToastContextType {
    addToast: (type: ToastType, title: string, message?: string, duration?: number) => void
    removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}

interface ToastProviderProps {
    children: ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = (type: ToastType, title: string, message?: string, duration?: number) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
        const toast: Toast = {
            id,
            type,
            title,
            message,
            duration
        }

        setToasts((prev) => [...prev, toast])
    }

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    )
}