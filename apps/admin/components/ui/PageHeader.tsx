import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface PageHeaderProps {
    title: string
    description?: string
    breadcrumbs?: Array<{ label: string; href?: string }>
    actions?: React.ReactNode
    className?: string
}

export function PageHeader({ title, description, breadcrumbs, actions, className }: PageHeaderProps) {
    return (
        <div className={cn('flex flex-col gap-1', className)}>
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-1.5 text-xs text-zinc-500">
                    {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={`${crumb.label}-${index}`}>
                            {index > 0 && <span className="text-zinc-300">/</span>}
                            {crumb.href ? (
                                <Link href={crumb.href} className="hover:text-zinc-700 transition-colors">
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className="text-zinc-700">{crumb.label}</span>
                            )}
                        </React.Fragment>
                    ))}
                </nav>
            )}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
                    {description && <p className="mt-0.5 text-sm text-zinc-500">{description}</p>}
                </div>
                {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
            </div>
        </div>
    )
}
