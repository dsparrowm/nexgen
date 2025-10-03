import React from 'react';

interface NexGenLogoProps {
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    variant?: 'full' | 'icon' | 'text';
    className?: string;
    showText?: boolean;
    dark?: boolean;
}

const NexGenLogo: React.FC<NexGenLogoProps> = ({
    size = 'md',
    variant = 'full',
    className = '',
    showText = true,
    dark = false
}) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-14 h-14',
        xl: 'w-18 h-18',
        '2xl': 'w-24 h-24'
    };

    const textSizeClasses = {
        sm: 'text-base',
        md: 'text-xl',
        lg: 'text-2xl',
        xl: 'text-3xl',
        '2xl': 'text-4xl'
    };

    if (variant === 'icon') {
        return (
            <img
                src="/images/newLogo.png"
                alt="NexGen Logo"
                className={`${sizeClasses[size]} object-contain ${className}`}
            />
        );
    }

    if (variant === 'text') {
        return (
            <span className={`font-bold font-display ${textSizeClasses[size]}`}>
                <span className="text-white">NEX</span>
                <span className="text-gold-500">GEN</span>
            </span>
        );
    }

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <img
                src="/images/newLogo.png"
                alt="NexGen Logo"
                className={`${sizeClasses[size]} object-contain`}
            />
            {showText && (
                <span className={`font-bold font-display ${textSizeClasses[size]}`}>
                    <span className="text-white">NEX</span>
                    <span className="text-gold-500">GEN</span>
                </span>
            )}
        </div>
    );
};

export default NexGenLogo;
export { NexGenLogo };
