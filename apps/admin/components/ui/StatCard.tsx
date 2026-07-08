import * as React from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from './Card'

export interface StatCardProps {
    title: string
    value: string
    description?: string
    icon?: LucideIcon
    iconClassName?: string
    trend?: string
    trendDirection?: 'up' | 'down' | 'neutral'
    className?: string
}

export function StatCard({
    title,
    value,
    description,
    icon: Icon,
    iconClassName,
    trend,
    trendDirection = 'neutral',
    className,
}: StatCardProps) {
    const showTrend = trend && trend !== '+0%' && trend !== '-0%' && trend !== '0%'

    return (
        <Card className={cn('card-hover', className)}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                    {Icon && (
                        <div className={cn('rounded-lg bg-zinc-100 p-2', iconClassName)}>
                            <Icon className="h-4 w-4 text-zinc-600" />
                        </div>
                    )}
                    {showTrend && (
                        <span
                            className={cn(
                                'text-xs font-medium',
                                trendDirection === 'up' && 'text-green-600',
                                trendDirection === 'down' && 'text-red-600',
                                trendDirection === 'neutral' && 'text-zinc-500'
                            )}
                        >
                            {trend}
                        </span>
                    )}
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">{value}</p>
                <p className="mt-0.5 text-sm font-medium text-zinc-600">{title}</p>
                {description && <p className="mt-1 text-xs text-zinc-400">{description}</p>}
            </CardContent>
        </Card>
    )
}
