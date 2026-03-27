/**
 * Asset API Utilities
 * Handles supported crypto assets, asset positions, and asset purchases
 */

import { getApiBase } from '@/lib/axiosInstance';

const API_BASE_URL = getApiBase(true);

export type SupportedAssetSymbol = 'BTC' | 'ETH' | 'USDT' | 'BNB';

export type AssetStatus = 'ACTIVE' | 'PAUSED' | 'COMING_SOON';

export interface SupportedAsset {
    symbol: SupportedAssetSymbol;
    name: string;
    network?: string;
    currentPrice: number;
    priceChange24h?: number;
    minPurchase?: number;
    maxPurchase?: number;
    decimalPlaces?: number;
    description?: string;
    status?: AssetStatus;
}

export interface AssetPosition {
    id: string;
    userId?: string;
    assetSymbol: SupportedAssetSymbol;
    assetName?: string;
    amountInvested: number;
    unitsHeld: number;
    averageEntryPrice?: number;
    currentPrice: number;
    currentValue?: number;
    unrealizedPnL?: number;
    unrealizedPnLPercent?: number;
    status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'PAUSED';
    createdAt?: string;
    updatedAt?: string;
    lastUpdatedAt?: string;
}

export interface AssetPortfolioAllocation {
    symbol: SupportedAssetSymbol;
    name: string;
    value: number;
    percentage: number;
    color: string;
}

export interface AssetPortfolioSummary {
    totalInvested: number;
    currentValue: number;
    unrealizedPnL: number;
    unrealizedPnLPercent: number;
    activePositions: number;
    completedPositions: number;
    topHolding: SupportedAssetSymbol | null;
    allocations: AssetPortfolioAllocation[];
}

export interface AssetPositionsResponse {
    positions: AssetPosition[];
    supportedAssets: SupportedAsset[];
    summary: AssetPortfolioSummary;
}

export interface BuyAssetPayload {
    assetSymbol: SupportedAssetSymbol;
    amount: number;
}

export interface AssetPurchaseResponse {
    position?: AssetPosition;
    transaction?: {
        id: string;
        type?: string;
        amount?: number;
        currency?: string;
        status?: string;
        createdAt?: string;
    };
    summary?: AssetPortfolioSummary;
}

export const ASSET_COLORS: Record<SupportedAssetSymbol, string> = {
    BTC: '#F59E0B',
    ETH: '#8B5CF6',
    USDT: '#10B981',
    BNB: '#F97316',
};

export const DEFAULT_SUPPORTED_ASSETS: SupportedAsset[] = [
    {
        symbol: 'BTC',
        name: 'Bitcoin',
        network: 'Bitcoin Network',
        currentPrice: 0,
        priceChange24h: 0,
        minPurchase: 25,
        decimalPlaces: 8,
        status: 'ACTIVE',
        description: 'Digital gold and a long-term store of value',
    },
    {
        symbol: 'ETH',
        name: 'Ethereum',
        network: 'Ethereum Mainnet',
        currentPrice: 0,
        priceChange24h: 0,
        minPurchase: 25,
        decimalPlaces: 6,
        status: 'ACTIVE',
        description: 'Programmable asset for smart contract exposure',
    },
    {
        symbol: 'USDT',
        name: 'Tether',
        network: 'TRON (TRC-20)',
        currentPrice: 1,
        priceChange24h: 0,
        minPurchase: 10,
        decimalPlaces: 2,
        status: 'ACTIVE',
        description: 'Dollar-pegged stable asset',
    },
    {
        symbol: 'BNB',
        name: 'BNB',
        network: 'BNB Smart Chain (BEP-20)',
        currentPrice: 0,
        priceChange24h: 0,
        minPurchase: 25,
        decimalPlaces: 6,
        status: 'ACTIVE',
        description: 'Binance ecosystem asset exposure',
    },
];

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code: string;
    };
    message?: string;
}

const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
};

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
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
                    code: 'REQUEST_FAILED',
                },
            };
        }

        return data;
    } catch (error) {
        return {
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'Network error',
                code: 'NETWORK_ERROR',
            },
        };
    }
}

const normalizeSymbol = (symbol: string | undefined, fallback: SupportedAssetSymbol): SupportedAssetSymbol => {
    if (symbol === 'BTC' || symbol === 'ETH' || symbol === 'USDT' || symbol === 'BNB') {
        return symbol;
    }

    return fallback;
};

