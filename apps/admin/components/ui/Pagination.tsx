import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

export interface PaginationProps {
    page: number
    pages: number
    total: number
    limit: number
    onPageChange: (page: number) => void
    className?: string
}

export function Pagination({ page, pages, total, limit, onPageChange, className }: PaginationProps) {
    if (pages <= 1) return null

    const start = (page - 1) * limit + 1
    const end = Math.min(page * limit, total)

    const pageNumbers = Array.from({ length: Math.min(pages, 5) }, (_, i) => {
        if (pages <= 5) return i + 1
        if (page <= 3) return i + 1
        if (page >= pages - 2) return pages - 4 + i
        return page - 2 + i
    })

    return (
        <div className={cn('flex items-center justify-between border-t border-zinc-200 px-4 py-3', className)}>
            <p className="text-sm text-zinc-500">
                Showing {start}–{end} of {total}
            </p>
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                {pageNumbers.map((pageNum) => (
                    <Button
                        key={pageNum}
                        variant={page === pageNum ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => onPageChange(pageNum)}
                        className="min-w-8"
                    >
                        {pageNum}
                    </Button>
                ))}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === pages}
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
