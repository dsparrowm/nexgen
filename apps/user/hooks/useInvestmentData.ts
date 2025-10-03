/**
 * useInvestmentData Hook
 * Custom React hook for managing investment data, portfolio statistics, and transactions
 */

import { useState, useEffect, useCallback } from 'react';
import {
    getInvestments,
    getTransactions,
    createInvestment,
    withdrawInvestment,
    calculateInvestmentSummary,
    type Investment,
    type Transaction,
    type InvestmentSummary,
    type CreateInvestmentPayload,
    type WithdrawalResponse,
} from '@/utils/api/investmentApi';

interface UseInvestmentDataReturn {
    // Investment data
    investments: Investment[];
    investmentSummary: InvestmentSummary;
    investmentsLoading: boolean;
    investmentsError: string | null;

    // Transaction data
    transactions: Transaction[];
    transactionsPagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
    transactionsLoading: boolean;
    transactionsError: string | null;

    // Filters
    investmentStatus: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ALL';
    setInvestmentStatus: (status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ALL') => void;
    transactionType: Transaction['type'] | 'ALL';
    setTransactionType: (type: Transaction['type'] | 'ALL') => void;
    transactionStatus: Transaction['status'] | 'ALL';
    setTransactionStatus: (status: Transaction['status'] | 'ALL') => void;
    transactionPage: number;
    setTransactionPage: (page: number) => void;

    // Actions
    createNewInvestment: (payload: CreateInvestmentPayload) => Promise<Investment>;
    withdrawExistingInvestment: (investmentId: string) => Promise<WithdrawalResponse>;
    refetch: () => Promise<void>;
    refetchInvestments: () => Promise<void>;
    refetchTransactions: () => Promise<void>;
}

export function useInvestmentData(): UseInvestmentDataReturn {
    // Investment state
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [investmentSummary, setInvestmentSummary] = useState<InvestmentSummary>({
        totalInvested: 0,
        currentValue: 0,
        totalReturns: 0,
        roi: 0,
        activeInvestments: 0,
        completedInvestments: 0,
        averageReturn: 0,
        bestPerformer: null,
        worstPerformer: null,
    });
    const [investmentsLoading, setInvestmentsLoading] = useState(true);
    const [investmentsError, setInvestmentsError] = useState<string | null>(null);

    // Transaction state
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [transactionsPagination, setTransactionsPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
    });
    const [transactionsLoading, setTransactionsLoading] = useState(true);
    const [transactionsError, setTransactionsError] = useState<string | null>(null);

    // Filter state
    const [investmentStatus, setInvestmentStatus] = useState<'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ALL'>('ALL');
    const [transactionType, setTransactionType] = useState<Transaction['type'] | 'ALL'>('ALL');
    const [transactionStatus, setTransactionStatus] = useState<Transaction['status'] | 'ALL'>('ALL');
    const [transactionPage, setTransactionPage] = useState(1);

    /**
     * Fetch investments
     */
    const fetchInvestments = useCallback(async () => {
        try {
            setInvestmentsLoading(true);
            setInvestmentsError(null);

            const params: any = {
                limit: 100, // Get all investments for summary calculation
            };

            if (investmentStatus !== 'ALL') {
                params.status = investmentStatus;
            }

            const data = await getInvestments(params);
            setInvestments(data.investments);

            // Calculate summary
            const summary = calculateInvestmentSummary(data.investments);
            setInvestmentSummary(summary);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch investments';
            setInvestmentsError(errorMessage);
            console.error('Error fetching investments:', error);
        } finally {
            setInvestmentsLoading(false);
        }
    }, [investmentStatus]);

    /**
     * Fetch transactions
     */
    const fetchTransactions = useCallback(async () => {
        try {
            setTransactionsLoading(true);
            setTransactionsError(null);

            const params: any = {
                page: transactionPage,
                limit: 20,
            };

            if (transactionType !== 'ALL') {
                params.type = transactionType;
            }

            if (transactionStatus !== 'ALL') {
                params.status = transactionStatus;
            }

            const data = await getTransactions(params);
            setTransactions(data.transactions);
            setTransactionsPagination(data.pagination);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transactions';
            setTransactionsError(errorMessage);
            console.error('Error fetching transactions:', error);
        } finally {
            setTransactionsLoading(false);
        }
    }, [transactionPage, transactionType, transactionStatus]);

    /**
     * Create new investment
     */
    const createNewInvestment = useCallback(
        async (payload: CreateInvestmentPayload): Promise<Investment> => {
            try {
                const newInvestment = await createInvestment(payload);

                // Refetch investments to update the list
                await fetchInvestments();

                return newInvestment;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to create investment';
                throw new Error(errorMessage);
            }
        },
        [fetchInvestments]
    );

    /**
     * Withdraw investment
     */
    const withdrawExistingInvestment = useCallback(
        async (investmentId: string): Promise<WithdrawalResponse> => {
            try {
                const result = await withdrawInvestment(investmentId);

                // Refetch investments to update the list
                await fetchInvestments();

                return result;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to withdraw investment';
                throw new Error(errorMessage);
            }
        },
        [fetchInvestments]
    );

    /**
     * Refetch all data
     */
    const refetch = useCallback(async () => {
        await Promise.all([fetchInvestments(), fetchTransactions()]);
    }, [fetchInvestments, fetchTransactions]);

    /**
     * Refetch only investments
     */
    const refetchInvestments = useCallback(async () => {
        await fetchInvestments();
    }, [fetchInvestments]);

    /**
     * Refetch only transactions
     */
    const refetchTransactions = useCallback(async () => {
        await fetchTransactions();
    }, [fetchTransactions]);

    // Initial fetch on mount
    useEffect(() => {
        fetchInvestments();
    }, [fetchInvestments]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    return {
        // Investment data
        investments,
        investmentSummary,
        investmentsLoading,
        investmentsError,

        // Transaction data
        transactions,
        transactionsPagination,
        transactionsLoading,
        transactionsError,

        // Filters
        investmentStatus,
        setInvestmentStatus,
        transactionType,
        setTransactionType,
        transactionStatus,
        setTransactionStatus,
        transactionPage,
        setTransactionPage,

        // Actions
        createNewInvestment,
        withdrawExistingInvestment,
        refetch,
        refetchInvestments,
        refetchTransactions,
    };
}