const normalizeSupportedAsset = (asset: Partial<SupportedAsset>, index: number): SupportedAsset => {
    const fallback = DEFAULT_SUPPORTED_ASSETS[index % DEFAULT_SUPPORTED_ASSETS.length] || DEFAULT_SUPPORTED_ASSETS[0]!;

    return {
        symbol: normalizeSymbol(asset.symbol, fallback.symbol),
        name: asset.name || fallback.name,
        network: asset.network || fallback.network,
        currentPrice: Number((asset as any).currentPrice ?? (asset as any).referencePrice ?? fallback.currentPrice ?? 0),
        priceChange24h: Number(asset.priceChange24h ?? fallback.priceChange24h ?? 0),
        minPurchase: Number((asset as any).minPurchase ?? (asset as any).minInvestment ?? fallback.minPurchase ?? 0),
        maxPurchase: asset.maxPurchase !== undefined ? Number(asset.maxPurchase) : fallback.maxPurchase,
        decimalPlaces: (asset as any).decimalPlaces ?? (asset as any).precision ?? fallback.decimalPlaces,
        description: asset.description || fallback.description,
        status: asset.status || fallback.status,
    };
};

const buildAllocationColor = (symbol: SupportedAssetSymbol): string => ASSET_COLORS[symbol];

const normalizePosition = (position: any): AssetPosition => {
    const assetSymbol = normalizeSymbol(position.assetSymbol || position.symbol, 'BTC');
    const amountInvested = Number(position.amountInvested || 0);
    const currentValue = Number(position.currentValue ?? 0);
    const unrealizedPnL = Number(position.unrealizedPnL ?? position.profitLoss ?? currentValue - amountInvested);

    return {
        id: position.id,
        userId: position.userId,
        assetSymbol,
        assetName: position.assetName || position.name,
        amountInvested,
        unitsHeld: Number(position.unitsHeld || 0),
        averageEntryPrice: Number(position.averageEntryPrice ?? 0),
        currentPrice: Number(position.currentPrice ?? 0),
        currentValue,
        unrealizedPnL,
        unrealizedPnLPercent: amountInvested > 0 ? (unrealizedPnL / amountInvested) * 100 : 0,
        status: position.status || 'ACTIVE',
        createdAt: position.createdAt,
        updatedAt: position.updatedAt,
        lastUpdatedAt: position.lastUpdatedAt || position.lastValuationAt || position.updatedAt,
    };
};

const normalizeSummary = (
    rawSummary: any,
    positions: AssetPosition[],
    supportedAssets: SupportedAsset[]
): AssetPortfolioSummary => {
    if (!rawSummary) {
        return calculateAssetPortfolioSummary(positions, supportedAssets);
    }

    const allocations = (rawSummary.allocations || rawSummary.allocation || []).map((item: any) => ({
        symbol: normalizeSymbol(item.symbol, 'BTC'),
        name: item.name || normalizeSymbol(item.symbol, 'BTC'),
        value: Number(item.value ?? item.currentValue ?? 0),
        percentage: Number(item.percentage ?? 0),
        color: item.color || item.allocationColor || buildAllocationColor(normalizeSymbol(item.symbol, 'BTC')),
    }));

    const totalInvested = Number(rawSummary.totalInvested ?? 0);
    const currentValue = Number(rawSummary.currentValue ?? rawSummary.totalCurrentValue ?? 0);
    const unrealizedPnL = Number(rawSummary.unrealizedPnL ?? rawSummary.totalPnL ?? rawSummary.totalProfitLoss ?? currentValue - totalInvested);
    const activePositions = Number(rawSummary.activePositions ?? 0);
    const totalPositions = Number(rawSummary.totalPositions ?? positions.length);

    return {
        totalInvested,
        currentValue,
        unrealizedPnL,
        unrealizedPnLPercent: Number(
            rawSummary.unrealizedPnLPercent ??
                rawSummary.totalProfitLossPercentage ??
                (totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0)
        ),
        activePositions,
        completedPositions: Number(rawSummary.completedPositions ?? Math.max(0, totalPositions - activePositions)),
        topHolding: allocations.length > 0 ? allocations[0]?.symbol || null : null,
        allocations,
    };
};

