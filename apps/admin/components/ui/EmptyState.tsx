import * as React from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

export interface EmptyStateProps {
    icon?: LucideIcon
    title: string
    description?: string
    actionLabel?: string
    onAction?: () => void
    className?: string
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className,
}: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
            {Icon && (
                <div className="mb-4 rounded-full bg-zinc-100 p-3">
                    <Icon className="h-6 w-6 text-zinc-400" />
                </div>
            )}
            <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
            {description && <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p>}
            {actionLabel && onAction && (
                <Button variant="secondary" size="sm" className="mt-4" onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    )
}
