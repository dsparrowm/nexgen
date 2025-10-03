/**
 * Formatting Utilities
 * Common formatting functions for consistent data display
 */

/**
 * Format a number as currency
 */
export function formatCurrency(
    amount: number | string | null | undefined,
    currency: string = 'USD',
    decimals: number = 2
): string {
    if (amount === null || amount === undefined) {
        return '$0.00';
    }

    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) {
        return '$0.00';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(numAmount);
}

/**
 * Format a number as a percentage
 */
export function formatPercentage(
    value: number | string | null | undefined,
    decimals: number = 2
): string {
    if (value === null || value === undefined) {
        return '0%';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
        return '0%';
    }

    return `${numValue.toFixed(decimals)}%`;
}

/**
 * Format a large number with suffixes (K, M, B)
 */
export function formatNumber(
    value: number | string | null | undefined,
    decimals: number = 2
): string {
    if (value === null || value === undefined) {
        return '0';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
        return '0';
    }

    if (numValue >= 1_000_000_000) {
        return `${(numValue / 1_000_000_000).toFixed(decimals)}B`;
    }
    if (numValue >= 1_000_000) {
        return `${(numValue / 1_000_000).toFixed(decimals)}M`;
    }
    if (numValue >= 1_000) {
        return `${(numValue / 1_000).toFixed(decimals)}K`;
    }

    return numValue.toFixed(decimals);
}

/**
 * Format a date string to a localized date
 */
export function formatDate(
    date: string | Date | null | undefined,
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }
): string {
    if (!date) {
        return 'N/A';
    }

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('en-US', options).format(dateObj);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
}

/**
 * Format a date string to a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
    if (!date) {
        return 'N/A';
    }

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        }

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
        }

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
        }

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 30) {
            return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
        }

        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) {
            return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
        }

        const diffInYears = Math.floor(diffInMonths / 12);
        return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
    } catch (error) {
        console.error('Error formatting relative time:', error);
        return 'N/A';
    }
}

/**
 * Truncate a long string with ellipsis
 */
export function truncateString(
    str: string | null | undefined,
    maxLength: number = 50
): string {
    if (!str) {
        return '';
    }

    if (str.length <= maxLength) {
        return str;
    }

    return `${str.substring(0, maxLength)}...`;
}

/**
 * Format a transaction reference or hash
 */
export function formatTransactionRef(ref: string | null | undefined): string {
    if (!ref) {
        return 'N/A';
    }

    if (ref.length <= 12) {
        return ref;
    }

    return `${ref.substring(0, 6)}...${ref.substring(ref.length - 6)}`;
}
