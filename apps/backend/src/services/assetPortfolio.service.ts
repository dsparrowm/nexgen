import db from '@/services/database';
import { getSupportedAsset, type AssetSymbol, type SupportedAsset } from '@/constants/assets';
import { getLiveAssetQuotes, getLiveSupportedAssets } from '@/services/cryptoPrice.service';

const round = (value: number, decimals: number): number => {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Number(value.toFixed(decimals));
};

export interface AssetPositionView {
    id: string;
    symbol: AssetSymbol;
    name: string;
    network: string;
    description: string;
    status: string;
    amountInvested: number;
    unitsHeld: number;
    averageEntryPrice: number;
    currentPrice: number;
    currentValue: number;
    profitLoss: number;
    lastValuationAt: string | null;
    createdAt: string;
    updatedAt: string;
    allocationColor: string;
}

export interface AssetPortfolioAllocation {
    symbol: AssetSymbol;
    name: string;
    currentValue: number;
    amountInvested: number;
    unitsHeld: number;
    percentage: number;
    allocationColor: string;
}

export interface AssetPortfolioSummary {
    totalInvested: number;
    currentValue: number;
    totalPnL: number;
    totalPositions: number;
    activePositions: number;
    allocation: AssetPortfolioAllocation[];
}

export interface AssetPortfolioSnapshot {
    supportedAssets: SupportedAsset[];
    positions: AssetPositionView[];
    summary: AssetPortfolioSummary;
}

const buildAllocation = (positions: AssetPositionView[]): AssetPortfolioAllocation[] => {
    const grouped = positions.reduce<Record<string, AssetPortfolioAllocation>>((acc, position) => {
        const existing = acc[position.symbol];
        const currentValue = round(position.currentValue, 2);
        const amountInvested = round(position.amountInvested, 2);
        const unitsHeld = round(position.unitsHeld, position.symbol === 'USDT' ? 2 : 8);

        if (existing) {
            existing.currentValue += currentValue;
            existing.amountInvested += amountInvested;
            existing.unitsHeld += unitsHeld;
            return acc;
        }

        acc[position.symbol] = {
            symbol: position.symbol,
            name: position.name,
            currentValue,
            amountInvested,
            unitsHeld,
            percentage: 0,
            allocationColor: position.allocationColor
        };

        return acc;
    }, {});

    const totalValue = Object.values(grouped).reduce((sum, entry) => sum + entry.currentValue, 0);

    return Object.values(grouped)
        .map((entry) => ({
            ...entry,
            percentage: totalValue > 0 ? round((entry.currentValue / totalValue) * 100, 2) : 0
        }))
        .sort((a, b) => b.currentValue - a.currentValue);
};

export const serializeAssetPosition = (position: any, currentPriceOverride?: number): AssetPositionView => {
    const asset = getSupportedAsset(position.symbol) ?? {
        symbol: position.symbol,
        name: position.symbol,
        network: 'Unknown network',
        description: 'Unknown asset',
        referencePrice: Number(position.currentPrice || 0),
        minInvestment: 0,
        precision: 8,
        allocationColor: '#94A3B8'
    };

    const amountInvested = round(Number(position.amountInvested), 2);
    const unitsHeld = round(Number(position.unitsHeld), asset.precision);
    const averageEntryPrice = round(Number(position.averageEntryPrice), 2);
    const currentPrice = round(currentPriceOverride ?? Number(position.currentPrice), 2);
    const currentValue = round(unitsHeld * currentPrice, 2);
    const profitLoss = round(currentValue - amountInvested, 2);

    return {
        id: position.id,
        symbol: asset.symbol,
        name: asset.name,
        network: asset.network,
        description: asset.description,
        status: position.status,
        amountInvested,
        unitsHeld,
        averageEntryPrice,
        currentPrice,
        currentValue,
        profitLoss,
        lastValuationAt: position.lastValuationAt ? position.lastValuationAt.toISOString() : null,
        createdAt: position.createdAt.toISOString(),
        updatedAt: position.updatedAt.toISOString(),
        allocationColor: asset.allocationColor
    };
};

export const getAssetPortfolioSnapshot = async (userId: string): Promise<AssetPortfolioSnapshot> => {
    const positions = await db.prisma.$queryRawUnsafe<any[]>(
        `SELECT *
         FROM "asset_positions"
         WHERE "userId" = $1
         ORDER BY "updatedAt" DESC, "createdAt" DESC`,
        userId
    );

    const liveQuotes = positions.length > 0 ? await getLiveAssetQuotes() : new Map<AssetSymbol, { currentPrice: number }>();
    const serializedPositions = positions.map((position) =>
        serializeAssetPosition(position, liveQuotes.get(position.symbol as AssetSymbol)?.currentPrice)
    );
    const allocation = buildAllocation(serializedPositions);
    const totalInvested = serializedPositions.reduce(
        (sum: number, position: AssetPositionView) => sum + position.amountInvested,
        0
    );
    const currentValue = serializedPositions.reduce(
        (sum: number, position: AssetPositionView) => sum + position.currentValue,
        0
    );
    const totalPnL = serializedPositions.reduce(
        (sum: number, position: AssetPositionView) => sum + position.profitLoss,
        0
    );

    const supportedAssets = await getLiveSupportedAssets();

    return {
        supportedAssets,
        positions: serializedPositions,
        summary: {
            totalInvested: round(totalInvested, 2),
            currentValue: round(currentValue, 2),
            totalPnL: round(totalPnL, 2),
            totalPositions: serializedPositions.length,
            activePositions: serializedPositions.filter((position: AssetPositionView) => position.status === 'ACTIVE').length,
            allocation
        }
    };
};
