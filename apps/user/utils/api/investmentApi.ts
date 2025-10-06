/**
 * Investment API Utilities
 * Handles all investment-related API communications
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : 'http://localhost:8000/api';

// ==================== TypeScript Interfaces ====================

export interface MiningOperation {
    id: string;
    name: string;
    description: string;
    dailyReturn: number;
    minInvestment: number;
    maxInvestment: number;
    duration: number;
    status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
}

export interface Transaction {
    id: string;
    type: 'INVESTMENT' | 'WITHDRAWAL' | 'DEPOSIT' | 'REFERRAL_BONUS' | 'MINING_PAYOUT';
    amount: number;
    netAmount: number;
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    description: string;
    reference: string;
    createdAt: string;
    investment?: {
        id: string;
        miningOperation: {
            id: string;
            name: string;
        };
    };
}

export interface Investment {
    id: string;
    userId: string;
    miningOperationId: string;
    amount: number;
    dailyReturn: number;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    startDate: string;
    endDate: string;
    createdAt: string;
    updatedAt: string;
    miningOperation: MiningOperation;
    transactions: Transaction[];
}

export interface InvestmentsResponse {
    investments: Investment[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface TransactionsResponse {
    transactions: Transaction[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface PortfolioStats {
    totalInvested: number;
    currentValue: number;
    totalReturns: number;
    roi: number;
    activeInvestments: number;
    completedInvestments: number;
}

export interface InvestmentSummary {
    totalInvested: number;
    currentValue: number;
    totalReturns: number;
    roi: number;
    activeInvestments: number;
    completedInvestments: number;
    averageReturn: number;
    bestPerformer: string | null;
    worstPerformer: string | null;
}

export interface CreateInvestmentPayload {
    miningOperationId: string;
    amount: number;
}

export interface WithdrawalResponse {
    withdrawalAmount: number;
    penalty: number;
}

// ==================== API Functions ====================

/**
 * Get user's investments
 */
export async function getInvestments(params: {
    status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    page?: number;
    limit?: number;
} = {}): Promise<InvestmentsResponse> {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        throw new Error('Authentication token not found');
    }

    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const url = `${API_BASE_URL}/user/investments?${queryParams.toString()}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to fetch investments');
    }

    const data = await response.json();
    return data.data;
}

/**
 * Get specific investment details
 */
export async function getInvestment(investmentId: string): Promise<Investment> {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_BASE_URL}/user/investments/${investmentId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to fetch investment details');
    }

    const data = await response.json();
    return data.data.investment;
}

/**
 * Create new investment
 */
export async function createInvestment(payload: CreateInvestmentPayload): Promise<Investment> {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_BASE_URL}/user/investments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to create investment');
    }

    const data = await response.json();
    return data.data.investment;
}

/**
 * Withdraw investment (early termination with penalty)
 */
export async function withdrawInvestment(investmentId: string): Promise<WithdrawalResponse> {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_BASE_URL}/user/investments/${investmentId}/withdraw`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to withdraw investment');
    }

    const data = await response.json();
    return data.data;
}

/**
 * Get user's transaction history
 */
