import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, id, children, ...props }, ref) => {
        const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-zinc-700">
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    id={selectId}
                    className={cn(
                        'h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:cursor-not-allowed disabled:opacity-50',
                        className
                    )}
                    {...props}
                >
                    {children}
                </select>
            </div>
        )
    }
)
Select.displayName = 'Select'
