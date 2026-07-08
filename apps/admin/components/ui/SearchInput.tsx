import * as React from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    containerClassName?: string
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
    ({ className, containerClassName, ...props }, ref) => (
        <div className={cn('relative', containerClassName)}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
                ref={ref}
                type="search"
                className={cn(
                    'h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500',
                    className
                )}
                {...props}
            />
        </div>
    )
)
SearchInput.displayName = 'SearchInput'