export async function getTransactions(params: {
    type?: 'INVESTMENT' | 'WITHDRAWAL' | 'DEPOSIT' | 'REFERRAL_BONUS' | 'MINING_PAYOUT';
    status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    page?: number;
    limit?: number;
} = {}): Promise<TransactionsResponse> {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        throw new Error('Authentication token not found');
    }

    const queryParams = new URLSearchParams();
    if (params.type) queryParams.append('type', params.type);
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const url = `${API_BASE_URL}/user/transactions?${queryParams.toString()}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to fetch transactions');
    }

    const data = await response.json();
    return data.data;
}

// ==================== Helper Functions ====================

/**
 * Calculate investment summary from investments data
 */
export function calculateInvestmentSummary(investments: Investment[]): InvestmentSummary {
    if (!investments || investments.length === 0) {
        return {
            totalInvested: 0,
            currentValue: 0,
            totalReturns: 0,
            roi: 0,
            activeInvestments: 0,
            completedInvestments: 0,
            averageReturn: 0,
            bestPerformer: null,
            worstPerformer: null,
        };
    }

    let totalInvested = 0;
    let currentValue = 0;
    let totalReturns = 0;
    let activeCount = 0;
    let completedCount = 0;
    const returns: { name: string; return: number }[] = [];

    investments.forEach((investment) => {
        const amount = Number(investment.amount);
        totalInvested += amount;

        if (investment.status === 'ACTIVE') {
            activeCount++;
            // Calculate current value based on days elapsed
            const startDate = new Date(investment.startDate);
            const now = new Date();
            const daysElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const dailyReturn = Number(investment.dailyReturn);
            const currentReturn = amount * (dailyReturn / 100) * daysElapsed;
            currentValue += amount + currentReturn;
            totalReturns += currentReturn;

            returns.push({
                name: investment.miningOperation.name,
                return: (currentReturn / amount) * 100,
            });
        } else if (investment.status === 'COMPLETED') {
            completedCount++;
            // For completed investments, sum all transactions
            const totalPayout = investment.transactions
                .filter((t) => t.type === 'MINING_PAYOUT' && t.status === 'COMPLETED')
                .reduce((sum, t) => sum + Number(t.amount), 0);
            currentValue += amount + totalPayout;
            totalReturns += totalPayout;

            returns.push({
                name: investment.miningOperation.name,
                return: (totalPayout / amount) * 100,
            });
        }
    });

    const roi = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;
    const averageReturn = returns.length > 0 ? returns.reduce((sum, r) => sum + r.return, 0) / returns.length : 0;

    // Find best and worst performers
    let bestPerformer: string | null = null;
    let worstPerformer: string | null = null;
    if (returns.length > 0) {
        const sorted = [...returns].sort((a, b) => b.return - a.return);
        bestPerformer = sorted[0]?.name ?? null;
        worstPerformer = sorted[sorted.length - 1]?.name ?? null;
    }

    return {
        totalInvested,
        currentValue,
        totalReturns,
        roi,
        activeInvestments: activeCount,
        completedInvestments: completedCount,
        averageReturn,
        bestPerformer,
        worstPerformer,
    };
}

/**
 * Get status color for investment status
 */
export function getInvestmentStatusColor(status: Investment['status']): string {
    switch (status) {
        case 'ACTIVE':
            return 'text-green-500';
        case 'COMPLETED':
            return 'text-blue-500';
        case 'CANCELLED':
            return 'text-red-500';
        default:
            return 'text-gray-500';
    }
}

/**
 * Get status badge color for investment status
 */
export function getInvestmentStatusBadgeColor(status: Investment['status']): string {
    switch (status) {
        case 'ACTIVE':
            return 'bg-green-500/20 text-green-500';
        case 'COMPLETED':
            return 'bg-blue-500/20 text-blue-500';
        case 'CANCELLED':
            return 'bg-red-500/20 text-red-500';
        default:
            return 'bg-gray-500/20 text-gray-500';
    }
}

/**
 * Get transaction type color
 */
export function getTransactionTypeColor(type: Transaction['type']): string {
    switch (type) {
        case 'INVESTMENT':
            return 'text-blue-500';
        case 'WITHDRAWAL':
            return 'text-orange-500';
        case 'DEPOSIT':
            return 'text-green-500';
        case 'REFERRAL_BONUS':
            return 'text-purple-500';
        case 'MINING_PAYOUT':
            return 'text-gold-500';
        default:
            return 'text-gray-500';
    }
}

/**
 * Get transaction type background color
 */
export function getTransactionTypeBgColor(type: Transaction['type']): string {
    switch (type) {
        case 'INVESTMENT':
            return 'bg-blue-500/20';
        case 'WITHDRAWAL':
            return 'bg-orange-500/20';
        case 'DEPOSIT':
            return 'bg-green-500/20';
        case 'REFERRAL_BONUS':
            return 'bg-purple-500/20';
        case 'MINING_PAYOUT':
            return 'bg-gold-500/20';
        default:
            return 'bg-gray-500/20';
    }
}

/**
 * Format investment for display
 */
export function formatInvestment(investment: Investment) {
    const startDate = new Date(investment.startDate);
    const endDate = new Date(investment.endDate);
    const now = new Date();

    const daysElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const progress = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;

    return {
        ...investment,
        daysElapsed,
        totalDays,
        daysRemaining,
        progress: Math.min(100, Math.max(0, progress)),
    };
}
