/**
 * Custom Hook for Mining Data Management
 * Handles fetching and managing user's mining investments and available operations
 */

import { useState, useEffect, useCallback } from 'react';
import {
    getUserMiningInvestments,
    getMiningOperations,
    getMiningStats,
    startMiningOperation,
    stopMiningOperation,
    calculateInvestmentSummary,
    type UserInvestment,
    type MiningOperation,
    type MiningStats,
} from '@/utils/api/miningApi';

interface UseMiningDataReturn {
    // User investments
    investments: UserInvestment[];
    investmentSummary: {
        totalInvested: number;
        totalEarnings: number;
        totalValue: number;
        activeCount: number;
        averageDailyReturn: number;
        averagePerformance: number;
        roi: number;
    };

    // Available operations
    operations: MiningOperation[];
    operationsPagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    } | null;

    // Global stats
    stats: MiningStats | null;

    // Loading states
    loading: boolean;
    investmentsLoading: boolean;
    operationsLoading: boolean;
    statsLoading: boolean;

    // Error states
    error: string | null;
    investmentsError: string | null;
    operationsError: string | null;
    statsError: string | null;

    // Actions
    refetch: () => Promise<void>;
    refetchInvestments: () => Promise<void>;
    refetchOperations: () => Promise<void>;
    refetchStats: () => Promise<void>;
    startOperation: (operationId: string, amount: number) => Promise<{
        success: boolean;
        message?: string;
        error?: string;
    }>;
    stopOperation: (investmentId: string) => Promise<{
        success: boolean;
        message?: string;
        error?: string;
    }>;

    // Filters
    setInvestmentStatus: (status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | undefined) => void;
    setOperationRiskLevel: (riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | undefined) => void;
}

export function useMiningData(): UseMiningDataReturn {
    // User investments state
    const [investments, setInvestments] = useState<UserInvestment[]>([]);
    const [investmentSummary, setInvestmentSummary] = useState({
        totalInvested: 0,
        totalEarnings: 0,
        totalValue: 0,
        activeCount: 0,
        averageDailyReturn: 0,
        averagePerformance: 0,
        roi: 0,
    });
    const [investmentsLoading, setInvestmentsLoading] = useState(true);
    const [investmentsError, setInvestmentsError] = useState<string | null>(null);
    const [investmentStatus, setInvestmentStatus] = useState<'ACTIVE' | 'COMPLETED' | 'CANCELLED' | undefined>('ACTIVE');

    // Available operations state
    const [operations, setOperations] = useState<MiningOperation[]>([]);
    const [operationsPagination, setOperationsPagination] = useState<{
        page: number;
        limit: number;
        total: number;
        pages: number;
    } | null>(null);
    const [operationsLoading, setOperationsLoading] = useState(true);
    const [operationsError, setOperationsError] = useState<string | null>(null);
    const [operationRiskLevel, setOperationRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH' | undefined>(undefined);

    // Global stats state
    const [stats, setStats] = useState<MiningStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);

    // Combined loading and error states
    const loading = investmentsLoading || operationsLoading || statsLoading;
    const error = investmentsError || operationsError || statsError;

    /**
     * Fetch user's mining investments
     */
    const fetchInvestments = useCallback(async () => {
        setInvestmentsLoading(true);
        setInvestmentsError(null);

        try {
            const response = await getUserMiningInvestments(1, 50, investmentStatus);

            if (response.success && response.data) {
                setInvestments(response.data.investments);

                // Calculate summary statistics
                const summary = calculateInvestmentSummary(response.data.investments);
                setInvestmentSummary(summary);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch investments';
            setInvestmentsError(errorMessage);
            console.error('Error fetching investments:', err);
        } finally {
            setInvestmentsLoading(false);
        }
    }, [investmentStatus]);

    /**
     * Fetch available mining operations
     */
    const fetchOperations = useCallback(async () => {
        setOperationsLoading(true);
        setOperationsError(null);

        try {
            const response = await getMiningOperations(1, 20, operationRiskLevel);

            if (response.success && response.data) {
                setOperations(response.data.operations);
                setOperationsPagination(response.data.pagination);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch operations';
            setOperationsError(errorMessage);
            console.error('Error fetching operations:', err);
        } finally {
            setOperationsLoading(false);
        }
    }, [operationRiskLevel]);

    /**
     * Fetch global mining statistics
     */
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        setStatsError(null);

        try {
            const response = await getMiningStats();

            if (response.success && response.data) {
                setStats(response.data);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stats';
            setStatsError(errorMessage);
            console.error('Error fetching stats:', err);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    /**
     * Start a new mining operation
     */
    const startOperation = useCallback(async (operationId: string, amount: number) => {
        try {
            const response = await startMiningOperation(operationId, amount);

            if (response.success) {
                // Refetch investments to show the new one
                await fetchInvestments();
                // Refetch operations to update available capacity
                await fetchOperations();

                return {
                    success: true,
                    message: response.message || 'Mining operation started successfully',
                };
            }

            return {
                success: false,
                error: 'Failed to start mining operation',
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to start mining operation';
            console.error('Error starting mining operation:', err);

            return {
                success: false,
                error: errorMessage,
            };
        }
    }, [fetchInvestments, fetchOperations]);

    /**
     * Stop a mining operation
     */
    const stopOperation = useCallback(async (investmentId: string) => {
        try {
            const response = await stopMiningOperation(investmentId);

            if (response.success) {
                // Refetch investments to update status
                await fetchInvestments();

                return {
                    success: true,
                    message: response.message || 'Mining operation stopped successfully',
                };
            }

            return {
                success: false,
                error: 'Failed to stop mining operation',
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to stop mining operation';
            console.error('Error stopping mining operation:', err);

            return {
                success: false,
                error: errorMessage,
            };
        }
    }, [fetchInvestments]);

    /**
     * Refetch all data
     */
    const refetch = useCallback(async () => {
        await Promise.all([
            fetchInvestments(),
            fetchOperations(),
            fetchStats(),
        ]);
    }, [fetchInvestments, fetchOperations, fetchStats]);

    // Fetch data on mount and when filters change
    useEffect(() => {
        fetchInvestments();
    }, [fetchInvestments]);

    useEffect(() => {
        fetchOperations();
    }, [fetchOperations]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return {
        // User investments
        investments,
        investmentSummary,

        // Available operations
        operations,
        operationsPagination,

        // Global stats
        stats,

        // Loading states
        loading,
        investmentsLoading,
        operationsLoading,
        statsLoading,

        // Error states
        error,
        investmentsError,
        operationsError,
        statsError,

        // Actions
        refetch,
        refetchInvestments: fetchInvestments,
        refetchOperations: fetchOperations,
        refetchStats: fetchStats,
        startOperation,
        stopOperation,

        // Filters
        setInvestmentStatus,
        setOperationRiskLevel,
    };
}
