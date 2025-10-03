/**
 * Number formatting utilities for dashboard
 */

/**
 * Format currency (USD)
 */
export function formatCurrency(
    amount: number | string,
    options: {
        decimals?: number;
        showSymbol?: boolean;
        compact?: boolean;
    } = {}
): string {
    const { decimals = 2, showSymbol = true, compact = false } = options;

    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) return showSymbol ? '$0.00' : '0.00';

    if (compact) {
        // Compact notation for large numbers
        if (numAmount >= 1000000) {
            return `${showSymbol ? '$' : ''}${(numAmount / 1000000).toFixed(1)}M`;
        }
        if (numAmount >= 1000) {
            return `${showSymbol ? '$' : ''}${(numAmount / 1000).toFixed(1)}K`;
        }
    }

    const formatted = numAmount.toFixed(decimals);
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return showSymbol ? `$${parts.join('.')}` : parts.join('.');
}

/**
 * Format cryptocurrency amount
 */
export function formatCrypto(
    amount: number | string,
    options: {
        symbol?: string;
        decimals?: number;
    } = {}
): string {
    const { symbol = 'BTC', decimals = 8 } = options;

    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) return `0 ${symbol}`;

    // Remove trailing zeros
    let formatted = numAmount.toFixed(decimals);
    formatted = formatted.replace(/\.?0+$/, '');

    return `${formatted} ${symbol}`;
}

/**
 * Format percentage
 */
export function formatPercentage(
    value: number | string,
    options: {
        decimals?: number;
        showSign?: boolean;
        showSymbol?: boolean;
    } = {}
): string {
    const { decimals = 2, showSign = false, showSymbol = true } = options;

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) return showSymbol ? '0%' : '0';

    const sign = showSign && numValue > 0 ? '+' : '';
    const formatted = numValue.toFixed(decimals);

    return `${sign}${formatted}${showSymbol ? '%' : ''}`;
}

/**
 * Format hashrate (TH/s, GH/s, etc.)
 */
export function formatHashrate(
    hashrate: number | string,
    options: {
        unit?: 'TH/s' | 'GH/s' | 'MH/s' | 'auto';
        decimals?: number;
    } = {}
): string {
    const { unit = 'auto', decimals = 2 } = options;

    const numHashrate = typeof hashrate === 'string' ? parseFloat(hashrate) : hashrate;

    if (isNaN(numHashrate)) return '0 TH/s';

    if (unit === 'auto') {
        // Auto-select appropriate unit
        if (numHashrate >= 1000) {
            return `${(numHashrate / 1000).toFixed(decimals)} PH/s`;
        }
        if (numHashrate >= 1) {
            return `${numHashrate.toFixed(decimals)} TH/s`;
        }
        if (numHashrate >= 0.001) {
            return `${(numHashrate * 1000).toFixed(decimals)} GH/s`;
        }
        return `${(numHashrate * 1000000).toFixed(decimals)} MH/s`;
    }

    return `${numHashrate.toFixed(decimals)} ${unit}`;
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatCompactNumber(value: number | string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) return '0';

    if (numValue >= 1000000000) {
        return `${(numValue / 1000000000).toFixed(1)}B`;
    }
    if (numValue >= 1000000) {
        return `${(numValue / 1000000).toFixed(1)}M`;
    }
    if (numValue >= 1000) {
        return `${(numValue / 1000).toFixed(1)}K`;
    }

    return numValue.toFixed(0);
}

/**
 * Parse string currency to number
 */
export function parseCurrency(value: string): number {
    return parseFloat(value.replace(/[^0-9.-]+/g, ''));
}

/**
 * Format decimal number
 */
export function formatDecimal(
    value: number | string,
    decimals: number = 2
): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) return '0';

    return numValue.toFixed(decimals);
}
