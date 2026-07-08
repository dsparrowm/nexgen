import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-gold-500 text-navy-900 hover:bg-gold-400',
    secondary: 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50',
    ghost: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
    danger: 'bg-red-600 text-white hover:bg-red-700',
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-11 px-6 text-sm',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => (
        <button
            ref={ref}
            type={type}
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                variantClasses[variant],
                sizeClasses[size],
                className
            )}
            {...props}
        />
    )
)
Button.displayName = 'Button'
