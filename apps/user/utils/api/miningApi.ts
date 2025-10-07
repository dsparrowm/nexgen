/**
 * Mining API Utilities
 * Handles all mining-related API calls
 */

import { getApiBase } from '@/lib/axiosInstance';

const API_BASE_URL = getApiBase(true);

// ==================== Types ====================

export interface MiningOperation {
    id: string;
    name: string;
    description: string;
    minInvestment: number;
    maxInvestment: number;
    dailyReturn: number;
    duration: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    totalCapacity: number;
    currentCapacity: number;
    availableCapacity: number;
    startDate: string;
    endDate: string | null;
    imageUrl: string | null;
    features: string[];
    activeInvestments: number;
    utilizationRate?: number;
    estimatedMonthlyReturn?: number;
}

export interface UserInvestment {
    id: string;
    userId: string;
    miningOperationId: string;
    amount: number;
    dailyReturn: number;
    startDate: string;
    endDate: string;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    currentEarnings: number;
    expectedEarnings: number;
    performance: number;
    miningOperation: MiningOperation;
    payouts?: Payout[];
}

export interface Payout {
    id: string;
    investmentId: string;
    amount: number;
    date: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface MiningStats {
    operations: {
        total: number;
        active: number;
    };
    capacity: {
        total: number;
        utilized: number;
        available: number;
        utilizationRate: number;
    };
    investments: {
        active: number;
    };
    performance: {
        averageDailyReturn: number;
        averageMonthlyReturn: number;
        averageYearlyReturn: number;
    };
}

export interface MiningOperationsResponse {
    success: boolean;
    data: {
        operations: MiningOperation[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
}

export interface UserInvestmentsResponse {
    success: boolean;
    data: {
        investments: UserInvestment[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
}

export interface MiningStatsResponse {
    success: boolean;
    data: MiningStats;
}

export interface StartMiningRequest {
    operationId: string;
    amount: number;
}

export interface StartMiningResponse {
    success: boolean;
    data: {
        investment: UserInvestment;
    };
    message: string;
}

// ==================== Helper Functions ====================

async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('authToken');

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (options.headers) {
        Object.assign(headers, options.headers);
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || 'An error occurred');
    }

    return data;
}

// ==================== Public Mining Operations ====================

/**
 * Get all available mining operations
 */
export async function getMiningOperations(
    page: number = 1,
    limit: number = 20,
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
): Promise<MiningOperationsResponse> {
    let endpoint = `public/mining?page=${page}&limit=${limit}`;

    if (riskLevel) {
        endpoint += `&riskLevel=${riskLevel}`;
    }

    return apiFetch(endpoint);
}

/**
 * Get specific mining operation details
 */
export async function getMiningOperationById(operationId: string): Promise<{
    success: boolean;
    data: { operation: MiningOperation };
}> {
    return apiFetch(`public/mining/${operationId}`);
}

/**
 * Get global mining statistics
 */
export async function getMiningStats(): Promise<MiningStatsResponse> {
    return apiFetch('public/mining/stats');
}

// ==================== User Mining Operations ====================

/**
 * Get user's mining investments
 */
export async function getUserMiningInvestments(
    page: number = 1,
    limit: number = 20,
    status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
): Promise<UserInvestmentsResponse> {
    let endpoint = `user/mining?page=${page}&limit=${limit}`;

    if (status) {
        endpoint += `&status=${status}`;
    }

    return apiFetch(endpoint);
}

/**
 * Start a new mining operation (create investment)
 */
export async function startMiningOperation(
    operationId: string,
    amount: number
): Promise<StartMiningResponse> {
    return apiFetch('user/mining/start', {
        method: 'POST',
        body: JSON.stringify({ operationId, amount }),
    });
}

/**
 * Stop a mining operation (complete investment early)
 */
export async function stopMiningOperation(investmentId: string): Promise<{
    success: boolean;
    message: string;
}> {
    return apiFetch(`user/mining/${investmentId}/stop`, {
        method: 'PUT',
    });
}

// ==================== Statistics & Analytics ====================

/**
 * Calculate investment summary from user investments
 */
export function calculateInvestmentSummary(investments: UserInvestment[]) {
    const activeInvestments = investments.filter(inv => inv.status === 'ACTIVE');

    const totalInvested = activeInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalEarnings = activeInvestments.reduce((sum, inv) => sum + inv.currentEarnings, 0);
    const averageReturn = activeInvestments.length > 0
        ? activeInvestments.reduce((sum, inv) => sum + inv.dailyReturn, 0) / activeInvestments.length
        : 0;

    const averagePerformance = activeInvestments.length > 0
        ? activeInvestments.reduce((sum, inv) => sum + inv.performance, 0) / activeInvestments.length
        : 0;

    return {
        totalInvested,
        totalEarnings,
        totalValue: totalInvested + totalEarnings,
        activeCount: activeInvestments.length,
        averageDailyReturn: averageReturn,
        averagePerformance,
        roi: totalInvested > 0 ? (totalEarnings / totalInvested) * 100 : 0,
    };
}

/**
 * Format mining operation for display
 */
export function formatMiningOperation(operation: MiningOperation) {
    const capacityUtilization = operation.totalCapacity > 0
        ? (operation.currentCapacity / operation.totalCapacity) * 100
        : 0;

    const isAvailable = operation.availableCapacity > 0;

    const estimatedDaily = operation.dailyReturn * 100; // Convert to percentage
    const estimatedMonthly = estimatedDaily * 30;
    const estimatedYearly = estimatedDaily * 365;

    return {
        ...operation,
        capacityUtilization: Math.round(capacityUtilization * 100) / 100,
        isAvailable,
        estimatedReturns: {
            daily: estimatedDaily,
            monthly: estimatedMonthly,
            yearly: estimatedYearly,
        },
        formattedCapacity: `${operation.currentCapacity.toLocaleString()} / ${operation.totalCapacity.toLocaleString()}`,
    };
}

/**
 * Get risk level color for UI
 */
export function getRiskLevelColor(riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'): {
    text: string;
    bg: string;
} {
    switch (riskLevel) {
        case 'LOW':
            return { text: 'text-green-500', bg: 'bg-green-500/20' };
        case 'MEDIUM':
            return { text: 'text-yellow-500', bg: 'bg-yellow-500/20' };
        case 'HIGH':
            return { text: 'text-red-500', bg: 'bg-red-500/20' };
        default:
            return { text: 'text-gray-500', bg: 'bg-gray-500/20' };
    }
}

/**
 * Get investment status color for UI
 */
export function getInvestmentStatusColor(status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'): {
    text: string;
    bg: string;
} {
    switch (status) {
        case 'ACTIVE':
            return { text: 'text-green-500', bg: 'bg-green-500/20' };
        case 'COMPLETED':
            return { text: 'text-blue-500', bg: 'bg-blue-500/20' };
        case 'CANCELLED':
            return { text: 'text-red-500', bg: 'bg-red-500/20' };
        default:
            return { text: 'text-gray-500', bg: 'bg-gray-500/20' };
    }
}
