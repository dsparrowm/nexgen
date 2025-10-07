/**
 * Transaction API utilities
 * Centralized API calls for transaction data
 */

import { getApiBase } from '@/lib/axiosInstance';

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
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'INVESTMENT' | 'PAYOUT';
    amount: number;
    currency: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    description?: string;
    createdAt: string;
    updatedAt: string;
    investmentId?: string;
    investment?: any;
    miningOperationId?: string;
    miningOperation?: any;
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

    return apiFetch<TransactionsResponse>(endpoint);
}

/**
 * Get a specific transaction by ID
 */
export async function getTransactionById(transactionId: string) {
    return apiFetch<Transaction>(`user/transactions/${transactionId}`);
}

/**
 * Create a deposit transaction
 */
export async function createDeposit(data: {
    amount: number;
    currency: string;
    paymentMethod: string;
}) {
    return apiFetch<Transaction>('user/transactions/deposit', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Create a withdrawal transaction
 */
export async function createWithdrawal(data: {
    amount: number;
    currency: string;
    withdrawalAddress: string;
}) {
    return apiFetch<Transaction>('user/transactions/withdraw', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Export transactions to CSV (client-side generation)
 */
export function exportTransactionsToCSV(transactions: Transaction[], filename: string = 'transactions') {
    const headers = ['Date', 'Type', 'Description', 'Amount', 'Currency', 'Status'];
    const rows = transactions.map(tx => [
        new Date(tx.createdAt).toLocaleDateString(),
        tx.type,
        tx.description || '-',
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
