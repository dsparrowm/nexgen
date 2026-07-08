import { cn } from '@/lib/utils'

type LogoSize = 'sm' | 'md' | 'lg' | 'xl'
type LogoVariant = 'sidebar' | 'login' | 'icon'
type LogoTheme = 'light' | 'dark'

interface NexgenLogoProps {
    size?: LogoSize
    variant?: LogoVariant
    theme?: LogoTheme
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

export function NexgenLogo({ size = 'md', variant = 'sidebar', theme = 'light', className }: NexgenLogoProps) {
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
    const isDark = theme === 'dark'

    return (
        <div className={cn('flex items-center gap-2.5', className)}>
            <div
                className={cn(
                    'flex shrink-0 items-center justify-center rounded-xl bg-gold-500 font-bold text-navy-900 shadow-sm',
                    iconSizeClasses[size]
                )}
            >
                N
            </div>
            <div>
                <p
                    className={cn(
                        'font-semibold tracking-tight',
                        textSizeClasses[size],
                        isDark ? 'text-white' : 'text-zinc-900'
                    )}
                >
                    NexGen
                </p>
                {isLogin ? (
                    <p className={cn('text-sm', isDark ? 'text-zinc-400' : 'text-zinc-500')}>Admin Portal</p>
                ) : (
                    <p className={cn('text-xs', isDark ? 'text-zinc-400' : 'text-zinc-500')}>Admin</p>
                )}
            </div>
        </div>
    )
}
