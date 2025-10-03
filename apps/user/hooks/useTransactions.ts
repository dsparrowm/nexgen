/**
 * Custom hook for fetching and managing transaction data
 */

import { useState, useEffect, useCallback } from 'react';
import {
    getTransactions,
    type Transaction,
    type TransactionsResponse,
    type TransactionFilters
} from '@/utils/api/transactionApi';

interface UseTransactionsReturn {
    transactions: Transaction[];
    summary: TransactionsResponse['summary'] | null;
    pagination: TransactionsResponse['pagination'] | null;
    loading: boolean;
    error: string | null;
    filters: TransactionFilters;
    setFilters: (filters: Partial<TransactionFilters>) => void;
    refetch: () => Promise<void>;
    nextPage: () => void;
    prevPage: () => void;
    goToPage: (page: number) => void;
}

export function useTransactions(initialFilters: TransactionFilters = {}): UseTransactionsReturn {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState<TransactionsResponse['summary'] | null>(null);
    const [pagination, setPagination] = useState<TransactionsResponse['pagination'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFiltersState] = useState<TransactionFilters>({
        page: 1,
        limit: 20,
        type: 'all',
        status: 'all',
        ...initialFilters
    });

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await getTransactions(filters);

            if (response.success && response.data) {
                setTransactions(response.data.transactions || []);
                setSummary(response.data.summary || null);
                setPagination(response.data.pagination || null);
            } else {
                setError(response.error?.message || 'Failed to fetch transactions');
                setTransactions([]);
            }
        } catch (err) {
            console.error('Transaction fetch error:', err);
            setError('An unexpected error occurred');
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const setFilters = useCallback((newFilters: Partial<TransactionFilters>) => {
        setFiltersState(prev => ({
            ...prev,
            ...newFilters,
            // Reset to page 1 when filters change (except when page is explicitly set)
            page: newFilters.page !== undefined ? newFilters.page : 1
        }));
    }, []);

    const nextPage = useCallback(() => {
        if (pagination && pagination.page < pagination.pages) {
            setFilters({ page: pagination.page + 1 });
        }
    }, [pagination, setFilters]);

    const prevPage = useCallback(() => {
        if (pagination && pagination.page > 1) {
            setFilters({ page: pagination.page - 1 });
        }
    }, [pagination, setFilters]);

    const goToPage = useCallback((page: number) => {
        if (pagination && page >= 1 && page <= pagination.pages) {
            setFilters({ page });
        }
    }, [pagination, setFilters]);

    return {
        transactions,
        summary,
        pagination,
        loading,
        error,
        filters,
        setFilters,
        refetch: fetchTransactions,
        nextPage,
        prevPage,
        goToPage
    };
}
