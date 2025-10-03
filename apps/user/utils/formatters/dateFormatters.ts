/**
 * Date formatting utilities for dashboard
 */

/**
 * Format date to readable string
 */
export function formatDate(
    date: string | Date,
    options: {
        format?: 'full' | 'short' | 'medium' | 'time' | 'relative';
        includeTime?: boolean;
    } = {}
): string {
    const { format = 'medium', includeTime = false } = options;

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return 'Invalid date';

    if (format === 'relative') {
        return formatRelativeTime(dateObj);
    }

    const dateOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: format === 'short' ? 'short' : 'long',
        day: 'numeric',
    };

    if (includeTime || format === 'time') {
        dateOptions.hour = '2-digit';
        dateOptions.minute = '2-digit';
    }

    return dateObj.toLocaleDateString('en-US', dateOptions);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return 'Invalid date';

    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
    if (diffWeek < 4) return `${diffWeek} week${diffWeek !== 1 ? 's' : ''} ago`;
    if (diffMonth < 12) return `${diffMonth} month${diffMonth !== 1 ? 's' : ''} ago`;
    return `${diffYear} year${diffYear !== 1 ? 's' : ''} ago`;
}

/**
 * Format time duration (e.g., "2h 30m")
 */
export function formatDuration(
    seconds: number,
    options: {
        format?: 'short' | 'long';
        maxUnits?: number;
    } = {}
): string {
    const { format = 'short', maxUnits = 2 } = options;

    if (seconds < 0) return '0s';

    const units = [
        { name: 'year', short: 'y', seconds: 31536000 },
        { name: 'month', short: 'mo', seconds: 2592000 },
        { name: 'day', short: 'd', seconds: 86400 },
        { name: 'hour', short: 'h', seconds: 3600 },
        { name: 'minute', short: 'm', seconds: 60 },
        { name: 'second', short: 's', seconds: 1 },
    ];

    const parts: string[] = [];
    let remaining = seconds;

    for (const unit of units) {
        const value = Math.floor(remaining / unit.seconds);
        if (value > 0) {
            const label = format === 'short'
                ? unit.short
                : `${unit.name}${value !== 1 ? 's' : ''}`;
            parts.push(`${value}${format === 'short' ? label : ` ${label}`}`);
            remaining -= value * unit.seconds;

            if (parts.length >= maxUnits) break;
        }
    }

    return parts.length > 0 ? parts.join(' ') : '0s';
}

/**
 * Format date range
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
    const start = formatDate(startDate, { format: 'short' });
    const end = formatDate(endDate, { format: 'short' });

    return `${start} - ${end}`;
}

/**
 * Check if date is today
 */
export function isToday(date: string | Date): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();

    return (
        dateObj.getDate() === today.getDate() &&
        dateObj.getMonth() === today.getMonth() &&
        dateObj.getFullYear() === today.getFullYear()
    );
}

/**
 * Get time ago string
 */
export function timeAgo(date: string | Date): string {
    return formatRelativeTime(date);
}
