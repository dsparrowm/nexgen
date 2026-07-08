import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card } from './Card'

export function DataTable({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <Card className={cn('overflow-hidden', className)} {...props}>
            <div className="overflow-x-auto">{children}</div>
        </Card>
    )
}

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
    return <table className={cn('w-full text-sm', className)} {...props} />
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return <thead className={cn('border-b border-zinc-200 bg-zinc-50', className)} {...props} />
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return <tbody className={cn('divide-y divide-zinc-100', className)} {...props} />
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
    return <tr className={cn('transition-colors hover:bg-zinc-50/80', className)} {...props} />
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return (
        <th
            className={cn(
                'px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500',
                className
            )}
            {...props}
        />
    )
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return <td className={cn('px-4 py-3 align-middle text-zinc-700', className)} {...props} />
}
