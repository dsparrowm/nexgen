import * as React from 'react'
import { cn } from '@/lib/utils'

export type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral' | 'gold'

const variantClasses: Record<BadgeVariant, string> = {
    success: 'border-green-200 bg-green-50 text-green-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    error: 'border-red-200 bg-red-50 text-red-700',
    neutral: 'border-zinc-200 bg-zinc-50 text-zinc-600',
    gold: 'border-gold-200 bg-gold-50 text-gold-800',
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant
}

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                variantClasses[variant],
                className
            )}
            {...props}
        />
    )
}
