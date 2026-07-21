import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    name?: string
    src?: string | null
    size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
}

function getInitials(name?: string) {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
        return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
}

export function Avatar({ name, src, size = 'md', className, ...props }: AvatarProps) {
    const [imageFailed, setImageFailed] = React.useState(false)

    React.useEffect(() => {
        setImageFailed(false)
    }, [src])

    const showImage = Boolean(src) && !imageFailed

    return (
        <div
            className={cn(
                'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold-100 font-semibold text-gold-800',
                sizeClasses[size],
                className
            )}
            {...props}
        >
            {showImage ? (
                <img
                    src={src!}
                    alt={name || 'Avatar'}
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                />
            ) : (
                getInitials(name)
            )}
        </div>
    )
}
