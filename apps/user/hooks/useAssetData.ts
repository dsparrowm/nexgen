/**
 * useAssetData Hook
 * Custom React hook for managing supported assets, asset positions, and asset purchases
 */

import { useState, useEffect, useCallback } from 'react';
import {
    DEFAULT_SUPPORTED_ASSETS,
    calculateAssetPortfolioSummary,
    getAssetPositions,
    getSupportedAssets,
    purchaseAsset,
    type AssetPortfolioSummary,
    type AssetPosition,
    type BuyAssetPayload,
    type SupportedAsset,
} from '@/utils/api/assetsApi';
import { getLiveAssetQuotes } from '@/utils/api/liveAssetPrices';

const LIVE_PRICE_REFRESH_MS = 60_000;

interface UseAssetDataReturn {
    supportedAssets: SupportedAsset[];
    assetPositions: AssetPosition[];
    assetSummary: AssetPortfolioSummary;
    loading: boolean;
    error: string | null;
    purchaseAsset: (payload: BuyAssetPayload) => Promise<void>;
    refetch: () => Promise<void>;
}

export function useAssetData(): UseAssetDataReturn {
    const [supportedAssets, setSupportedAssets] = useState<SupportedAsset[]>(DEFAULT_SUPPORTED_ASSETS);
    const [assetPositions, setAssetPositions] = useState<AssetPosition[]>([]);
    const [assetSummary, setAssetSummary] = useState<AssetPortfolioSummary>(
        calculateAssetPortfolioSummary([], DEFAULT_SUPPORTED_ASSETS)
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [assets, positionsResponse, liveQuotes] = await Promise.all([
                getSupportedAssets(),
                getAssetPositions(),
                getLiveAssetQuotes(),
            ]);

            const liveAssets = (assets.length > 0 ? assets : DEFAULT_SUPPORTED_ASSETS).map((asset) => {
                const liveQuote = liveQuotes.get(asset.symbol)

                if (!liveQuote) {
                    return asset
                }

                return {
                    ...asset,
                    currentPrice: liveQuote.currentPrice > 0 ? liveQuote.currentPrice : asset.currentPrice,
                    priceChange24h: liveQuote.priceChange24h,
                }
            })

            const livePositions = (positionsResponse.positions || []).map((position) => {
                const liveQuote = liveQuotes.get(position.assetSymbol)
                const currentPrice = liveQuote?.currentPrice && liveQuote.currentPrice > 0
                    ? liveQuote.currentPrice
                    : Number(position.currentPrice || 0)
                const amountInvested = Number(position.amountInvested || 0)
                const currentValue = Number((position.unitsHeld || 0) * currentPrice)
                const unrealizedPnL = currentValue - amountInvested

                return {
                    ...position,
                    currentPrice,
                    currentValue,
                    unrealizedPnL,
                    unrealizedPnLPercent: amountInvested > 0 ? (unrealizedPnL / amountInvested) * 100 : 0,
                }
            })

            setSupportedAssets(liveAssets)
            setAssetPositions(livePositions)
            setAssetSummary(calculateAssetPortfolioSummary(livePositions, liveAssets))
        } catch (err) {
            console.error('Asset data fetch error:', err);
            setError((err as Error).message || 'Failed to fetch asset data');
            setSupportedAssets(DEFAULT_SUPPORTED_ASSETS);
            setAssetPositions([]);
            setAssetSummary(calculateAssetPortfolioSummary([], DEFAULT_SUPPORTED_ASSETS));
        } finally {
            setLoading(false);
        }
    }, []);

    const handlePurchaseAsset = useCallback(
        async (payload: BuyAssetPayload) => {
            try {
                await purchaseAsset(payload);
                await fetchData();
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to purchase asset';
                throw new Error(errorMessage);
            }
        },
        [fetchData]
    );

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchData();
        }, LIVE_PRICE_REFRESH_MS);

        return () => clearInterval(interval);
    }, [fetchData]);

    return {
        supportedAssets,
        assetPositions,
        assetSummary,
        loading,
        error,
        purchaseAsset: handlePurchaseAsset,
        refetch: fetchData,
    };
}
