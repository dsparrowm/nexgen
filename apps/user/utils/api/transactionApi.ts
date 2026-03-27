/**
 * Transaction API utilities
 * Centralized API calls for transaction data
 */

import { getApiBase } from '@/lib/axiosInstance';
import type { SupportedAssetSymbol } from './assetsApi';

const API_BASE_URL = getApiBase(true);

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code: string;
    };
    message?: string;
}

interface Transaction {
    id: string;
    userId: string;
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'INVESTMENT' | 'PAYOUT' | 'BONUS' | 'REFUND' | 'REFERRAL_BONUS' | 'MINING_PAYOUT';
    amount: number;
    currency: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
    description?: string;
    createdAt: string;
    updatedAt: string;
    investmentId?: string;
    investment?: any;
    miningOperationId?: string;
    miningOperation?: any;
    assetSymbol?: SupportedAssetSymbol;
    assetName?: string;
    assetQuantity?: number;
    assetPrice?: number;
    metadata?: {
        assetSymbol?: SupportedAssetSymbol;
        assetName?: string;
        assetQuantity?: number;
        assetPrice?: number;
        sourceType?: 'ASSET' | 'MINING';
        [key: string]: unknown;
    };
}

interface TransactionsResponse {
    transactions: Transaction[];
    summary: {
        deposits: number;
        withdrawals: number;
        investments: number;
        payouts: number;
        totalTransactions: number;
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

interface TransactionFilters {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
}

const normalizeTransaction = (transaction: any): Transaction => {
    const assetSymbol =
        transaction.assetSymbol ||
        transaction.assetPosition?.symbol ||
        transaction.metadata?.assetSymbol;
    const assetName =
        transaction.assetName ||
        transaction.metadata?.assetName;
    const assetQuantity =
        transaction.assetQuantity ||
        transaction.metadata?.assetQuantity ||
        transaction.metadata?.unitsPurchased ||
        transaction.assetPosition?.unitsHeld;
    const assetPrice =
        transaction.assetPrice ||
        transaction.metadata?.assetPrice ||
        transaction.metadata?.referencePrice ||
        transaction.assetPosition?.currentPrice;

    return {
        ...transaction,
        currency: transaction.currency || transaction.metadata?.currency || assetSymbol || 'USD',
        assetSymbol,
        assetName,
        assetQuantity: assetQuantity !== undefined ? Number(assetQuantity) : undefined,
        assetPrice: assetPrice !== undefined ? Number(assetPrice) : undefined,
    };
};

/**
 * Get authentication token from localStorage
 */
const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
};

/**
 * Generic API fetch wrapper with auth
 */
async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const token = getAuthToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error || {
                    message: 'Request failed',
                    code: 'REQUEST_FAILED'
                }
            };
        }

        return {
            success: true,
            data: data.data || data,
        };
    } catch (error) {
        console.error('API fetch error:', error);
        return {
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'Network error',
                code: 'NETWORK_ERROR'
            }
        };
    }
}

/**
 * Get user transactions with filters and pagination
 */
export async function getTransactions(filters: TransactionFilters = {}) {
    const queryParams = new URLSearchParams();

    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
    if (filters.type && filters.type !== 'all') queryParams.append('type', filters.type);
    if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);

    const queryString = queryParams.toString();
    const endpoint = `user/transactions${queryString ? `?${queryString}` : ''}`;

    const response = await apiFetch<TransactionsResponse>(endpoint);

    if (response.success && response.data) {
        return {
            ...response,
            data: {
                ...response.data,
                transactions: (response.data.transactions || []).map((transaction) => normalizeTransaction(transaction)),
            },
        };
    }

    return response;
}

/**
 * Get a specific transaction by ID
 */
export async function getTransactionById(transactionId: string) {
    const response = await apiFetch<Transaction>(`user/transactions/${transactionId}`);

    if (response.success && response.data) {
        return {
            ...response,
            data: normalizeTransaction(response.data),
        };
    }

    return response;
}

/**
 * Create a deposit transaction
 */
export async function createDeposit(data: {
    amount: number;
    currency: string;
    paymentMethod: string;
}) {
    const response = await apiFetch<Transaction>('user/transactions/deposit', {
        method: 'POST',
        body: JSON.stringify(data),
    });

    if (response.success && response.data) {
        return {
            ...response,
            data: normalizeTransaction(response.data),
        };
    }

    return response;
}

/**
 * Create a withdrawal transaction
 */
export async function createWithdrawal(data: {
    amount: number;
    currency: string;
    withdrawalAddress: string;
}) {
    const response = await apiFetch<Transaction>('user/transactions/withdraw', {
        method: 'POST',
        body: JSON.stringify(data),
    });

    if (response.success && response.data) {
        return {
            ...response,
            data: normalizeTransaction(response.data),
        };
    }

    return response;
}

/**
 * Export transactions to CSV (client-side generation)
 */
export function exportTransactionsToCSV(transactions: Transaction[], filename: string = 'transactions') {
    const headers = ['Date', 'Type', 'Description', 'Asset', 'Amount', 'Currency', 'Status'];
    const rows = transactions.map(tx => [
        new Date(tx.createdAt).toLocaleDateString(),
        tx.type,
        tx.description || '-',
        tx.assetName || tx.assetSymbol || tx.metadata?.assetName || tx.metadata?.assetSymbol || '-',
        tx.amount.toString(),
        tx.currency,
        tx.status
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export type { Transaction, TransactionsResponse, TransactionFilters };