export function calculateAssetPortfolioSummary(
    positions: AssetPosition[] = [],
    supportedAssets: SupportedAsset[] = []
): AssetPortfolioSummary {
    const assetMap = new Map<string, SupportedAsset>();
    supportedAssets.forEach((asset) => {
        assetMap.set(asset.symbol, asset);
    });

    const totalsBySymbol = new Map<SupportedAssetSymbol, number>();

    let totalInvested = 0;
    let currentValue = 0;
    let unrealizedPnL = 0;
    let activePositions = 0;
    let completedPositions = 0;

    positions.forEach((position) => {
        const symbol = normalizeSymbol(position.assetSymbol, 'BTC');
        const invested = Number(position.amountInvested || 0);
        const value = Number(
            position.currentValue ??
                (position.unitsHeld && position.currentPrice ? position.unitsHeld * position.currentPrice : invested + Number(position.unrealizedPnL || 0))
        );
        const pnl = Number(position.unrealizedPnL ?? value - invested);

        totalInvested += invested;
        currentValue += value;
        unrealizedPnL += pnl;

        if (position.status === 'COMPLETED') {
            completedPositions += 1;
        } else if (position.status !== 'CANCELLED') {
            activePositions += 1;
        }

        totalsBySymbol.set(symbol, (totalsBySymbol.get(symbol) || 0) + value);
    });

    const allocations = Array.from(totalsBySymbol.entries())
        .map(([symbol, value]) => ({
            symbol,
            name: assetMap.get(symbol)?.name || symbol,
            value,
            percentage: currentValue > 0 ? (value / currentValue) * 100 : 0,
            color: buildAllocationColor(symbol),
        }))
        .sort((a, b) => b.value - a.value);

    const topHolding = allocations.length > 0 ? allocations[0]?.symbol || null : null;
    const unrealizedPnLPercent = totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0;

    return {
        totalInvested,
        currentValue,
        unrealizedPnL,
        unrealizedPnLPercent,
        activePositions,
        completedPositions,
        topHolding,
        allocations,
    };
}

export async function getSupportedAssets(): Promise<SupportedAsset[]> {
    const response = await apiFetch<{ supportedAssets?: SupportedAsset[]; assets?: SupportedAsset[] }>(
        'user/assets/supported',
        { method: 'GET' }
    );

    if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch supported assets');
    }

    const rawAssets = response.data?.supportedAssets || response.data?.assets || [];

    if (!Array.isArray(rawAssets) || rawAssets.length === 0) {
        return DEFAULT_SUPPORTED_ASSETS;
    }

    return rawAssets.map((asset, index) => normalizeSupportedAsset(asset, index));
}

export async function getAssetPositions(): Promise<AssetPositionsResponse> {
    const response = await apiFetch<{
        positions?: AssetPosition[];
        assetPositions?: AssetPosition[];
        supportedAssets?: SupportedAsset[];
        summary?: AssetPortfolioSummary;
        portfolio?: AssetPortfolioSummary;
        allocation?: AssetPortfolioSummary['allocations'];
    }>('user/assets/positions', { method: 'GET' });

    if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch asset positions');
    }

    const rawSupportedAssets =
        response.data?.supportedAssets && response.data.supportedAssets.length > 0
            ? response.data.supportedAssets
            : DEFAULT_SUPPORTED_ASSETS;

    const supportedAssets = rawSupportedAssets.map((asset, index) =>
        normalizeSupportedAsset(asset, index)
    );
    const positions = (response.data?.positions || response.data?.assetPositions || []).map((position) =>
        normalizePosition(position)
    );
    const summary = normalizeSummary(response.data?.summary || response.data?.portfolio, positions, supportedAssets);

    return {
        positions,
        supportedAssets,
        summary,
    };
}

export async function purchaseAsset(payload: BuyAssetPayload): Promise<AssetPurchaseResponse> {
    const response = await apiFetch<AssetPurchaseResponse>('user/assets/purchase', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

    if (!response.success) {
        throw new Error(response.error?.message || 'Failed to purchase asset');
    }

    if (!response.data) {
        return {};
    }

    return {
        position: (response.data as any).position || (response.data as any).assetPosition,
        transaction: response.data.transaction,
        summary: response.data.summary || (response.data as any).portfolio?.summary,
    };
}
