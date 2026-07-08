import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, leftIcon, rightIcon, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-zinc-700">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            'flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
                            leftIcon && 'pl-10',
                            rightIcon && 'pr-10',
                            error ? 'border-red-300 focus-visible:ring-red-500' : 'border-zinc-200',
                            className
                        )}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
            </div>
        )
    }
)
Input.displayName = 'Input'
