import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SegmentedControlOption {
    value: string
    label: string
}

export interface SegmentedControlProps {
    options: SegmentedControlOption[]
    value: string
    onChange: (value: string) => void
    className?: string
}

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
    return (
        <div className={cn('inline-flex rounded-lg border border-zinc-200 bg-zinc-100 p-0.5', className)}>
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={cn(
                        'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                        value === option.value
                            ? 'bg-white text-zinc-900 shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-700'
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}
