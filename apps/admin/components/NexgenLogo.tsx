import { cn } from '@/lib/utils'

type LogoSize = 'sm' | 'md' | 'lg' | 'xl'
type LogoVariant = 'sidebar' | 'login' | 'icon'

interface NexgenLogoProps {
    size?: LogoSize
    variant?: LogoVariant
    className?: string
}

const iconSizeClasses: Record<LogoSize, string> = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-2xl',
}

const textSizeClasses: Record<LogoSize, string> = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl',
    xl: 'text-3xl',
}

export function NexgenLogo({ size = 'md', variant = 'sidebar', className }: NexgenLogoProps) {
    if (variant === 'icon') {
        return (
            <div
                className={cn(
                    'flex items-center justify-center rounded-lg bg-gold-500 font-bold text-navy-900',
                    iconSizeClasses[size],
                    className
                )}
            >
                N
            </div>
        )
    }

    const isLogin = variant === 'login'

    return (
        <div className={cn('flex items-center gap-2.5', className)}>
            <div
                className={cn(
                    'flex shrink-0 items-center justify-center rounded-lg bg-gold-500 font-bold text-navy-900',
                    iconSizeClasses[size]
                )}
            >
                N
            </div>
            <div>
                <p className={cn('font-semibold tracking-tight text-zinc-900', textSizeClasses[size])}>
                    NexGen
                </p>
                {isLogin ? (
                    <p className="text-sm text-zinc-500">Admin Portal</p>
                ) : (
                    <p className="text-xs text-zinc-500">Admin</p>
                )}
            </div>
        </div>
    )
}
