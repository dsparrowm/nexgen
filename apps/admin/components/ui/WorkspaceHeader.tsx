import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

export interface WorkspaceHeaderProps {
    title: string
    description?: string
    action?: React.ReactNode
    className?: string
}

export function WorkspaceHeader({ title, description, action, className }: WorkspaceHeaderProps) {
    return (
        <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
            <div>
                <h2 className="text-xl font-semibold text-zinc-900">{title}</h2>
                {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
            </div>
            {action}
        </div>
    )
}

export function IconButton({
    className,
    children,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            type="button"
            className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50',
                className
            )}
            {...props}
        >
            {children}
        </button>
    )
}

export function WorkspaceToolbar({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-card lg:flex-row lg:items-center lg:justify-between',
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

export function WorkspaceToolbarActions({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('flex flex-wrap items-center gap-2', className)} {...props}>
            {children}
        </div>
    )
}

export function WorkspaceToolbarFilters({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center', className)} {...props}>
            {children}
        </div>
    )
}

export { Button }
